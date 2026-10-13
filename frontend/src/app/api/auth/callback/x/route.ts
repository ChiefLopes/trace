import { type NextRequest, NextResponse } from "next/server";

import { AFTER_LOGIN, LOGIN_PAGE } from "@/features/auth/routes";
import { authResponseSchema } from "@/features/api/schemas";
import { serverApi } from "@/lib/api/server";
import { createSession } from "@/features/auth/session";
import { setFlash } from "@/features/flash/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    if (error) {
      console.warn(`[auth/x] OAuth authorization returned error: ${error}`);
    }
    await setFlash("x-auth-failed");
    return NextResponse.redirect(new URL(LOGIN_PAGE, request.url));
  }

  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://trace-brown-ten.vercel.app/api/auth/callback/x"
      : "http://localhost:3000/api/auth/callback/x";

  try {
    const auth = await serverApi.post("/api/auth/callback/x", authResponseSchema, {
      body: {
        code,
        state: state ?? undefined,
        redirectUri,
      },
    });

    await createSession(auth.user.id, auth.token, auth.expiresIn, true);
    await setFlash("signed-in");
    return NextResponse.redirect(new URL(AFTER_LOGIN, request.url));
  } catch (err) {
    console.error("[auth/x] Failed to complete X sign-in:", err);
    await setFlash("x-auth-failed");
    return NextResponse.redirect(new URL(LOGIN_PAGE, request.url));
  }
}
