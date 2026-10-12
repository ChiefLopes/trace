import "server-only";

import { serverApi } from "@/lib/api/server";

import {
  dashboardSummaryResponseSchema,
  type DashboardSummaryResponse,
} from "@/features/api/schemas";

export { dashboardSummaryResponseSchema };
export type DashboardSummary = DashboardSummaryResponse;

/** Fetch dashboard summary from backend. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return serverApi.get("/api/me/dashboard", dashboardSummaryResponseSchema);
}
