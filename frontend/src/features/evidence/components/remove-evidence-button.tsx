"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";

import {
  removeEvidenceAction,
  type CollectionActionState,
} from "@/app/(dashboard)/evidence/[caseId]/collection-actions";

const initialState: CollectionActionState = { status: "idle" };

export function RemoveEvidenceButton({
  caseId,
  evidenceId,
}: {
  caseId: string;
  evidenceId: string;
}) {
  const [state, action, pending] = useActionState(
    removeEvidenceAction.bind(null, caseId, evidenceId),
    initialState,
  );
  if (state.status === "removed") return <span className="text-xs text-accent">Removed</span>;

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 text-xs text-[#aab3c8] hover:text-destructive disabled:opacity-60"
      >
        <Trash2 className="size-3.5" /> {pending ? "Removing…" : "Remove"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="mt-1 max-w-48 text-xs text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
