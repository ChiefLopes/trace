"use client";

import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils/cn";

type TraceLossModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  title?: string;
  message?: string;
  caseId?: string;
};

/**
 * Modal shown when the investigator verifies the wrong trace/destination.
 * Displays a 'Trail Lost' state with an immediate 'Retry' CTA.
 */
export function TraceLossModal({
  isOpen,
  onClose,
  onRetry,
  title = "Investigation Trail Lost",
  message = "You verified an intermediate hop or incorrect wallet. The illicit funds continued moving or did not terminate at this address.",
  caseId,
}: TraceLossModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleRetry = () => {
    dialogRef.current?.close();
    if (onRetry) {
      onRetry();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cn(
        "fixed inset-0 m-auto w-[min(540px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-red-500/30 p-0 text-foreground backdrop-blur-[16px]",
        "bg-linear-to-b from-[#18040a] via-[#100412] to-[#08020d]",
        "shadow-[0_25px_60px_-15px_rgb(0_0_0/0.9),0_0_40px_2px_rgb(239_68_68/0.25)]",
        "backdrop:bg-black/60 backdrop:backdrop-blur-[4px]",
        "motion-safe:open:animate-fade-up",
      )}
    >
      {/* Specular glare along top edge with crimson/red tone */}
      <span
        aria-hidden
        className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-red-500/70 to-transparent"
      />

      <div className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/60 px-3.5 py-1.5 font-display text-[11px] font-bold tracking-[1.8px] text-red-400 uppercase shadow-[0_0_15px_-2px_rgb(239_68_68/0.4)]">
            <AlertTriangle className="size-3.5 text-red-400" />
            Trail Compromised
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-[#9aa3bd]">
            Trace Incomplete
          </span>
        </div>

        <h2
          id={titleId}
          className="pt-1 font-display text-[22px] leading-snug font-black tracking-tight text-white uppercase"
        >
          {title}
        </h2>

        <p className="font-sans text-[14px] leading-relaxed text-[#cbd5e1]">{message}</p>

        <div className="mt-1 w-full rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 text-xs text-red-200/90">
          <p className="font-medium">
            💡 <strong className="text-red-300">Investigator Tip:</strong> Review connected wallets
            and recent transactions. Look for outgoing transfers where funds were hopped or
            forwarded to an exchange.
          </p>
        </div>

        <div className="mt-3 flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {caseId && (
            <Link
              href={`/investigation/${caseId}`}
              onClick={() => dialogRef.current?.close()}
              className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center font-display text-[12px] font-bold tracking-wider text-white uppercase transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:translate-y-0 active:scale-[0.97] sm:w-auto"
            >
              <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Workspace
            </Link>
          )}

          <button
            type="button"
            onClick={handleRetry}
            autoFocus
            className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-red-600 via-rose-500 to-amber-600 px-6 py-3.5 font-display text-[13px] font-black tracking-wider text-white uppercase shadow-[0_0_22px_-2px_rgb(239_68_68/0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_0_32px_rgb(239_68_68/0.75)] hover:brightness-105 active:translate-y-0 active:scale-[0.97]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
            />
            <RotateCcw
              className="relative z-10 size-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-90"
              strokeWidth={2.5}
            />
            <span className="relative z-10">Retry Trace</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
