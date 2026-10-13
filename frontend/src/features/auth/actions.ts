"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api/errors";
import { setFlash } from "@/features/flash/server";

import {
  login as loginApi,
  signup as signupApi,
  logout as logoutApi,
  getGoogleAuthUrl as getGoogleAuthUrlApi,
  getXAuthUrl as getXAuthUrlApi,
} from "./server-api";
import { clearFailures, recordFailure, retryAfterMinutes } from "./rate-limit";
import { AFTER_LOGIN, LOGIN_PAGE, safeRedirectPath } from "./routes";
import { loginSchema, signupSchema } from "./schemas";
import { createSession, deleteSession } from "./session";
import { SessionConfigError } from "./session-token";

/** Either why sign-in failed, or where to go next (always a safe, same-site game path). */
export type LoginResult = { error: string } | { redirectTo: Route; displayName: string };

/** Best-effort client IP for throttling (set by the hosting proxy). */
async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Sign in through the backend. Server Actions are public endpoints, so inputs
 * and throttling are re-checked here. Next.js checks Origin against Host to
 * reject cross-origin Server Action calls.
 * On success it returns the destination rather than calling redirect(): the
 * form calls this directly, and a redirect thrown from an awaited action would
 * land in the form's error handling.
 */
export async function loginAction(values: unknown, next?: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const { email, password, remember } = parsed.data;

  const throttleKey = `${await clientIp()}|${email}`;
  const wait = retryAfterMinutes(throttleKey);
  if (wait > 0) {
    return { error: `Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` };
  }

  let displayName = email.split("@")[0] ?? email;
  try {
    const auth = await loginApi({ email, password });
    await createSession(auth.user.id, auth.token, auth.expiresIn, remember);
    displayName = auth.user.username;
  } catch (error) {
    if (error instanceof SessionConfigError) {
      console.error(`[auth] ${error.message}`);
      return { error: "Sign-in isn't configured on this server yet." };
    }
    if (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 401 || error.status === 403)
    ) {
      recordFailure(throttleKey);
      return { error: "Incorrect email or password." };
    }
    throw error;
  }
  clearFailures(throttleKey);

  return { redirectTo: safeRedirectPath(next), displayName };
}

/** Create the account and establish the same backend-backed session as login. */
export async function signupAction(values: unknown): Promise<LoginResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return { error: "Enter valid account details and check your password." };

  try {
    const auth = await signupApi({
      username: parsed.data.username,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    await createSession(auth.user.id, auth.token, auth.expiresIn, false);
    return { redirectTo: AFTER_LOGIN, displayName: auth.user.username };
  } catch (error) {
    if (error instanceof SessionConfigError) {
      console.error(`[auth] ${error.message}`);
      return { error: "Sign-up isn't configured on this server yet." };
    }
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function logoutAction() {
  try {
    await logoutApi();
  } catch {
    // Local logout must still work if the backend is unavailable.
  }
  await deleteSession();
  await setFlash("signed-out");
  redirect(LOGIN_PAGE);
}

/** Retrieve the Google OAuth2 consent authorization URL from the backend. */
export async function getGoogleAuthUrlAction(): Promise<{ url: string } | { error: string }> {
  try {
    const res = await getGoogleAuthUrlApi();
    return { url: res.url };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "Google sign-in is temporarily unavailable. Please try again." };
  }
}

/** Retrieve the X (Twitter) OAuth 2.0 authorization URL from the backend. */
export async function getXAuthUrlAction(): Promise<{ url: string } | { error: string }> {
  try {
    const redirectUri =
      process.env.NODE_ENV === "production"
        ? "https://trace-brown-ten.vercel.app/api/auth/callback/x"
        : "http://localhost:3000/api/auth/callback/x";

    const res = await getXAuthUrlApi(redirectUri);
    return { url: res.url };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "X sign-in is temporarily unavailable. Please try again." };
  }
}
