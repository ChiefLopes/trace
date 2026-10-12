import "server-only";

import { serverApi } from "@/lib/api/server";

import { currentUserResponseSchema, dashboardSummaryResponseSchema } from "@/features/api/schemas";

import type { CurrentUserResponse, DashboardSummaryResponse } from "@/features/api/schemas";

export async function getCurrentUserProfile(): Promise<CurrentUserResponse> {
  return serverApi.get("/api/me", currentUserResponseSchema);
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return serverApi.get("/api/me/dashboard", dashboardSummaryResponseSchema);
}
