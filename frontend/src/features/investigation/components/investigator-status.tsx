"use client";

import { HatGlasses, Lightbulb } from "lucide-react";
import { useId, useState } from "react";

import type { Workspace } from "../data";
import { Panel } from "./panel";

type InvestigatorStatusProps = Workspace["investigator"] & {
  hint: string;
  /** Overrides the rank line, e.g. "Investigator Diva" once the case is solved. */
  title?: string;
};

/** Rank + state, with an on-demand hint. */
export function InvestigatorStatus({ rank, state, hint, title }: InvestigatorStatusProps) {
  const [showHint, setShowHint] = useState(false);
  const hintId = useId();

  return (
    <Panel aria-label="Investigator status" className="flex flex-col gap-4 p-[21px] font-roboto">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-[12px] border border-accent/40 bg-[linear-gradient(45deg,rgb(252_163_17/0.2),rgb(0_36_114/0.4))]">
          <HatGlasses className="size-[22px] text-[#e2e8f0]" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-[5px] pb-[3px]">
          <p className="text-[14px] leading-5 font-bold">{title ?? rank}</p>
          <p className="text-[12px] leading-4 text-[#94a3b8]">{state}</p>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={showHint}
        aria-controls={hintId}
        onClick={() => setShowHint((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-accent/50 bg-linear-to-b from-accent/15 to-[rgb(0_6_20/0.4)] px-[17px] py-[11px] text-[14px] leading-5 font-bold text-accent shadow-[0_0_15px_rgb(252_163_17/0.15)] transition-colors hover:border-accent active:scale-[0.98] active:brightness-110"
      >
        <Lightbulb className="size-4 fill-current" />
        {showHint ? "Hide hint" : "Need a hint?"}
      </button>

      {showHint && (
        <p
          id={hintId}
          className="rounded-[12px] border border-accent/20 bg-accent/5 px-3 py-2 text-[13px] leading-[19.5px] text-[#cbd5e1]"
        >
          {hint}
        </p>
      )}
    </Panel>
  );
}
