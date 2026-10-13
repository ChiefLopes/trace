import "server-only";

import { cache } from "react";

import {
  dashboardSummaryResponseSchema,
  type DashboardSummaryResponse,
} from "@/features/api/schemas";
import { getActiveCaseId, getClosedCaseIds } from "@/features/cases/active-case";
import { getCaseFile } from "@/features/cases/data";

import { getDashboardSummary as getDashboardSummaryApi } from "./server-api";

export { dashboardSummaryResponseSchema };
export type DashboardSummary = DashboardSummaryResponse;

/** Fetch dashboard summary from backend (memoized per request) with active case & objective clearing. */
export const getDashboardSummary = cache(
  async function getDashboardSummary(): Promise<DashboardSummary> {
    let summary: DashboardSummary;
    try {
      summary = await getDashboardSummaryApi();
    } catch {
      summary = {
        activeCase: { id: "case-001", label: "Case 001" },
        objectives: { completed: 0, total: 5 },
        evidenceCount: 0,
        academy: { completed: 0, total: 8 },
      };
    }

    const [activeCaseCookie, closedCases] = await Promise.all([
      getActiveCaseId(),
      getClosedCaseIds(),
    ]);

    // 1. If user switched to or selected a new case via cookie:
    if (activeCaseCookie && activeCaseCookie !== "none") {
      if (activeCaseCookie !== summary.activeCase?.id) {
        const file = await getCaseFile(activeCaseCookie);
        const total = file?.objectives.length ?? 5;
        return {
          ...summary,
          activeCase: {
            id: activeCaseCookie,
            label: file?.number ?? activeCaseCookie.replace("-", " ").toUpperCase(),
          },
          // New case starts with cleared/fresh objectives
          objectives: { completed: 0, total },
          evidenceCount: 0,
        };
      }
    }

    // 2. If the current active case is closed:
    if (summary.activeCase && closedCases.includes(summary.activeCase.id)) {
      // The case objectives should be cleared because the case is closed
      return {
        ...summary,
        activeCase: null,
        objectives: { completed: 0, total: 0 },
      };
    }

    return summary;
  },
);
