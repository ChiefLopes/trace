"use client";

import { z } from "zod";

import { api } from "@/lib/api/browser";

export async function healthCheck(): Promise<{ status: string }> {
  return api.get("/api/health", z.object({ status: z.string() }));
}
