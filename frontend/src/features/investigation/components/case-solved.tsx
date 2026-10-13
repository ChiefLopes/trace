"use client";

import { useState } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import type { CaseOutcome } from "../outcome";

/*
 * "Case solved" (Figma: Trace Game Design › Desktop - 18). Sizes are the
 * Figma values at 1:1; fractional pixels come from the design's own scale.
 */

type Portrait = { src: string; width: number; height: number; alt: string };

/** Round, glowing portrait above the card. Crop reproduces the Figma framing (head to waist). */
function VictoryAvatar({ portrait }: { portrait: Portrait }) {
  return (
    <div className="relative size-[160px] sm:size-[190px] lg:size-[214.76px]">
      <div className="absolute -inset-[10px] rounded-full border-[1.68px] border-dashed border-accent/30 sm:-inset-[12px] lg:-inset-[13.42px]" />
      <div className="absolute -inset-[5px] rounded-full bg-linear-to-r from-accent/50 via-[rgb(99_102_241/0.2)] to-accent/50 blur-[3.36px] sm:-inset-[6px] lg:-inset-[6.71px]" />
      <div className="relative size-full overflow-hidden rounded-full bg-linear-to-b from-accent via-[#051851] to-[#1e1b4b] shadow-[0_0_40.27px_rgb(5_24_81/0.9)]">
        <Image
          src={portrait.src}
          alt={portrait.alt}
          width={portrait.width}
          height={portrait.height}
          sizes="(max-width: 640px) 180px, (max-width: 1024px) 210px, 232px"
          loading="eager"
          className="absolute -top-2 -left-7 h-auto w-[172px] max-w-none sm:top-[-6px] sm:left-[-32px] sm:w-[205px] lg:top-[-8.4px] lg:left-[-38.7px] lg:w-[231.6px]"
        />
      </div>
    </div>
  );
}

function CornerNotch({ className }: { className: string }) {
  return <span aria-hidden className={cn("absolute size-[13.8px] border-accent/70", className)} />;
}

function Stat({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between rounded-[10.35px] border-[0.86px] border-white/8 bg-linear-to-b from-[rgb(7_23_66/0.7)] to-[rgb(3_11_36/0.8)] px-3 py-1.5 sm:h-[46.58px] sm:px-[14.66px] sm:py-0">
      <dt className="flex items-center gap-2 text-[11px] font-medium text-[#d1d5db] sm:gap-[6.9px] sm:text-[12.08px]">
        <Image src={icon} alt="" width={14} height={14} className="size-[13.8px] shrink-0" />
        <span>{label}</span>
      </dt>
      <dd className="shrink-0 text-sm font-black tracking-[0.39px] text-[#f5f5f5] sm:text-[15.53px]">
        {children}
      </dd>
    </div>
  );
}

function OutOf({ value, total }: { value: number; total: number }) {
  return (
    <>
      <span className="text-accent">{value}</span> / {total}
    </>
  );
}

type CaseSolvedProps = {
  outcome: CaseOutcome;
  portrait: Portrait;
  homeHref: Route;
  nextCaseHref: Route;
};

