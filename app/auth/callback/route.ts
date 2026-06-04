import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeRedirect } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Accept both "next" and "redirectTo" so either param name works.
  const nextParam = searchParams.get("next") ?? searchParams.get("redirectTo");
  const safeNext = safeRedirect(nextParam);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not configured. Contact support.")}`
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

  // Case A: PKCE code flow (OAuth, email confirmation via PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(
        "We could not verify your account. The confirmation link may have expired — please sign up or sign in again."
      )}`
    );
  }

  // Case B: Email OTP / token_hash flow (email confirmation, password recovery)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "invite" | "magiclink" | "email_change",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(
        "Your verification link is invalid or has expired. Please sign up again or request a new link."
      )}`
    );
  }

  // Case C: No server-visible params — Supabase may have redirected with a
  // hash fragment (#access_token=...) that only the browser can read.
  // Delegate to the client-side confirm page which calls getSession() to
  // process the hash automatically.
  const confirmUrl = new URL(`${origin}/auth/confirm`);
  confirmUrl.searchParams.set("next", safeNext);
  return NextResponse.redirect(confirmUrl.toString());
}
