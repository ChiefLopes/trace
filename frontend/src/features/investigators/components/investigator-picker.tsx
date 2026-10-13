"use client";

import { Check, Loader2, Shield, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";

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

const AGENT_CODENAMES: Record<string, string> = {
  "officer-1": "Agent Vance",
  "officer-2": "Agent Kira",
  "officer-3": "Agent Marcus",
  "officer-4": "Agent Elena",
};

export function InvestigatorPicker({
  investigators,
  action,
  caseId,
  selectedId: initialSelectedId,
}: InvestigatorPickerProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);
  const [previewInvestigator, setPreviewInvestigator] = useState<Investigator | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [loadedSpotlightId, setLoadedSpotlightId] = useState<string | null>(null);
  const spotlightLoaded = Boolean(
    previewInvestigator && loadedSpotlightId === previewInvestigator.id,
  );

  // Close modal with Escape key
  useEffect(() => {
    if (!previewInvestigator) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        setPreviewInvestigator(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewInvestigator, isPending]);

  const handleConfirm = (inv: Investigator) => {
    setPendingId(inv.id);
    setSelectedId(inv.id);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("investigatorId", inv.id);
        if (caseId) formData.set("caseId", caseId);
        await action(formData);
      } catch (error) {
        setPendingId(null);
        throw error;
      }
    });
  };

  return (
    <div className="relative w-full rounded-[6px] bg-[#020719] lg:min-h-[633px] lg:w-[607px] lg:pt-px lg:pl-[37px]">
      {/* Active deployment banner during server transition */}
      {isPending && (
        <div
          role="status"
          aria-live="polite"
          className="animate-in fade-in slide-in-from-top-2 mb-3.5 flex items-center justify-between rounded-lg border border-accent/40 bg-[rgb(2_8_30/0.95)] px-4 py-2.5 shadow-[0_0_24px_rgba(252,163,17,0.35)] backdrop-blur-md duration-200 lg:mr-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-80" />
              <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
            </span>
            <span className="font-display text-[12px] font-black tracking-wider text-accent uppercase">
              Field Deployment In Progress
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#94a3b8]">
            <Loader2 className="size-3.5 animate-spin text-accent" />
            <span className="hidden sm:inline">Initializing mission files…</span>
          </div>
        </div>
      )}

      {/* 2x2 Investigator Grid */}
      <ul className="grid grid-cols-2 gap-x-[22.5px] gap-y-[44.7px] bg-[#030a1d] p-4 lg:h-[608px] lg:w-[546px] lg:grid-cols-[232.16px_232.16px] lg:p-0 lg:pt-[33.34px] lg:pl-[18.67px]">
        {investigators.map((investigator) => {
          const isSelected = selectedId === investigator.id;
          const isCurrentPending = isPending && pendingId === investigator.id;
          const isImageLoaded = Boolean(loadedImages[investigator.id]);

          return (
            <li
              key={investigator.id}
              onClick={() => {
                if (!isPending) setPreviewInvestigator(investigator);
              }}
              className={cn(
                "group relative h-[243.36px] cursor-pointer overflow-hidden rounded-[8.38px] border-[1.8px] bg-linear-to-b from-[#02081c] to-[#051f68] transition-all duration-300",
                isCurrentPending
                  ? "z-10 scale-[1.03] border-accent shadow-[0_0_35px_rgba(252,163,17,0.7)] ring-2 ring-accent"
                  : isPending
                    ? "pointer-events-none scale-[0.98] opacity-30 grayscale-[30%]"
                    : isSelected
                      ? "border-accent/90 shadow-[0_0_16px_-4px_var(--accent)]"
                      : "border-black/20 hover:-translate-y-1 hover:border-accent/80 hover:shadow-[0_0_24px_rgba(252,163,17,0.35)]",
              )}
            >
              {/* Badge: Active or Deploying */}
              {isCurrentPending ? (
                <span className="absolute top-2.5 right-2.5 z-30 flex animate-pulse items-center gap-1.5 rounded border border-accent bg-accent/30 px-2 py-0.5 font-mono text-[9px] font-bold text-accent uppercase shadow-[0_0_10px_var(--accent)] backdrop-blur-xs">
                  <Loader2 className="size-3 animate-spin" />
                  Assigning
                </span>
              ) : isSelected ? (
                <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded border border-accent/70 bg-accent/20 px-2 py-0.5 font-mono text-[9px] font-bold text-accent uppercase backdrop-blur-xs">
                  <Check className="size-3" strokeWidth={2.5} />
                  Active
                </span>
              ) : null}

              {/* Character Figure Area */}
              <div className="absolute inset-x-0 top-0 h-[216px]">
                {/* Spinner when image hasn't loaded yet */}
                {!isImageLoaded && (
                  <div
                    aria-hidden
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2"
                  >
                    <div className="relative grid size-8 place-items-center">
                      <span className="absolute inset-0 animate-spin rounded-full border border-accent/40 border-t-accent [animation-duration:1s]" />
                      <Loader2 className="size-4 animate-spin text-accent" />
                    </div>
                    <span className="font-mono text-[9.5px] font-bold tracking-wider text-accent/85 uppercase">
                      Loading investigator…
                    </span>
                  </div>
                )}

                <Image
                  src={investigator.image.src}
                  alt={investigator.description}
                  width={investigator.image.width}
                  height={investigator.image.height}
                  sizes="200px"
                  style={{ height: investigator.pickerHeight }}
                  onLoad={() => {
                    setLoadedImages((prev) => ({ ...prev, [investigator.id]: true }));
                  }}
                  className={cn(
                    "absolute bottom-0 left-1/2 w-auto max-w-none -translate-x-1/2 transition-all duration-300",
                    !isImageLoaded ? "opacity-0" : "opacity-100",
                    isCurrentPending ? "scale-[1.04]" : "group-hover:scale-[1.05]",
                  )}
                />
              </div>

              {/* Action Button at bottom */}
              <div className="absolute inset-x-0 top-[216px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isPending) setPreviewInvestigator(investigator);
                  }}
                  disabled={isPending}
                  aria-label={`Select ${investigator.description.toLowerCase()}`}
                  className={cn(
                    "group/btn relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-[4px] bg-linear-to-r from-accent via-[#ffbe4d] to-accent p-[6.28px] font-display text-[13.34px] leading-[1.62] font-black text-white uppercase transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
                    isCurrentPending
                      ? "cursor-wait shadow-[0_0_24px_rgba(252,163,17,0.85)] brightness-110"
                      : isPending
                        ? "cursor-not-allowed opacity-50"
                        : isSelected
                          ? "shadow-[0_0_16px_rgba(252,163,17,0.6)] hover:shadow-[0_0_24px_rgba(252,163,17,0.85)] hover:brightness-110"
                          : "shadow-[0_0_10px_rgba(252,163,17,0.3)] hover:shadow-[0_0_22px_rgba(252,163,17,0.75)] hover:brightness-110",
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-in-out group-hover/btn:translate-x-full"
                  />
                  {isCurrentPending ? (
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Deploying…</span>
                    </span>
                  ) : isSelected ? (
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Check
                        className="size-4 transition-transform duration-200 group-hover/btn:scale-125"
                        strokeWidth={2.5}
                      />
                      <span>Selected</span>
                    </span>
                  ) : (
                    <span className="relative z-10">Select</span>
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Spotlight Pop-Out Modal when Character is Clicked */}
      {previewInvestigator && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="investigator-preview-title"
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) {
              setPreviewInvestigator(null);
            }
          }}
        >
          <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-accent/40 bg-linear-to-b from-[#030a24] via-[#020719] to-[#010410] shadow-[0_0_60px_rgba(0,18,60,0.9),0_0_40px_rgba(252,163,17,0.25)] sm:flex-row">
            {/* Top specular highlight edge */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent to-transparent" />

            {/* Close (X) button */}
            <button
              type="button"
              onClick={() => setPreviewInvestigator(null)}
              disabled={isPending}
              aria-label="Close character preview"
              className="absolute top-3.5 right-3.5 z-30 grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:pointer-events-none"
            >
              <X className="size-4" />
            </button>

            {/* Left Column: Spotlight Stage with Character */}
            <div className="relative flex h-[360px] w-full shrink-0 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(0,36,114,0.45)_0%,rgba(0,4,16,0.95)_100%)] sm:h-[460px] sm:w-[320px]">
              {/* Spotlight beam */}
              <Image
                src="/effects/spotlight-beam.png"
                alt=""
                width={462}
                height={760}
                className="pointer-events-none absolute -top-8 left-1/2 max-w-none -translate-x-1/2 opacity-80 mix-blend-plus-lighter"
              />

              {/* Floor spotlight ellipse */}
              <Image
                src="/effects/spotlight-floor.png"
                alt=""
                width={412}
                height={183}
                className="pointer-events-none absolute -bottom-6 left-1/2 max-w-none -translate-x-1/2 opacity-75"
              />

              {/* Loading spinner while spotlight image hasn't loaded yet */}
              {!spotlightLoaded && (
                <div
                  aria-hidden
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-[#000412]/60 backdrop-blur-[1px]"
                >
                  <div className="relative grid size-10 place-items-center">
                    <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent/40 border-t-accent [animation-duration:1.2s]" />
                    <Loader2 className="size-5 animate-spin text-accent" />
                  </div>
                  <span className="font-mono text-[10.5px] font-bold tracking-widest text-accent uppercase drop-shadow-[0_0_8px_rgba(252,163,17,0.7)]">
                    Loading investigator…
                  </span>
                  <span className="font-mono text-[9px] tracking-wider text-[#808a9d] uppercase">
                    Retrieving high-res dossier
                  </span>
                </div>
              )}

              {/* Full-Body Character Artwork */}
              <Image
                src={previewInvestigator.fullBody?.src ?? previewInvestigator.image.src}
                alt={previewInvestigator.description}
                width={previewInvestigator.fullBody?.width ?? previewInvestigator.image.width}
                height={previewInvestigator.fullBody?.height ?? previewInvestigator.image.height}
                onLoad={() => setLoadedSpotlightId(previewInvestigator.id)}
                className={cn(
                  "relative z-10 max-h-[320px] w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] transition-opacity duration-300 sm:max-h-[420px]",
                  !spotlightLoaded ? "opacity-0" : "opacity-100 motion-safe:animate-fade-up",
                )}
              />

              {/* Holographic scanner laser when actively deploying */}
              {isPending && (
                <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#010619]/80 backdrop-blur-[2px]">
                  <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_var(--accent)] motion-safe:animate-scanline" />
                  <div className="relative mb-2 grid size-14 place-items-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-accent/70 [animation-duration:2.5s]" />
                    <div className="absolute inset-1.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent [animation-direction:reverse] [animation-duration:1.2s]" />
                    <Loader2 className="relative z-10 size-6 animate-spin text-accent" />
                  </div>
                  <span className="font-display text-[11px] font-black tracking-widest text-accent uppercase">
                    Deploying Agent
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Dossier Information & Confirmation Controls */}
            <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-accent uppercase shadow-[0_0_12px_rgba(252,163,17,0.25)]">
                    <Shield className="size-3 text-accent" />
                    Operative Dossier
                  </span>
                  {selectedId === previewInvestigator.id && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-[#94a3b8] uppercase">
                      Currently Assigned
                    </span>
                  )}
                </div>

                <h2
                  id="investigator-preview-title"
                  className="mt-3 font-display text-2xl font-black tracking-wide text-white uppercase sm:text-3xl"
                >
                  {AGENT_CODENAMES[previewInvestigator.id] ?? "Special Investigator"}
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-[#94a3b8] sm:text-sm">
                  {previewInvestigator.description}
                </p>

                {/* Tactical Spec Grid */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4 font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-[#808a9d] uppercase">
                      Specialization
                    </span>
                    <span className="font-semibold text-white">Onchain Forensics</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#808a9d] uppercase">Clearance</span>
                    <span className="font-semibold text-accent">Level 4 Field Lead</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#808a9d] uppercase">
                      Trace Integrity
                    </span>
                    <span className="font-semibold text-white">99.8% Solved</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#808a9d] uppercase">Division</span>
                    <span className="font-semibold text-white">TRACE Cyber Command</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Choose or Cancel */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewInvestigator(null)}
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 font-display text-[12px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  Cancel & Choose Another
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirm(previewInvestigator)}
                  disabled={isPending}
                  className="group/deploy relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-accent via-[#ffbe4d] to-accent px-6 font-display text-[12px] font-black tracking-wider text-accent-foreground uppercase shadow-[0_0_24px_rgba(252,163,17,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(252,163,17,0.8)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-in-out group-hover/deploy:translate-x-full"
                  />
                  {isPending ? (
                    <span className="relative z-10 flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Deploying Operative…</span>
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center gap-2">
                      <Check className="size-4" strokeWidth={2.5} />
                      <span>Choose Investigator</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
