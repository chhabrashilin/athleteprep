import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses Next.js cookie store for session management.
 *
 * NOTE: The Database generic type is intentionally omitted here because the
 * hand-written placeholder type (lib/supabase/types.ts) doesn't fully satisfy
 * Supabase's internal generic constraints. Replace the placeholder with generated
 * types (`supabase gen types typescript`) before enabling strict typing.
 * See /docs/SUPABASE_SETUP.md for generation instructions.
 *
 * setAll uses a try/catch because Server Components have read-only cookies —
 * the catch is expected and safe in that context.
 *
 * Returns null if Supabase env vars are not configured.
 */
export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // In Server Components the cookie store is read-only.
          // Session refresh writes fail silently here; the middleware handles
          // the actual cookie update on the response.
        }
      },
    },
  });
}

/**
 * Creates a Supabase client using the service role key.
 * Bypasses RLS — MUST only be used server-side (Server Components, Server Actions).
 * Never expose this client or its key to the browser.
 *
 * Used for shared report routes where the viewer may not be authenticated,
 * but we need to read report data after validating a secure share token.
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Convenience: gets the authenticated user server-side.
 * Returns null if not configured or not authenticated.
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
