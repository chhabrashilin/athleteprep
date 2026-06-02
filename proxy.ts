import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSafeRedirect } from "@/lib/auth/redirect";

// Routes that never require authentication
const PUBLIC_PATHS = new Set([
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/error",
  "/privacy",
  "/feedback",
  "/request-access",
  "/support",
  "/demo",
]);

// Route prefixes that never require authentication
// /share/ routes validate access via share token and visibility mode server-side
const PUBLIC_PREFIXES = ["/auth/", "/_next/", "/api/", "/share/"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Static files: anything with an extension (e.g. .svg, .ico, .png)
  if (/\.\w+$/.test(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and Next.js internals through first.
  if (isPublicPath(pathname)) {
    const { response } = await updateSession(request);
    return response;
  }

  // For all other paths, refresh session and check authentication.
  const { response, user } = await updateSession(request);

  if (!user) {
    // Unauthenticated: redirect to login, preserving the intended destination.
    // Only store a redirectTo param for safe same-origin paths.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    if (isSafeRedirect(pathname)) {
      loginUrl.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except Next.js static files, images, and favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
