import "server-only";

import { z } from "zod";
import { caseOutcomeSchema, type CaseOutcome } from "@/features/api/schemas";
import { getCaseOutcome as getCaseOutcomeEvidence } from "@/features/evidence/data";

export { caseOutcomeSchema };
export type { CaseOutcome };

/** MOCK outcomes, values from the Figma "Case solved" screen. */
const outcomes: Record<string, CaseOutcome> = {
  "case-001": {
    caseId: "case-001",
    title: "The missing 20 SOL",
    summary: "You followed the trail to the end. The vault mysteries have been decoded.",
    score: 100,
    maxScore: 100,
    clues: { found: 5, total: 5 },
    evidenceCollected: 2,
    traces: { correct: 5, total: 5 },
    hintsUsed: 0,
  },
};

export const outcomeCaseIds = Object.keys(outcomes);

export async function getCaseOutcome(caseId: string): Promise<CaseOutcome | null> {
  try {
    const outcome = await getCaseOutcomeEvidence(caseId);
    if (outcome) return outcome;
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
  }
  const found = outcomes[caseId];
  return found ? caseOutcomeSchema.parse(found) : null;
}
