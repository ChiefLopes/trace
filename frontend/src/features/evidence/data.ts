import "server-only";

import { z } from "zod";

import {
  evidencePromptSchema,
  caseOutcomeSchema,
  type EvidencePrompt,
  type CaseOutcome,
  THEORY_MIN_LENGTH,
  THEORY_MAX_LENGTH,
} from "@/features/api/schemas";

import {
  getEvidencePrompt as getEvidencePromptApi,
  submitCaseTheory as submitCaseTheoryApi,
  getCaseOutcome as getCaseOutcomeApi,
} from "./server-api";

export { evidencePromptSchema, caseOutcomeSchema, THEORY_MIN_LENGTH, THEORY_MAX_LENGTH };
export type { EvidencePrompt, CaseOutcome };

/** MOCK prompts by case, copied from the design. */
const prompts: Record<string, EvidencePrompt> = {
  "case-001": {
    caseId: "case-001",
    destinationWalletIds: ["wallet-b", "wallet-c", "wallet-d", "exchange"],
    scenarios: [
      { id: "direct", label: "A single direct transfer" },
      { id: "layered", label: "Layered through multiple wallets then cashed out" },
      { id: "swapped", label: "Swapped into a token then back" },
      { id: "burned", label: "Burned to a null address" },
    ],
    theoryPlaceholder:
      "Explain the trail in your own words... e.g. 'The 20 SOL left the treasury at 02:43, hopped through three fresh wallets, and ended at an exchange deposit address.'",
  },
};

export const evidenceCaseIds: string[] = Object.keys(prompts);

/**
 * Validates a submission against the case's own choices, so a tampered form
 * can't submit an option that was never offered.
 */
export function evidenceSubmissionSchema(prompt: EvidencePrompt) {
  return z.object({
    destination: z.enum(prompt.destinationWalletIds as [string, ...string[]], {
      error: "Choose the wallet where the funds ended up",
    }),
    scenario: z.enum(prompt.scenarios.map((s) => s.id) as [string, ...string[]], {
      error: "Choose what happened to the funds",
    }),
    theory: z
      .string()
      .trim()
      .min(THEORY_MIN_LENGTH, `Explain the trail in at least ${THEORY_MIN_LENGTH} characters`)
      .max(THEORY_MAX_LENGTH, `Keep your theory under ${THEORY_MAX_LENGTH} characters`),
  });
}

export type EvidenceFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: Partial<Record<"destination" | "scenario" | "theory", string>>;
      values: { destination?: string; scenario?: string; theory?: string };
    }
  | { status: "received"; message: string };

/** Fetch evidence prompt from backend with fallback to mock prompts. */
export async function getEvidencePrompt(caseId: string): Promise<EvidencePrompt | null> {
  try {
    const prompt = await getEvidencePromptApi(caseId);
    if (prompt) return prompt;
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
  }
  const found = prompts[caseId];
  return found ? evidencePromptSchema.parse(found) : null;
}

/** Submit case theory to backend. */
export async function submitCaseTheory(
  caseId: string,
  values: z.infer<ReturnType<typeof evidenceSubmissionSchema>>,
): Promise<CaseOutcome> {
  return submitCaseTheoryApi(caseId, values);
}

/** Fetch case outcome from backend. */
export async function getCaseOutcome(caseId: string): Promise<CaseOutcome | null> {
  try {
    return await getCaseOutcomeApi(caseId);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    return null;
  }
}
