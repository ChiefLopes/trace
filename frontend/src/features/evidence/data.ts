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

/** Validates a submission against the case's own choices. */
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

/** Fetch evidence prompt from backend. Returns null if not found. */
export async function getEvidencePrompt(caseId: string): Promise<EvidencePrompt | null> {
  try {
    return await getEvidencePromptApi(caseId);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/** Submit case theory to backend. */
export async function submitCaseTheory(
  caseId: string,
  values: z.infer<ReturnType<typeof evidenceSubmissionSchema>>,
): Promise<CaseOutcome> {
  return submitCaseTheoryApi(caseId, values);
}

/** Fetch case outcome from backend. Returns null if not found. */
export async function getCaseOutcome(caseId: string): Promise<CaseOutcome | null> {
  try {
    return await getCaseOutcomeApi(caseId);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

// MOCK case IDs for static generation - replace with real API when available
export const evidenceCaseIds: string[] = ["case-001"];
