import type { Route } from "next";
import { redirect } from "next/navigation";

import { getNextOpenCaseId } from "@/features/cases/active-case";
import { caseRoutes } from "@/features/cases/routes";
import { getDashboardSummary } from "@/features/dashboard/data";

// This page only redirects, so it can never render an instant shell.
export const instant = false;

/**
 * Open the player's active case, or the next available open case if the previous one is closed.
 */
export default async function CasesPage() {
  const { activeCase } = await getDashboardSummary();
  if (activeCase) {
    redirect(caseRoutes.briefing(activeCase.id));
  }
  const nextCaseId = await getNextOpenCaseId();
  if (nextCaseId) {
    redirect(caseRoutes.briefing(nextCaseId));
  }
  redirect("/dashboard" as Route);
}
