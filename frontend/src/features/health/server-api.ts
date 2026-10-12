import "server-only";

import { z } from "zod";

import { serverApi } from "@/lib/api/server";

export async function healthCheck(): Promise<{ status: string }> {
  return serverApi.get("/api/health", z.object({ status: z.string() }));
}
