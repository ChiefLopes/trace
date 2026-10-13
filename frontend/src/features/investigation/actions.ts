"use server";

import { revalidatePath } from "next/cache";

import { closeCase } from "@/features/cases/active-case";
import { caseRoutes } from "@/features/cases/routes";
import { submitCaseTheory } from "@/features/evidence/server-api";

export async function verifyAndSolveCaseAction(caseId: string, destinationWalletId: string) {
  try {
    const outcome = await submitCaseTheory(caseId, {
      destination: destinationWalletId,
      scenario: "layered",
      theory:
        "Traced 20 SOL from treasury through intermediary wallets and hopped to exchange where it was cashed out.",
    });

    await closeCase(caseId);

    revalidatePath(caseRoutes.outcome(caseId));
    revalidatePath(caseRoutes.workspace(caseId));
    revalidatePath("/dashboard");
    revalidatePath("/cases");
    revalidatePath("/(dashboard)", "layout");

    return {
      success: true,
      outcome,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to verify trace and submit outcome.",
    };
  }
}
