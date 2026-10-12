import { AddEvidenceButton } from "@/features/evidence/components/add-evidence-button";

/** Adds the selected case entity to the backend evidence collection. */
export function AddToEvidenceLink({
  caseId,
  kind,
  targetId,
  label,
  className,
}: {
  caseId: string;
  kind: "wallet" | "transaction";
  targetId: string;
  label: string;
  className?: string;
}) {
  return (
    <AddEvidenceButton
      caseId={caseId}
      kind={kind}
      targetId={targetId}
      label={label}
      className={className}
    />
  );
}
