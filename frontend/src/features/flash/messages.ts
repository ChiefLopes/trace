/*
 * Flash messages: toasts for things that happen on the server just before a
 * redirect (logout, being sent to login, picking an investigator).
 *
 * The server sets a short-lived, JS-readable cookie holding only a KEY from
 * this list; the client shows the matching toast once and deletes the cookie.
 * Only known keys are ever shown, so the cookie can't inject text.
 */

export const FLASH_COOKIE = "trace_flash";

/** Long enough to survive the redirect, short enough not to resurface later. */
export const FLASH_MAX_AGE_SECONDS = 60;

export const FLASH_MESSAGES = {
  "signed-out": {
    type: "success",
    title: "You're signed out",
    description: "Case files are locked until you log in again.",
  },
  "auth-required": {
    type: "info",
    title: "Log in to continue",
    description: "The case files are for registered investigators only.",
  },
  "session-expired": {
    type: "warning",
    title: "Your session expired",
    description: "Log in again to pick up where you left off.",
  },
  "already-signed-in": {
    type: "info",
    title: "You're already signed in",
    description: "Back to your dashboard, agent.",
  },
  "investigator-selected": {
    type: "success",
    title: "Investigator assigned",
    description: "Your case briefing is ready.",
  },
  "signed-in": {
    type: "success",
    title: "Welcome back, Agent",
    description: "Your case files are unlocked.",
  },
  "google-auth-failed": {
    type: "error",
    title: "Google authentication failed",
    description: "Could not complete sign-in. Please try again.",
  },
} as const satisfies Record<
  string,
  { type: "success" | "info" | "warning" | "error"; title: string; description?: string }
>;

export type FlashKey = keyof typeof FLASH_MESSAGES;

export function isFlashKey(value: unknown): value is FlashKey {
  return typeof value === "string" && Object.hasOwn(FLASH_MESSAGES, value);
}

/** Cookie options shared by the server helper and the Proxy. */
export const flashCookieOptions = {
  // Readable by the client on purpose: it only ever holds a whitelisted key.
  httpOnly: false,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: FLASH_MAX_AGE_SECONDS,
} as const;
