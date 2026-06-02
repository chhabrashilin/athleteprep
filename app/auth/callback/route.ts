import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeRedirect } from "@/lib/auth/redirect";

/**
 * Handles Supabase auth callbacks:
 * - Email confirmation links (contains token_hash + type)
 * - OAuth redirects (contains code, used for PKCE exchange)
 *
 * After a successful exchange, redirects to `next` param or /dashboard.
 * On failure, redirects to /auth/error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const safeNext = safeRedirect(searchParams.get("next"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=Supabase is not configured`
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  // PKCE code exchange (OAuth, magic link with PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?message=Could not authenticate user`
    );
  }

  // Token hash verification (email confirmation, password recovery)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "invite",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?message=Verification link is invalid or expired`
    );
  }

  return NextResponse.redirect(
    `${origin}/auth/error?message=Missing authentication parameters`
  );
}
