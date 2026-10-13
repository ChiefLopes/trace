import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { currentUserResponseSchema } from "@/features/api/schemas";

import { LOGIN_PAGE } from "./routes";
import {
  BACKEND_AUTH_COOKIE,
  SESSION_COOKIE,
  signSession,
  verifySessionToken,
} from "./session-token";

export const currentUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatar: z.object({ src: z.string() }),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

export async function createSession(
  userId: string,
  backendToken: string,
  expiresIn: number,
  remember: boolean,
) {
  if (!backendToken || !Number.isInteger(expiresIn) || expiresIn <= 0) {
    throw new Error("The backend returned an invalid session.");
  }
  const lifetime = expiresIn;
  const token = await signSession({ sub: userId, exp: Math.floor(Date.now() / 1000) + lifetime });

  const cookieStore = await cookies();
  const options = {
    httpOnly: true, // not readable from JavaScript, so XSS can't steal it
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // not sent on cross-site POSTs (CSRF)
    path: "/",
    ...(remember && { maxAge: lifetime }),
  } as const;

  cookieStore.set(SESSION_COOKIE, token, options);
  cookieStore.set(BACKEND_AUTH_COOKIE, backendToken, options);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(BACKEND_AUTH_COOKIE);
}

/**
 * The signed-in player's session, or a redirect to the login page. This is
 * the real check: the Proxy only redirects early. Call it (or getCurrentUser)
 * wherever player data is read. Memoised per request.
 */
export const verifySession = cache(async () => {
  // Request-time only: the expiry check reads the clock, which must never be
  // frozen into a prerendered shell.
  await connection();
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect(LOGIN_PAGE);
  return session;
});

/**
 * The signed-in player. The backend validates the access token and supplies
 * the account profile; the local signed marker is only a fast page gate.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await verifySession();
  try {
    const user = await serverApi.get("/api/me", currentUserResponseSchema);
    if (user.id !== session.sub) redirect(`${LOGIN_PAGE}?session=expired`);
    return user;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect(`${LOGIN_PAGE}?session=expired`);
    }
    throw error;
  }
});

/**
 * Returns the currently signed-in player if a valid session exists, or null.
 * Does not redirect. Memoised per request.
 */
export const getOptionalCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (!session) return null;
    const user = await serverApi.get("/api/me", currentUserResponseSchema);
    if (user.id !== session.sub) return null;
    return user;
  } catch {
    return null;
  }
});
