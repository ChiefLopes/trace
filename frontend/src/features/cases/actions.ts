"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { caseRoutes } from "./routes";
import { getNextOpenCaseId, setActiveCase } from "./active-case";

/** Start a new case, setting it as active and clearing previous case objectives. */
export async function startNewCase(targetCaseId?: string) {
  const nextCaseId = targetCaseId ?? (await getNextOpenCaseId()) ?? "case-002";
  await setActiveCase(nextCaseId);

  revalidatePath("/dashboard");
  revalidatePath("/cases");
  revalidatePath("/(dashboard)", "layout");

  redirect(caseRoutes.briefing(nextCaseId));
}
