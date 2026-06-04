import { safeRedirect } from "@/lib/auth/redirect";

export type CallbackKind =
  | { kind: "code"; code: string; next: string }
  | { kind: "token_hash"; tokenHash: string; type: string; next: string }
  | { kind: "confirm"; next: string };

/**
 * Parses Supabase auth callback URL search params into a typed discriminated
 * union so the route handler and tests share the same logic.
 *
 * Supports:
 *   ?code=...                    → PKCE code exchange
 *   ?token_hash=...&type=...    → email OTP / token hash
 *   (neither)                    → implicit hash flow; delegate to client page
 */
export function parseCallbackParams(
  searchParams: URLSearchParams
): CallbackKind {
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam =
    searchParams.get("next") ?? searchParams.get("redirectTo");
  const next = safeRedirect(nextParam);

  if (code) return { kind: "code", code, next };
  if (tokenHash && type) return { kind: "token_hash", tokenHash, type, next };
  return { kind: "confirm", next };
}
