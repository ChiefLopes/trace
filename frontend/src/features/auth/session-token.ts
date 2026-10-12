import { z } from "zod";

/*
 * Stateless frontend session marker: `base64url(payload).base64url(HMAC-SHA256)`.
 *
 * Signed, not encrypted: the payload holds nothing secret (player id, display
 * name, expiry), and the signature means it can't be forged or edited without
 * SESSION_SECRET. Uses Web Crypto only, so it runs in the Proxy as well as on
 * the server. Never import it from client code; there is nothing to verify
 * there and the secret must stay server-side.
 *
 * This cookie gates frontend page routes. The backend access token is stored
 * separately in an HttpOnly cookie and is what API requests send as Bearer.
 */

export const SESSION_COOKIE = "trace_session";
export const BACKEND_AUTH_COOKIE = process.env.BACKEND_AUTH_COOKIE ?? "trace_backend_token";

const sessionPayloadSchema = z.object({
  /** Player id. */
  sub: z.string().min(1),
  /** Expiry, seconds since the epoch. */
  exp: z.number().int().positive(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export class SessionConfigError extends Error {
  override readonly name = "SessionConfigError";
}

/**
 * The signing secret, or null when it's missing or too short: then no session
 * verifies and login reports "not configured" (fail closed). There is
 * deliberately no fallback in code, in any environment.
 */
function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;
let keyFor: string | null = null;

function signingKey(secret: string) {
  if (!keyPromise || keyFor !== secret) {
    keyFor = secret;
    keyPromise = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return keyPromise;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = sessionSecret();
  if (!secret) {
    throw new SessionConfigError("SESSION_SECRET is not set (needs 32+ characters).");
  }
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(secret),
    encoder.encode(body),
  );
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** The session in a cookie value, or null if it is missing, forged, malformed or expired. */
export async function verifySessionToken(
  token: string | undefined,
  now = Date.now(),
): Promise<SessionPayload | null> {
  const secret = sessionSecret();
  if (!token || !secret || token.length > 4096) return null;

  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length > 0) return null;

  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;
  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    "HMAC",
    await signingKey(secret),
    signatureBytes,
    encoder.encode(body),
  );
  if (!valid) return null;

  const bodyBytes = fromBase64Url(body);
  if (!bodyBytes) return null;
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(bodyBytes));
  } catch {
    return null;
  }
  const parsed = sessionPayloadSchema.safeParse(json);
  if (!parsed.success || parsed.data.exp * 1000 <= now) return null;
  return parsed.data;
}