export function CaseSolved({ outcome, portrait, homeHref, nextCaseHref }: CaseSolvedProps) {
  const [isGoingHome, setIsGoingHome] = useState(false);
  const [isStartingNext, setIsStartingNext] = useState(false);
  const isNavigating = isGoingHome || isStartingNext;
  const perfect = outcome.score === outcome.maxScore;

  return (
    <section
      aria-labelledby="case-solved-title"
      className="relative isolate flex w-full max-w-[1104px] justify-center overflow-hidden rounded-2xl bg-[#010614] p-3.5 font-roboto sm:rounded-3xl sm:p-6 lg:rounded-[40px] lg:p-[34.5px]"
    >
      {/* Atmosphere: amber glow behind the avatar, tactical grid, sparkles. */}
      <div aria-hidden className="absolute inset-0 -z-10 lg:inset-[0_0_37.5px_0]">
        <div className="absolute inset-0 bg-[radial-gradient(854.8px_1009.8px_at_552px_299.8px,rgb(252_163_17/0.18)_0%,rgb(129_94_49/0.39)_21%,rgb(67_59_65/0.495)_31.5%,rgb(36_41_73/0.5475)_36.75%,rgb(5_24_81/0.6)_42%,rgb(3_15_51/0.79)_60%,rgb(1_6_20/0.98)_78%)]" />
        <Image
          src="/effects/grid-scanlines.png"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 1104px"
          className="object-cover opacity-25"
        />
        <Image
          src="/effects/sparkles.png"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 1104px"
          className="object-cover"
        />
      </div>

      <div className="relative flex w-full max-w-[662.4px] flex-col items-center">
        <div
          aria-hidden
          className="absolute top-[-40px] left-1/2 size-[260px] -translate-x-1/2 rounded-full bg-accent/15 blur-[27.6px] sm:size-[300px] lg:top-[-55.2px] lg:left-[165.6px] lg:size-[331.2px] lg:translate-x-0"
        />

        <div className="pb-5 sm:pb-8 lg:pb-[46.98px]">
          <VictoryAvatar portrait={portrait} />
        </div>

        {/* Card with a gradient hairline border and "cyber" corner notches. */}
        <div className="relative w-full max-w-[733.13px] rounded-[20.7px] bg-linear-to-b from-accent/60 via-[rgb(5_24_81/0.4)] to-accent/30 p-[1.29px] shadow-[0_0_51.75px_-8.63px_rgb(5_24_81/0.9)] lg:w-[733.13px] lg:shrink-0">
          <div className="relative flex min-h-0 w-full flex-col items-center overflow-hidden rounded-[19.84px] border-[0.86px] border-white/5 bg-[rgb(2_9_29/0.9)] p-4 pt-6 backdrop-blur-[10.35px] sm:p-7 sm:pt-8 lg:block lg:h-[775px] lg:p-0">
            <div
              aria-hidden
              className="pointer-events-none absolute top-[-88.41px] left-1/2 size-[360px] -translate-x-1/2 rounded-full bg-[repeating-conic-gradient(rgb(252_163_17/0.08)_0deg_15deg,transparent_15deg_30deg)] opacity-35 sm:size-[440px] lg:left-[120.32px] lg:size-[517.5px] lg:translate-x-0"
            />
            <CornerNotch className="top-[10.35px] left-[10.35px] border-t-[1.73px] border-l-[1.73px]" />
            <CornerNotch className="top-[10.35px] right-[10.19px] border-t-[1.73px] border-r-[1.73px]" />
            <CornerNotch className="bottom-[10.79px] left-[10.35px] border-b-[1.73px] border-l-[1.73px] border-accent/40" />
            <CornerNotch className="right-[10.19px] bottom-[10.79px] border-r-[1.73px] border-b-[1.73px] border-accent/40" />

            {/* Title */}
            <div className="relative z-10 flex w-full flex-col items-center gap-2.5 px-2 text-center sm:gap-3.5 sm:px-6 lg:absolute lg:inset-x-0 lg:top-[138px] lg:gap-[17.25px]">
              <p className="flex items-center gap-1.5 px-2.5 py-1 font-display text-sm font-black tracking-[2px] text-accent uppercase sm:gap-[6.9px] sm:px-[12.08px] sm:py-[3.45px] sm:text-lg sm:tracking-[3.38px] lg:text-[27.6px]">
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full bg-accent sm:size-[6.9px]"
                />
                Case solved
              </p>
              <h1
                id="case-solved-title"
                className="pt-1 font-display text-2xl leading-tight font-black text-white uppercase [text-shadow:0_0_34.5px_rgb(5_24_81/0.8),0_1.73px_17.25px_rgb(255_255_255/0.35)] sm:text-3xl lg:text-[40px] lg:leading-[1.62]"
              >
                {outcome.title}
              </h1>
              <p className="w-full max-w-[561.49px] text-xs leading-relaxed font-semibold text-[#d1d5db] sm:text-[13.8px] lg:leading-[20.7px]">
                {outcome.summary}
              </p>
            </div>

            {/* Score */}
            <div className="relative z-10 mt-4 w-full px-1 sm:mt-5 sm:px-2 lg:absolute lg:top-[338.17px] lg:right-[34.34px] lg:left-[34.5px] lg:mt-0 lg:px-0">
              <div className="relative flex flex-col gap-2 rounded-xl border-[0.86px] border-accent/22 bg-[linear-gradient(141.61deg,rgb(8_24_69/0.65)_0%,rgb(2_9_31/0.85)_100%)] p-3.5 shadow-[0_17.25px_43.13px_-8.63px_rgb(0_0_0/0.8),inset_0_0.86px_0.86px_0.86px_rgb(255_255_255/0.15)] backdrop-blur-[6.04px] sm:gap-[6.9px] sm:rounded-[13.8px] sm:p-5 lg:p-[25.01px]">
                <span
                  aria-hidden
                  className="absolute inset-x-4 top-0 h-[1.73px] bg-linear-to-r from-transparent via-accent/80 to-transparent sm:inset-x-[34.5px]"
                />
                <p className="flex items-center gap-[6.9px] border-b-[0.86px] border-white/10 pb-2 text-[11px] font-bold tracking-[1.21px] text-[#d1d5db] uppercase sm:pb-[11.21px] sm:text-[12.08px]">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-[1.73px] bg-[#10e599] shadow-[0_0_6.9px_#10e599] sm:size-[8.63px]"
                  />
                  Investigation score
                </p>
                <p className="flex items-baseline justify-center gap-2 pt-1 text-center sm:gap-[10.35px] sm:pt-[6.9px]">
                  <span className="text-4xl leading-none font-black tracking-[-1.55px] text-accent [text-shadow:0_0_32.78px_rgb(16_229_153/0.35),0_0_15.53px_#d39228] sm:text-5xl lg:text-[62.1px]">
                    {outcome.score}
                  </span>
                  <span className="text-xl leading-none font-bold text-[#9ca3af] sm:text-2xl lg:text-[31.05px]">
                    / {outcome.maxScore}
                  </span>
                </p>
                {perfect && (
                  <p className="text-center text-[10.35px] leading-[13.8px] font-bold tracking-[1.04px] text-accent uppercase [text-shadow:0_0_27.6px_rgb(252_163_17/0.3),0_0_13.8px_rgb(252_163_17/0.65)]">
                    ★ Perfect score achieved ★
                  </p>
                )}
                <dl className="grid grid-cols-1 gap-2 pt-2.5 pb-1 sm:grid-cols-2 sm:gap-[10.35px] sm:pt-[13.8px] sm:pb-[10.35px]">
                  <Stat icon="/icons/outcome/clues.svg" label="Clues discovered">
                    <OutOf value={outcome.clues.found} total={outcome.clues.total} />
                  </Stat>
                  <Stat icon="/icons/outcome/evidence.svg" label="Evidence collected">
                    <span className="text-accent">{outcome.evidenceCollected}</span>
                  </Stat>
                  <Stat icon="/icons/outcome/traces.svg" label="Correct Traces">
                    <OutOf value={outcome.traces.correct} total={outcome.traces.total} />
                  </Stat>
                  <Stat icon="/icons/outcome/hints.svg" label="Hints used">
                    <span className="text-accent">{outcome.hintsUsed}</span>
                  </Stat>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="relative z-10 mt-4 flex w-full flex-col-reverse items-stretch justify-center gap-2.5 pt-2 pb-1 sm:mt-5 sm:flex-row sm:items-center sm:gap-3 lg:absolute lg:top-[688.6px] lg:right-[29.43px] lg:left-[39.41px] lg:mt-0 lg:w-auto lg:gap-[12.08px] lg:p-0 lg:pt-[6.9px]">
              <Link
                href={homeHref}
                onClick={() => setIsGoingHome(true)}
                className={cn(
                  "flex items-center justify-center gap-[6.9px] rounded-[10.35px] border-[0.86px] border-white/15 bg-[rgb(1_6_20/0.8)] px-5 py-3 font-display text-xs font-bold tracking-[0.6px] text-[#d1d5db] uppercase shadow-[0_0.86px_1.73px_rgb(0_0_0/0.05)] transition-colors hover:border-white/30 sm:px-[21.56px] sm:py-[11.21px] sm:text-[12.08px]",
                  isNavigating && "pointer-events-none cursor-wait opacity-85",
                )}
              >
                {isGoingHome ? (
                  <>
                    <Loader2 className="size-[13.8px] shrink-0 animate-spin text-[#d1d5db]" />
                    <span>Loading…</span>
                  </>
                ) : (
                  <>
                    <Image
                      src="/icons/outcome/home.svg"
                      alt=""
                      width={14}
                      height={14}
                      className="size-[13.8px]"
                    />
                    <span>Home</span>
                  </>
                )}
              </Link>
              <Link
                href={nextCaseHref}
                onClick={() => setIsStartingNext(true)}
                className={cn(
                  "flex items-center justify-center gap-[8.63px] rounded-[10.35px] bg-linear-to-r from-accent via-[#ffbb33] to-accent px-6 py-3.5 font-display text-xs font-black tracking-[1.21px] text-[#010614] uppercase shadow-[0_0_21.56px_rgb(252_163_17/0.55)] transition-[filter] hover:brightness-110 sm:px-[27.6px] sm:py-[12.08px] sm:text-[12.08px]",
                  isNavigating && "pointer-events-none cursor-wait opacity-85",
                )}
              >
                {isStartingNext ? (
                  <>
                    <Loader2 className="size-[13.8px] shrink-0 animate-spin text-[#010614]" />
                    <span>Starting…</span>
                  </>
                ) : (
                  <>
                    <span>Start new case</span>
                    <Image
                      src="/icons/outcome/arrow.svg"
                      alt=""
                      width={14}
                      height={14}
                      className="size-[13.8px]"
                    />
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
