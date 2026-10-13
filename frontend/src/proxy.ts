import { type NextRequest, NextResponse } from "next/server";

import { AFTER_LOGIN, isAuthPage, isProtectedPath, LOGIN_PAGE } from "@/features/auth/routes";
import {
  BACKEND_AUTH_COOKIE,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/features/auth/session-token";
import { FLASH_COOKIE, type FlashKey, flashCookieOptions } from "@/features/flash/messages";

/**
 * Prefetches run the Proxy too (e.g. the landing page prefetching /dashboard).
 * They must not queue a toast for a page the visitor hasn't opened.
 */
function isPrefetch(request: NextRequest) {
  return (
    request.headers.has("next-router-prefetch") ||
    /prefetch/i.test(request.headers.get("sec-purpose") ?? request.headers.get("purpose") ?? "")
  );
}

function withFlash(response: NextResponse, request: NextRequest, key: FlashKey) {
  if (!isPrefetch(request)) response.cookies.set(FLASH_COOKIE, key, flashCookieOptions);
  return response;
}

const AUTH_COOKIE = BACKEND_AUTH_COOKIE;
const PROTECTED_API_PATHS = (
  process.env.PROTECTED_API_PATHS ??
  "/api/auth/session,/api/auth/logout,/api/user,/api/me,/api/cases"
)
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

/**
 * Runs before every game, auth, and API route (see `config.matcher`).
 *
 * - Forwards auth token to backend for protected /api/* paths.
 * - Signed-out visitors to a game page are sent to /login with `?next=`.
 * - Signed-in players visiting /login or /signup go to the dashboard.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Handle API routes: forward auth cookie as Bearer token to backend
  if (pathname.startsWith("/api/")) {
    const isProtectedApi = PROTECTED_API_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p.replace(/\/$/, "")}/`),
    );
    if (isProtectedApi) {
      const token = request.cookies.get(AUTH_COOKIE)?.value;
      if (token) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.delete("cookie");
        requestHeaders.set("Authorization", `Bearer ${token}`);
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    }
    return NextResponse.next();
  }

  // 2. Handle Page route access
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // A backend 401 can invalidate an otherwise unexpired local marker. Let the
  // login page clear both cookies instead of bouncing straight back to /dashboard.
  if (isAuthPage(pathname) && request.nextUrl.searchParams.get("session") === "expired") {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  if (!session && isProtectedPath(pathname)) {
    const login = new URL(LOGIN_PAGE, request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(login);
    // Clear an expired or tampered cookie instead of re-checking it every request.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return withFlash(response, request, token ? "session-expired" : "auth-required");
  }

  if (session && isAuthPage(pathname)) {
    return withFlash(
      NextResponse.redirect(new URL(AFTER_LOGIN, request.url)),
      request,
      "already-signed-in",
    );
  }

  const response = NextResponse.next();

  // When opening a case route, set it as the active case and unmark it from closed cases
  const caseMatch = pathname.match(/^\/(?:cases|investigation)\/([a-zA-Z0-9_-]+)/);
  if (caseMatch && !isPrefetch(request)) {
    const caseId = caseMatch[1];
    if (caseId && !["file", "accept", "outcome"].includes(caseId)) {
      response.cookies.set("trace_active_case", caseId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      // If this case was previously closed, remove it from closed cases cookie so it's fresh
      const closedCookie = request.cookies.get("trace_closed_cases")?.value;
      if (closedCookie) {
        try {
          const closedList = JSON.parse(closedCookie);
          if (Array.isArray(closedList) && closedList.includes(caseId)) {
            const updated = closedList.filter((id: string) => id !== caseId);
            response.cookies.set("trace_closed_cases", JSON.stringify(updated), {
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
            });
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }

  return response;
}

export const config = {
  // Matched routes for page protection and API token proxying
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/investigation/:path*",
    "/evidence/:path*",
    "/academy/:path*",
    "/login",
    "/signup",
    "/api/:path*",
  ],
};
