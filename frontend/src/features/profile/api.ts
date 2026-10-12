"use client";

import { api } from "@/lib/api/browser";

import { currentUserResponseSchema, dashboardSummaryResponseSchema } from "@/features/api/schemas";

import type { CurrentUserResponse, DashboardSummaryResponse } from "@/features/api/schemas";

export async function getCurrentUserProfile(): Promise<CurrentUserResponse> {
  return api.get("/api/me", currentUserResponseSchema);
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return api.get("/api/me/dashboard", dashboardSummaryResponseSchema);
}
