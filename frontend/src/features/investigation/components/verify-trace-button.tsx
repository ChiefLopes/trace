"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";
import { getCaseEvidenceAction } from "@/app/(dashboard)/evidence/[caseId]/collection-actions";
import { verifyAndSolveCaseAction } from "@/features/investigation/actions";
import { TraceLossModal } from "@/features/investigation/components/trace-loss-modal";

type VerifyTraceButtonProps = {
  caseId: string;
  walletId: string;
  walletLabel: string;
  isFinalDestination: boolean;
  evidenceCount?: number;
  className?: string;
};

/**
 * CTA Button for verifying whether the player followed the right trace to the final destination.
 * - If wrong trace: shows TraceLossModal with a retry CTA.
 * - If right trace but no evidence: redirects to evidence screen to add evidence.
 * - If right trace and has evidence: submits and redirects to the success outcome screen.
 */
export function VerifyTraceButton({
  caseId,
  walletId,
  walletLabel,
  isFinalDestination,
  evidenceCount = 0,
  className,
}: VerifyTraceButtonProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      // 1. If not the final destination, user lost the trail!
      if (!isFinalDestination) {
        setIsLossModalOpen(true);
        setIsVerifying(false);
        return;
      }

      // 2. Refresh latest evidence count
      let currentEvidenceCount = evidenceCount;
      try {
        const latestItems = await getCaseEvidenceAction(caseId);
        currentEvidenceCount = latestItems.length;
      } catch {
        // Fallback to prop
      }

      // 3. If right trace but no evidence, redirect to the evidence screen
      if (currentEvidenceCount === 0) {
        toast.info("Final destination located!", {
          description: "Please pin your evidence to complete case verification.",
        });
        router.push(
          `/evidence/${encodeURIComponent(caseId)}?fromWallet=${encodeURIComponent(walletId)}&verified=1` as Route,
        );
        return;
      }

      // 4. Right trace and has evidence! Solve case and navigate to success screen
      const res = await verifyAndSolveCaseAction(caseId, walletId);
      if (res.success) {
        toast.success("Trace verified! Case solved.", {
          description: "All objectives met. Opening case outcome report...",
        });
        router.push(`/investigation/${encodeURIComponent(caseId)}/outcome` as Route);
        router.refresh();
      } else {
        toast.error("Could not verify trace", { description: res.message });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleVerify}
        disabled={isVerifying}
        aria-label="Verify trace"
        className={cn(
          "inline-flex h-[33px] items-center justify-center gap-1.5 rounded-xl bg-accent px-4 font-display text-[11px] font-black tracking-wide text-accent-foreground uppercase shadow-[0_0_18px_-3px_var(--accent)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-70",
          className,
        )}
      >
        {isVerifying ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            <ShieldCheck className="size-3.5" strokeWidth={2.5} />
            Verify Trace
          </>
        )}
      </button>

      <TraceLossModal
        isOpen={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        onRetry={() => setIsLossModalOpen(false)}
        title="Investigation Trail Lost"
        message={`You verified the trace at ${walletLabel}. However, this is an intermediate hop — not the final cash-out destination. The illicit funds continued moving. Inspect connected wallets and transactions to locate where the funds ended up.`}
        caseId={caseId}
      />
    </>
  );
}
