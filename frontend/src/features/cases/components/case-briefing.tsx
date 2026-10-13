"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { Loader2 } from "lucide-react";

import { renderHighlights } from "@/lib/text/highlight";
import { cn } from "@/lib/utils/cn";

import type { CaseBrief } from "../data";

/*
 * Case briefing (Figma: Desktop - 5). Desktop offsets are relative to <main>
 * (Figma x=396, y=153): title at x=452/y=225, brief and
 * objectives columns at y=411 (x=452 and x=1127), Proceed at y=880.
 */

function SectionHeading({
  id,
  underline,
  active,
  children,
}: {
  id: string;
  underline: number;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <h2 id={id} className="font-display text-[20px] leading-[1.62] font-black uppercase">
        {children}
      </h2>
      <span
        aria-hidden
        className="h-[3px] bg-accent shadow-[0_0_10px_var(--accent)] transition-all duration-500 ease-out"
        style={{ width: active ? underline : 0 }}
      />
    </div>
  );
}

function Cursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-1 inline-block h-[1.1em] w-[0.55em] animate-pulse rounded-[1px] bg-accent align-middle shadow-[0_0_8px_var(--accent)]"
    />
  );
}

interface HighlightToken {
  text: string;
  isHighlight: boolean;
}

interface ParsedParagraph {
  raw: string;
  tokens: HighlightToken[];
  totalLength: number;
}

function parseParagraph(raw: string): ParsedParagraph {
  const parts = raw.split(/(\{\{.+?\}\})/g).filter(Boolean);
  const tokens: HighlightToken[] = parts.map((part) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      return { text: part.slice(2, -2), isHighlight: true };
    }
    return { text: part, isHighlight: false };
  });
  const totalLength = tokens.reduce((sum, t) => sum + t.text.length, 0);
  return { raw, tokens, totalLength };
}

function renderTypedTokens(tokens: HighlightToken[], visibleCount: number, showCursor: boolean) {
  let remaining = visibleCount;
  const elements: ReactNode[] = [];

  for (let i = 0; i < tokens.length; i++) {
    if (remaining <= 0) break;
    const token = tokens[i]!;
    const sliceLen = Math.min(token.text.length, remaining);
    const textSlice = token.text.slice(0, sliceLen);
    remaining -= sliceLen;

    if (token.isHighlight) {
      elements.push(
        <span key={i} className="font-semibold text-accent">
          {textSlice}
        </span>,
      );
    } else {
      elements.push(<span key={i}>{textSlice}</span>);
    }
  }

  return (
    <>
      {elements}
      {showCursor && <Cursor />}
    </>
  );
}

const bone = "rounded-md bg-white/10 motion-safe:animate-pulse";

