"use client";

import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTransition, useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { Investigator } from "../data";

type InvestigatorPickerProps = {
  investigators: Investigator[];
  /** Server Action that records the choice and moves on (receives `investigatorId` and `caseId`). */
  action: (formData: FormData) => Promise<void>;
  /** Case to open after choosing, if any. */
  caseId?: string;
  /** Currently selected investigator ID. */
  selectedId?: string;
};

/**
 * 2×2 investigator picker (Figma: Desktop - 4, 607×633 panel, 232px cards).
 * Each SELECT posts to a Server Action with instant visual feedback and loading states.
 */
export function InvestigatorPicker({
  investigators,
  action,
  caseId,
  selectedId: initialSelectedId,
}: InvestigatorPickerProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);

  return (
    <div className="w-full rounded-[6px] bg-[#020719] lg:h-[633px] lg:w-[607px] lg:pt-px lg:pl-[37px]">
      <ul className="grid grid-cols-2 gap-x-[22.5px] gap-y-[44.7px] bg-[#030a1d] p-4 lg:h-[608px] lg:w-[546px] lg:grid-cols-[232.16px_232.16px] lg:p-0 lg:pt-[33.34px] lg:pl-[18.67px]">
        {investigators.map((investigator) => {
          const isSelected = selectedId === investigator.id;
          const isCurrentPending = isPending && pendingId === investigator.id;

          return (
            <li
              key={investigator.id}
              className={cn(
                "group relative h-[243.36px] rounded-[8.38px] border-[1.8px] bg-linear-to-b from-[#02081c] to-[#051f68] transition-all duration-200",
                isCurrentPending
                  ? "border-accent shadow-[0_0_24px_-4px_var(--accent)] ring-2 ring-accent/70"
                  : isSelected
                    ? "border-accent/90 shadow-[0_0_16px_-4px_var(--accent)]"
                    : "border-black/20 hover:border-white/20",
              )}
            >
              {/* Badge: Active or Selecting */}
              {isCurrentPending ? (
                <span className="absolute top-2.5 right-2.5 z-10 flex animate-pulse items-center gap-1 rounded border border-accent bg-accent/25 px-2 py-0.5 font-mono text-[9px] font-bold text-accent uppercase backdrop-blur-xs">
                  <Loader2 className="size-3 animate-spin" />
                  Selecting
                </span>
              ) : isSelected ? (
                <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded border border-accent/70 bg-accent/20 px-2 py-0.5 font-mono text-[9px] font-bold text-accent uppercase backdrop-blur-xs">
                  <Check className="size-3" strokeWidth={2.5} />
                  Active
                </span>
              ) : null}

              {/* Figure stands on the SELECT bar; its height is set per figure in Figma. */}
              <div className="absolute inset-x-0 top-0 h-[216px]">
                <Image
                  src={investigator.image.src}
                  alt={investigator.description}
                  width={investigator.image.width}
                  height={investigator.image.height}
                  sizes="200px"
                  style={{ height: investigator.pickerHeight }}
                  className={cn(
                    "absolute bottom-0 left-1/2 w-auto max-w-none -translate-x-1/2 transition-transform duration-200",
                    isCurrentPending ? "scale-[1.03]" : "group-hover:scale-[1.02]",
                  )}
                />
              </div>

              <form
                action={(formData: FormData) => {
                  setPendingId(investigator.id);
                  setSelectedId(investigator.id);
                  startTransition(async () => {
                    try {
                      await action(formData);
                    } catch (error) {
                      setPendingId(null);
                      throw error;
                    }
                  });
                }}
                className="absolute inset-x-0 top-[216px]"
              >
                <input type="hidden" name="investigatorId" value={investigator.id} />
                {caseId && <input type="hidden" name="caseId" value={caseId} />}
                <button
                  type="submit"
                  disabled={isPending}
                  aria-label={`Select ${investigator.description.toLowerCase()}`}
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-accent p-[6.28px] font-display text-[13.34px] leading-[1.62] font-black text-white uppercase transition-all duration-150",
                    isCurrentPending
                      ? "cursor-wait shadow-[0_0_16px_-2px_var(--accent)] brightness-110"
                      : isPending
                        ? "cursor-not-allowed opacity-50"
                        : isSelected
                          ? "shadow-[0_0_12px_-2px_var(--accent)] hover:brightness-110"
                          : "hover:brightness-110",
                  )}
                >
                  {isCurrentPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Selecting…</span>
                    </>
                  ) : isSelected ? (
                    <>
                      <Check className="size-4" strokeWidth={2.5} />
                      <span>Selected</span>
                    </>
                  ) : (
                    <span>Select</span>
                  )}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
