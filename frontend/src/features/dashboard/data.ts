import "server-only";

import {
  dashboardSummaryResponseSchema,
  type DashboardSummaryResponse,
} from "@/features/api/schemas";

import { getDashboardSummary as getDashboardSummaryApi } from "./server-api";

export { dashboardSummaryResponseSchema };
export type DashboardSummary = DashboardSummaryResponse;

/** Fetch dashboard summary from backend. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return getDashboardSummaryApi();
}
