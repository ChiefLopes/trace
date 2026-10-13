import "server-only";

import { cache } from "react";

import {
  dashboardSummaryResponseSchema,
  type DashboardSummaryResponse,
} from "@/features/api/schemas";

import { getDashboardSummary as getDashboardSummaryApi } from "./server-api";

export { dashboardSummaryResponseSchema };
export type DashboardSummary = DashboardSummaryResponse;

/** Fetch dashboard summary from backend (memoized per request). */
export const getDashboardSummary = cache(
  async function getDashboardSummary(): Promise<DashboardSummary> {
    return getDashboardSummaryApi();
  },
);
