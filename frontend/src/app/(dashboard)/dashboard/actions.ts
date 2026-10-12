"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { listCases } from "@/features/cases/data";
import { setFlash } from "@/features/flash/server";
import { caseRoutes } from "@/features/cases/routes";
import { getInvestigator } from "@/features/investigators/data";
import {
  SELECTED_INVESTIGATOR_COOKIE,
  selectedInvestigatorCookieOptions,
} from "@/features/investigators/selection";
import { updateInvestigator } from "@/features/investigators/server-api";

/**
 * SELECT on the dashboard: remember the investigator, then open the case.
 * Form values are untrusted input, so both ids are checked against known values
 * (this also means the redirect can only ever target a real case page).
 */
export async function selectInvestigator(formData: FormData) {
  const investigatorId = formData.get("investigatorId");
  const caseId = formData.get("caseId");

  const investigator =
    typeof investigatorId === "string" ? getInvestigator(investigatorId) : undefined;
  if (!investigator) throw new Error("Unknown investigator");

  // Always store in cookie for instant client-side and fallback access
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_INVESTIGATOR_COOKIE, investigator.id, selectedInvestigatorCookieOptions);

  try {
    await updateInvestigator({ investigatorId: investigator.id });
  } catch (error) {
    // Non-fatal if backend update fails (e.g. unauthenticated guest)
    console.warn("[investigators] Could not update investigator on backend:", error);
  }

  await setFlash("investigator-selected");

  const cases = await listCases();
  const selectedCaseExists =
    typeof caseId === "string" && cases.some((availableCase) => availableCase.id === caseId);

  if (selectedCaseExists && typeof caseId === "string") {
    redirect(caseRoutes.briefing(caseId));
  }
  redirect("/cases");
}
