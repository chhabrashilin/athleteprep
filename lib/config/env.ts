/**
 * Environment variable validation for GameIQ.
 *
 * SERVER-ONLY: This module reads server-side secrets. Do not import from
 * client components. Client-safe feature flags live in feature-flags.ts.
 *
 * Behavior:
 *   - In production, missing required vars throw immediately on first access.
 *   - In development, missing vars log a warning and return a safe default.
 *   - Mock mode never requires AI API keys.
 *   - Real AI mode requires the matching provider key.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Env = "production" | "development" | "test";

function nodeEnv(): Env {
  return (process.env.NODE_ENV as Env | undefined) ?? "development";
}

function isProduction(): boolean {
  return nodeEnv() === "production";
}

function getRequired(key: string): string {
  const value = process.env[key];
  if (!value) {
    const msg = `[GameIQ] Missing required environment variable: ${key}`;
    if (isProduction()) {
      throw new Error(msg);
    }
    // Development: warn but continue so the dev server stays running
    console.warn(`\x1b[33m${msg}\x1b[0m`);
    return "";
  }
  return value;
}

function getOptional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export const appUrl = getOptional("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
export const appName = getOptional("NEXT_PUBLIC_APP_NAME", "GameIQ");

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

/** Public anon key — safe to expose to the browser via the server-rendered page. */
export const supabaseUrl = getRequired("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = getRequired("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Service role key — bypasses RLS. NEVER expose to the browser.
 * Only access this from server-side code (Server Components, Server Actions,
 * Route Handlers). It is intentionally not prefixed NEXT_PUBLIC_.
 */
export function getServiceRoleKey(): string {
  return getRequired("SUPABASE_SERVICE_ROLE_KEY");
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export const storageBucket = getOptional("NEXT_PUBLIC_STORAGE_BUCKET", "game-videos");
export const thumbnailBucket = getOptional("NEXT_PUBLIC_THUMBNAIL_BUCKET", "game-thumbnails");
export const reportExportBucket = getOptional("REPORT_EXPORT_BUCKET", "report-exports");

// ---------------------------------------------------------------------------
// AI Provider
// ---------------------------------------------------------------------------

export type AIProviderName = "mock" | "openai" | "anthropic" | "gemini";

const VALID_PROVIDERS: AIProviderName[] = ["mock", "openai", "anthropic", "gemini"];

function resolveAIProvider(): AIProviderName {
  const raw = getOptional("AI_PROVIDER", "mock");
  if (!VALID_PROVIDERS.includes(raw as AIProviderName)) {
    const msg = `[GameIQ] Unknown AI_PROVIDER value: "${raw}". Valid options: ${VALID_PROVIDERS.join(", ")}. Falling back to "mock".`;
    console.warn(`\x1b[33m${msg}\x1b[0m`);
    return "mock";
  }
  return raw as AIProviderName;
}

export const aiProvider: AIProviderName = resolveAIProvider();

/**
 * Validates that the required API key is present when real AI is enabled.
 * Called at request time inside the AI pipeline (not at module load) so that
 * mock mode does not require any keys at startup.
 */
export function requireAIKey(provider: AIProviderName): string {
  const keyMap: Record<AIProviderName, string> = {
    mock: "",
    openai: process.env.OPENAI_API_KEY ?? "",
    anthropic: process.env.ANTHROPIC_API_KEY ?? "",
    gemini: process.env.GEMINI_API_KEY ?? "",
  };

  if (provider === "mock") return "";

  const key = keyMap[provider];
  if (!key) {
    throw new Error(
      `[GameIQ] AI_PROVIDER is set to "${provider}" but the matching API key is missing. ` +
        `Set ${provider.toUpperCase()}_API_KEY in your environment variables, ` +
        `or set AI_PROVIDER=mock to use the zero-cost mock provider.`
    );
  }
  return key;
}

export const openaiModel = getOptional("OPENAI_MODEL", "gpt-4o-mini");
export const anthropicModel = getOptional("ANTHROPIC_MODEL", "claude-3-5-haiku-latest");
export const geminiModel = getOptional("GEMINI_MODEL", "gemini-1.5-flash");

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/**
 * Comma-separated list of email addresses allowed to access /admin/* routes.
 * Returns an empty array if not configured (all admin routes deny access).
 */
export function getAdminEmails(): string[] {
  const raw = getOptional("ADMIN_EMAILS", "");
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Feature flag env reads (raw booleans for server-side use)
// Client-facing feature flags are in lib/config/feature-flags.ts.
// ---------------------------------------------------------------------------

export const enableMockData = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true";
export const enableRealAI = process.env.NEXT_PUBLIC_ENABLE_REAL_AI === "true";
export const enableVideoProcessing = process.env.NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING === "true";

// ---------------------------------------------------------------------------
// Production startup validation
// ---------------------------------------------------------------------------

/**
 * Call this once at application startup (e.g., in layout.tsx server component)
 * to surface misconfiguration early with a clear error rather than a cryptic
 * runtime failure later.
 *
 * Only runs in production. Silent in development and test.
 */
export function validateProductionEnv(): void {
  if (!isProduction()) return;

  const errors: string[] = [];

  // Supabase — always required in production
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) errors.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) errors.push("SUPABASE_SERVICE_ROLE_KEY");

  // Real AI key — required only when real AI is explicitly enabled
  if (enableRealAI && aiProvider !== "mock") {
    const keyName = `${aiProvider.toUpperCase()}_API_KEY`;
    if (!process.env[keyName]) errors.push(keyName);
  }

  if (errors.length > 0) {
    throw new Error(
      `[GameIQ] Production startup failed. Missing required environment variables:\n` +
        errors.map((e) => `  • ${e}`).join("\n") +
        `\n\nSet these in your Vercel project settings (Settings → Environment Variables).`
    );
  }
}
