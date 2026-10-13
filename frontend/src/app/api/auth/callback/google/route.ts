import { type NextRequest, NextResponse } from "next/server";

import { AFTER_LOGIN, LOGIN_PAGE } from "@/features/auth/routes";
import { googleAuth } from "@/features/auth/server-api";
import { createSession } from "@/features/auth/session";
import { setFlash } from "@/features/flash/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    if (error) {
      console.warn(`[auth/google] OAuth authorization returned error: ${error}`);
    }
    await setFlash("google-auth-failed");
    return NextResponse.redirect(new URL(LOGIN_PAGE, request.url));
  }

  try {
    const auth = await googleAuth({ code });
    await createSession(auth.user.id, auth.token, auth.expiresIn, true);
    await setFlash("signed-in");
    return NextResponse.redirect(new URL(AFTER_LOGIN, request.url));
  } catch (err) {
    console.error("[auth/google] Failed to exchange authorization code:", err);
    await setFlash("google-auth-failed");
    return NextResponse.redirect(new URL(LOGIN_PAGE, request.url));
  }
}
