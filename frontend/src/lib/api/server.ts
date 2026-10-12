import "server-only";

import { cookies } from "next/headers";

import { serverEnv } from "@/config/env.server";
import { BACKEND_AUTH_COOKIE } from "@/features/auth/session-token";

import { createHttpClient } from "./http";

/**
 * API client for Server Components, Server Actions and Route Handlers.
 * Talks to the backend directly; a relative /api URL would not resolve on the server.
 */
export const serverApi = createHttpClient(serverEnv.API_BASE_URL, async () => {
  const headers: Record<string, string> = {};
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(BACKEND_AUTH_COOKIE)?.value;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Outside request context
  }
  return headers;
});
