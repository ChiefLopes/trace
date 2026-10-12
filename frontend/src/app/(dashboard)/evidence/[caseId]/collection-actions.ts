"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { caseRoutes } from "@/features/cases/routes";
import { evidenceItemRequestSchema, type EvidenceItemRequest } from "@/features/api/schemas";
import { addEvidence, listEvidence, removeEvidence } from "@/features/evidence/server-api";

export type CollectionActionState = {
  status: "idle" | "added" | "removed" | "error";
  message?: string;
};

function revalidateEvidence(caseId: string) {
  revalidatePath(caseRoutes.evidence(caseId));
  revalidatePath(caseRoutes.workspace(caseId));
}

export async function getCaseEvidenceAction(caseId: string): Promise<EvidenceItemRequest[]> {
  return listEvidence(caseId);
}

export async function addEvidenceAction(
  caseId: string,
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const notesRaw = formData.get("notes");
  const notes = typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;

  const parsed = evidenceItemRequestSchema.safeParse({
    kind: formData.get("kind"),
    targetId: formData.get("targetId"),
    label: formData.get("label"),
    notes,
  });
  if (!parsed.success) return { status: "error", message: "This evidence item is invalid." };

  try {
    await addEvidence(caseId, parsed.data);
    revalidateEvidence(caseId);
    return { status: "added", message: "Evidence saved to your notebook." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save evidence.",
    };
  }
}

export async function removeEvidenceAction(
  caseId: string,
  evidenceId: string,
  _previous: CollectionActionState,
  _formData: FormData,
): Promise<CollectionActionState> {
  const id = z.string().min(1).safeParse(evidenceId);
  if (!id.success) return { status: "error", message: "This evidence item is invalid." };

  try {
    let targetEvidenceId = id.data;
    try {
      const current = await listEvidence(caseId);
      const match = current.find((e) => e.id === id.data || e.targetId === id.data);
      if (match?.id) {
        targetEvidenceId = match.id;
      }
    } catch {
      // Fallback to id.data
    }

    await removeEvidence(caseId, targetEvidenceId);
    revalidateEvidence(caseId);
    return { status: "removed" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not remove evidence.",
    };
  }
}