/** Placeholder with the briefing's proportions while the case loads. */
export function CaseBriefingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading case" className="lg:pt-[72px] lg:pl-[56px]">
      <div className={`${bone} h-[52px] w-56`} />
      <div className={`${bone} mt-3 h-[52px] w-full max-w-[600px]`} />
      <div className="mt-[56px] flex max-w-[490px] flex-col gap-4">
        <div className={`${bone} h-8 w-32`} />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${bone} h-5`} style={{ width: `${90 - i * 7}%` }} />
        ))}
      </div>
    </div>
  );
}

type CaseBriefingProps = {
  caseBrief: CaseBrief;
  /** Next step after reading the brief (the case offer). */
  proceedHref: Route;
};

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

export function CaseBriefing({ caseBrief, proceedHref }: CaseBriefingProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isFinished, setIsFinished] = useState(false);
  const isComplete = prefersReducedMotion || isFinished;
  const [numberChars, setNumberChars] = useState(0);
  const [titleChars, setTitleChars] = useState(0);
  const [briefHeadingVisible, setBriefHeadingVisible] = useState(false);
  const [briefParaIndex, setBriefParaIndex] = useState(0);
  const [briefCharIndex, setBriefCharIndex] = useState(0);
  const [objectivesHeadingVisible, setObjectivesHeadingVisible] = useState(false);
  const [objIndex, setObjIndex] = useState(0);
  const [objCharIndex, setObjCharIndex] = useState(0);
  const [isProceeding, setIsProceeding] = useState(false);

  const parsedBrief = useMemo(() => caseBrief.brief.map(parseParagraph), [caseBrief.brief]);

  const handleSkip = useCallback(() => {
    setIsFinished(true);
  }, []);

  // Keyboard shortcut: Space, Enter, or Escape to quickly skip
  useEffect(() => {
    if (isComplete) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isComplete, handleSkip]);

  // Main cinematic typewriter sequence
  useEffect(() => {
    if (prefersReducedMotion) return;

    let isCancelled = false;
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const numberText = caseBrief.number;
    const titleText = caseBrief.title;
    const objectives = caseBrief.objectives;

    async function runTyping() {
      // 1. Initial short pause
      await sleep(150);
      if (isCancelled) return;

      // 2. Type Case Number ("CASE 001")
      for (let i = 1; i <= numberText.length; i++) {
        if (isCancelled) return;
        setNumberChars(i);
        await sleep(24);
      }
      await sleep(100);

      // 3. Type Title ("TRACE THE MISSING 20 SOL")
      for (let i = 1; i <= titleText.length; i++) {
        if (isCancelled) return;
        setTitleChars(i);
        await sleep(18);
      }
      await sleep(160);

      // 4. Reveal Headings with laser scanlines
      setBriefHeadingVisible(true);
      setObjectivesHeadingVisible(true);
      await sleep(220);

      // 5. Dual streams: Brief on the left, Objectives on the right
      const briefPromise = (async () => {
        for (let pIdx = 0; pIdx < parsedBrief.length; pIdx++) {
          if (isCancelled) return;
          setBriefParaIndex(pIdx);
          const p = parsedBrief[pIdx]!;
          for (let c = 1; c <= p.totalLength; c++) {
            if (isCancelled) return;
            setBriefCharIndex(c);
            const isPunctuation = [".", ",", "!"].includes(p.raw[c - 1] ?? "");
            await sleep(isPunctuation ? 26 : 12);
          }
          await sleep(75);
        }
        setBriefParaIndex(parsedBrief.length);
      })();

      const objectivesPromise = (async () => {
        await sleep(200);
        for (let oIdx = 0; oIdx < objectives.length; oIdx++) {
          if (isCancelled) return;
          setObjIndex(oIdx);
          const objText = objectives[oIdx]!;
          for (let c = 1; c <= objText.length; c++) {
            if (isCancelled) return;
            setObjCharIndex(c);
            await sleep(11);
          }
          await sleep(65);
        }
        setObjIndex(objectives.length);
      })();

      await Promise.all([briefPromise, objectivesPromise]);
      if (isCancelled) return;

      await sleep(120);
      setIsFinished(true);
    }

    runTyping();

    return () => {
      isCancelled = true;
    };
  }, [prefersReducedMotion, caseBrief, parsedBrief]);

  return (
    <article
      onClick={isComplete ? undefined : handleSkip}
      className="relative cursor-default lg:pt-[72px] lg:pl-[56px]"
    >
      {/* Skip button while typing */}
      {!isComplete && (
        <div className="mb-4 flex max-w-[850px] justify-end">
          <button
            type="button"
            onClick={handleSkip}
            className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] tracking-widest text-[#9aa3bd] uppercase transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent active:scale-95 active:brightness-110"
          >
            <span>[ SKIP</span>
            <span className="text-accent transition-transform group-hover:translate-x-0.5">
              ❯❯ ]
            </span>
          </button>
        </div>
      )}

      <header className="font-display text-[28px] leading-[1.62] font-black uppercase lg:text-[40px]">
        <p className="min-h-[1.62em] text-accent">
          {isComplete ? (
            caseBrief.number
          ) : (
            <>
              {caseBrief.number.slice(0, numberChars)}
              {numberChars < caseBrief.number.length && <Cursor />}
            </>
          )}
        </p>
        <h1 className="min-h-[1.62em]">
          {isComplete ? (
            caseBrief.title
          ) : (
            <>
              {caseBrief.title.slice(0, titleChars)}
              {numberChars >= caseBrief.number.length && titleChars < caseBrief.title.length && (
                <Cursor />
              )}
            </>
          )}
        </h1>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 [grid-template-areas:'brief'_'objectives'_'proceed'] lg:mt-[56.4px] lg:grid-cols-[490px_401px] lg:gap-x-[185px] lg:gap-y-6 lg:[grid-template-areas:'brief_objectives'_'proceed_objectives']">
        <section aria-labelledby="case-brief" className="[grid-area:brief] lg:w-[490px]">
          <SectionHeading
            id="case-brief"
            underline={127.5}
            active={isComplete || briefHeadingVisible}
          >
            Case brief
          </SectionHeading>
          <div className="mt-5 min-h-[220px] font-roboto text-[16px] leading-[1.9] sm:text-[17px] sm:leading-[2.03] lg:min-h-[300px] lg:text-[20px]">
            {caseBrief.brief.map((paragraph, i) => {
              if (isComplete) {
                return <p key={i}>{renderHighlights(paragraph)}</p>;
              }

              const isFinished = i < briefParaIndex;
              const isCurrent = i === briefParaIndex && (briefHeadingVisible || isComplete);
              const pData = parsedBrief[i]!;

              if (!isFinished && !isCurrent) {
                return null;
              }

              return (
                <p key={i}>
                  {isFinished
                    ? renderTypedTokens(pData.tokens, pData.totalLength, false)
                    : renderTypedTokens(pData.tokens, briefCharIndex, true)}
                </p>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="case-objectives" className="[grid-area:objectives] lg:w-[401px]">
          <SectionHeading
            id="case-objectives"
            underline={226}
            active={isComplete || objectivesHeadingVisible}
          >
            Case objectives
          </SectionHeading>
          <ol className="mt-5 font-roboto">
            {caseBrief.objectives.map((objective, i) => {
              const isVisible = isComplete || (objectivesHeadingVisible && i <= objIndex);
              const isCurrent = !isComplete && objectivesHeadingVisible && i === objIndex;
              const isFinished = isComplete || i < objIndex;

              return (
                <li
                  key={i}
                  className={cn(
                    "flex h-[40.56px] items-center gap-[11px] text-[12px] transition-opacity duration-200",
                    isVisible ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-[17px] shrink-0 place-items-center rounded-full bg-accent font-display text-[10px] font-bold text-black shadow-[0_0_6px_var(--accent)] transition-all duration-300",
                      isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate sm:overflow-visible sm:whitespace-normal">
                    {isFinished ? objective : isCurrent ? objective.slice(0, objCharIndex) : ""}
                    {isCurrent && (
                      <span
                        aria-hidden="true"
                        className="ml-1 inline-block h-[1.1em] w-1.5 animate-pulse bg-accent align-middle shadow-[0_0_6px_var(--accent)]"
                      />
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="pt-2 [grid-area:proceed] lg:pt-0">
          <Link
            href={proceedHref}
            onClick={() => setIsProceeding(true)}
            className={cn(
              "group relative flex h-[48px] w-full max-w-[240px] items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 font-display text-sm font-black tracking-wide text-[#020512] uppercase transition-all duration-300 ease-out sm:h-[50px] sm:max-w-[260px] sm:text-[15px]",
              "bg-linear-to-r from-accent via-[#ffbe4d] to-accent",
              "hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]",
              isComplete
                ? "translate-y-0 opacity-100 shadow-[0_0_25px_rgba(252,163,17,0.45)] hover:shadow-[0_0_35px_rgba(252,163,17,0.75),0_6px_18px_rgba(0,0,0,0.4)]"
                : "pointer-events-none translate-y-3 opacity-0",
              isProceeding && "pointer-events-none cursor-wait opacity-85",
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
            />
            {isProceeding ? (
              <span className="relative z-10 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading…</span>
              </span>
            ) : (
              <>
                <span className="relative z-10">Proceed</span>
                <Image
                  src="/icons/arrow-line.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="relative z-10 size-4 -scale-y-100 -rotate-90 transition-transform duration-200 ease-out group-hover:translate-x-1.5 group-hover:scale-105 sm:size-4.5"
                />
              </>
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
