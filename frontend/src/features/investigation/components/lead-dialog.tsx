"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { renderHighlights } from "@/lib/text/highlight";
import { cn } from "@/lib/utils/cn";

import type { Lead } from "../data";

type LeadDialogProps = {
  lead: Lead;
  /** Where following the lead goes (the transaction or wallet it points at). */
  actionHref: Route;
  /** Override the wait before the lead pops up (0 = immediately). Defaults depend on `lead.trigger`. */
  delayMs?: number;
};

/** "arrival" leads wait this long, so the player can take in the page first. */
export const LEAD_DIALOG_DELAY_MS = 3000;
/** "idle" leads appear after this long without clicks, typing or scrolling. */
export const LEAD_DIALOG_IDLE_MS = 6000;

/** Interactions that show the player is busy; each one restarts an idle countdown. */
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/**
 * Lead modal ("New lead", "Trace update"). It pops up every time the player is
 * on a page that has a lead (product decision); "Later" or Escape closes it.
 * Native <dialog>: focus is trapped inside and the page behind becomes inert.
 */
export function LeadDialog({ lead, actionHref, delayMs }: LeadDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const idle = lead.trigger === "idle";
  const wait = delayMs ?? (idle ? LEAD_DIALOG_IDLE_MS : LEAD_DIALOG_DELAY_MS);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let timer: number | undefined;
    const open = () => {
      if (!dialog.open) dialog.showModal();
      stopListening();
    };
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(open, wait);
    };
    const stopListening = () => {
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, restart, true);
    };

    if (wait <= 0) open();
    else restart();
    if (idle) {
      // Capture phase + passive: see every interaction without slowing scrolling.
      for (const type of ACTIVITY_EVENTS) {
        window.addEventListener(type, restart, { capture: true, passive: true });
      }
    }

    // Must close on cleanup: Next keeps the previous page mounted but hidden
    // (React <Activity>) after navigating, and a hidden *modal* dialog still
    // makes the whole document inert, so the next page couldn't be clicked.
    // Cleanup runs when the page is hidden; the effect re-runs (re-opening the
    // lead) when it's shown again. Leaving before the wait cancels the pop-up.
    return () => {
      window.clearTimeout(timer);
      stopListening();
      dialog.close();
    };
  }, [lead.id, wait, idle]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Figma: Desktop - 9 › "Centered dialog", 536px wide.
      className={cn(
        "m-auto w-[min(536px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border-[1.5px] border-transparent p-0 text-foreground backdrop-blur-[14px]",
        "[background:linear-gradient(145deg,#000b23,#01226d)_padding-box,linear-gradient(120deg,rgb(252_163_17/0.15),rgb(0_36_114/0.55)_35%,#06257a_65%,#fca311)_border-box]",
        "shadow-[0_20px_50px_-10px_rgb(0_0_0/0.7),0_0_35px_2px_rgb(139_92_246/0.25)]",
        "backdrop:bg-black/45 backdrop:backdrop-blur-[3px]",
        "motion-safe:open:animate-fade-up",
      )}
    >
      {/* Specular glare along the top edge. */}
      <span
        aria-hidden
        className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-[#22d3ee] to-transparent opacity-40"
      />
      <div className="flex flex-col items-start gap-3 p-6 sm:p-8">
        <span className="rounded-full border border-[rgb(168_85_247/0.4)] bg-[#000614] py-[7px] pr-[19px] pl-[23px] font-display text-[11px] leading-[16.5px] font-bold tracking-[2.2px] text-accent uppercase shadow-[0_0_20px_-3px_rgb(147_51_234/0.5)]">
          {lead.badge}
        </span>

        <h2
          id={titleId}
          className="pt-[7px] font-display text-[20px] leading-[35.75px] font-bold tracking-[-0.65px] uppercase"
        >
          {lead.title}
        </h2>
        <p className="font-roboto text-[15px] leading-[24.38px] text-[#cbd5e1]">
          {renderHighlights(lead.message, "text-white")}
        </p>

        <div className="flex w-full items-center gap-4 pt-6">
          <Link
            href={actionHref}
            autoFocus
            className="flex-1 rounded-[16px] bg-accent px-6 py-3.5 text-center font-display text-[14px] leading-6 font-bold tracking-[0.4px] text-black uppercase shadow-[0_10px_15px_-3px_rgb(147_51_234/0.4),0_4px_6px_-4px_rgb(147_51_234/0.4)] transition-[filter] hover:brightness-110 active:scale-[0.98] active:brightness-120 sm:text-[16px]"
          >
            {lead.actionLabel}
          </Link>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-[16px] px-5 py-3.5 font-display text-[16px] leading-6 font-black uppercase transition-colors hover:text-accent active:scale-[0.98] active:text-accent"
          >
            Later
          </button>
        </div>
      </div>
    </dialog>
  );
}
