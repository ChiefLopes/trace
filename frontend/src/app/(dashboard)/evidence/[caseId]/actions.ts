"use server";

import { z } from "zod";

import {
  evidenceSubmissionSchema,
  getEvidencePrompt,
  submitCaseTheory,
  type EvidenceFormState,
} from "@/features/evidence/data";

/**
 * Receives the player's conclusion. Form data is untrusted: it is validated
 * against the case's own options before anything else happens.
 * Forwards to the backend, which scores it.
 */
export async function submitEvidence(
  caseId: string,
  _previous: EvidenceFormState,
  formData: FormData,
): Promise<EvidenceFormState> {
  const prompt = await getEvidencePrompt(caseId);
  if (!prompt) throw new Error("Unknown case");

  const values = {
    destination: (formData.get("destination") as string | null) ?? undefined,
    scenario: (formData.get("scenario") as string | null) ?? undefined,
    theory: (formData.get("theory") as string | null) ?? undefined,
  };

  const parsed = evidenceSubmissionSchema(prompt).safeParse(values);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      status: "invalid",
      values,
      fieldErrors: {
        destination: fieldErrors.destination?.[0],
        scenario: fieldErrors.scenario?.[0],
        theory: fieldErrors.theory?.[0],
      },
    };
  }

  try {
    const outcome = await submitCaseTheory(caseId, parsed.data);
    return {
      status: "received",
      message: `Case solved! Score: ${outcome.score}/${outcome.maxScore}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError") {
      return {
        status: "invalid",
        values,
        fieldErrors: { theory: error.message },
      };
    }
    throw error;
  }
}
