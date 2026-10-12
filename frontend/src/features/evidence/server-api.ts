import "server-only";

import { z } from "zod";

import { serverApi } from "@/lib/api/server";

import {
  evidencePromptSchema,
  evidenceItemRequestSchema,
  caseOutcomeSchema,
  evidenceSubmissionRequestSchema,
} from "@/features/api/schemas";

import type {
  EvidencePrompt,
  EvidenceItemRequest,
  CaseOutcome,
  EvidenceSubmissionRequest,
} from "@/features/api/schemas";

export async function listEvidence(caseId: string): Promise<EvidenceItemRequest[]> {
  try {
    return serverApi.get(`/api/cases/${caseId}/evidence`, z.array(evidenceItemRequestSchema));
  } catch {
    return [];
  }
}

export async function addEvidence(
  caseId: string,
  values: EvidenceItemRequest,
): Promise<EvidenceItemRequest> {
  const parsed = evidenceItemRequestSchema.parse(values);
  const res = await serverApi.post(`/api/cases/${caseId}/evidence`, z.unknown(), { body: parsed });
  return (res as EvidenceItemRequest) ?? parsed;
}

export async function removeEvidence(caseId: string, evidenceId: string): Promise<void> {
  await serverApi.delete(`/api/cases/${caseId}/evidence/${evidenceId}`, z.unknown());
}

export async function getEvidencePrompt(caseId: string): Promise<EvidencePrompt> {
  return serverApi.get(`/api/cases/${caseId}/evidence-prompt`, evidencePromptSchema);
}

export async function submitCaseTheory(
  caseId: string,
  values: EvidenceSubmissionRequest,
): Promise<CaseOutcome> {
  const parsed = evidenceSubmissionRequestSchema.parse(values);
  return serverApi.post(`/api/cases/${caseId}/submit`, caseOutcomeSchema, { body: parsed });
}

export async function getCaseOutcome(caseId: string): Promise<CaseOutcome> {
  return serverApi.get(`/api/cases/${caseId}/outcome`, caseOutcomeSchema);
}
