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

import { renderHighlights } from "@/lib/text/highlight";
import { cn } from "@/lib/utils/cn";

import type { CaseFile as CaseFileData } from "../data";

/* The case dossier (Figma: Desktop - 7 › Article - CaseCard, 775×965). */

const STATUS_LABEL: Record<CaseFileData["status"], string> = {
  open: "Open",
  solved: "Solved",
  closed: "Closed",
};

const label = "font-display text-[11.3px] leading-[16.15px] font-black tracking-[1.13px] uppercase";

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

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h2 id={id} className={cn(label, "text-accent")}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-[10px] border border-white/8 bg-[rgb(4_18_58/0.55)] p-4 transition-colors hover:border-white/15 hover:bg-[rgb(5_22_70/0.65)]">
      <dt className="flex items-center gap-2 pb-1 font-roboto text-[10px] font-semibold tracking-wider text-[rgb(203_213_225/0.7)] uppercase italic">
        <Image src={icon} alt="" width={14} height={14} className="size-3.5" />
        {label}
      </dt>
      <dd className="font-display text-[16px] font-bold tracking-tight text-white">{value}</dd>
    </div>
  );
}

type CaseFileProps = {
  caseFile: CaseFileData;
  beginHref: Route;
  className?: string;
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

/** The case dossier: progressive reveal of briefing, known facts and objectives, with instant SKIP. */
export function CaseFile({ caseFile, beginHref, className }: CaseFileProps) {
  const { number, codename, difficulty, status, briefing, knownInformation, objectives } = caseFile;

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const [isComplete, setIsComplete] = useState(() => prefersReducedMotion);

  // Progressive reveal steps
  const [numberChars, setNumberChars] = useState(() => (prefersReducedMotion ? number.length : 0));
  const [titleChars, setTitleChars] = useState(() => (prefersReducedMotion ? codename.length : 0));
  const [headerComplete, setHeaderComplete] = useState(() => prefersReducedMotion);
  const [briefingVisible, setBriefingVisible] = useState(() => prefersReducedMotion);
  const [briefParaIndex, setBriefParaIndex] = useState(() => (prefersReducedMotion ? 999 : 0));
  const [briefCharIndex, setBriefCharIndex] = useState(() => (prefersReducedMotion ? 9999 : 0));
  const [knownVisible, setKnownVisible] = useState(() => prefersReducedMotion);
  const [knownCardCount, setKnownCardCount] = useState(() => (prefersReducedMotion ? 3 : 0));
  const [objectivesVisible, setObjectivesVisible] = useState(() => prefersReducedMotion);
  const [objCount, setObjCount] = useState(() => (prefersReducedMotion ? objectives.length : 0));

  const parsedBriefing = useMemo(
    () => briefing.map((paragraph) => parseParagraph(paragraph)),
    [briefing],
  );

  const handleSkip = useCallback(() => {
    setIsComplete(true);
    setNumberChars(number.length);
    setTitleChars(codename.length);
    setHeaderComplete(true);
    setBriefingVisible(true);
    setBriefParaIndex(999);
    setBriefCharIndex(9999);
    setKnownVisible(true);
    setKnownCardCount(3);
    setObjectivesVisible(true);
    setObjCount(objectives.length);
  }, [number.length, codename.length, objectives.length]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let isCancelled = false;
    let timer: NodeJS.Timeout;

    const CHAR_DELAY = 10;
    const STEP_DELAY = 80;
    const CARD_DELAY = 70;
    const OBJ_DELAY = 60;

    const sleep = (ms: number) =>
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const runProgressiveReveal = async () => {
      // 1. Type Case Number
      for (let i = 1; i <= number.length; i++) {
        if (isCancelled) return;
        setNumberChars(i);
        await sleep(CHAR_DELAY);
      }
      await sleep(STEP_DELAY);

      // 2. Type Codename / Title
      for (let i = 1; i <= codename.length; i++) {
        if (isCancelled) return;
        setTitleChars(i);
        await sleep(CHAR_DELAY);
      }
      setHeaderComplete(true);
      await sleep(STEP_DELAY);

      // 3. Type Briefing Paragraphs
      setBriefingVisible(true);
      for (let p = 0; p < parsedBriefing.length; p++) {
        if (isCancelled) return;
        setBriefParaIndex(p);
        const pLen = parsedBriefing[p]!.totalLength;
        for (let c = 1; c <= pLen; c += 2) {
          if (isCancelled) return;
          setBriefCharIndex(c);
          await sleep(CHAR_DELAY);
        }
        setBriefCharIndex(pLen);
        await sleep(50);
      }
      await sleep(STEP_DELAY);

      // 4. Known Information Cards
      setKnownVisible(true);
      for (let k = 1; k <= 3; k++) {
        if (isCancelled) return;
        setKnownCardCount(k);
        await sleep(CARD_DELAY);
      }
      await sleep(STEP_DELAY);

      // 5. Objectives
      setObjectivesVisible(true);
      for (let o = 1; o <= objectives.length; o++) {
        if (isCancelled) return;
        setObjCount(o);
        await sleep(OBJ_DELAY);
      }
      await sleep(STEP_DELAY);

      // 6. Complete
      setIsComplete(true);
    };

    runProgressiveReveal();

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [prefersReducedMotion, number, codename, parsedBriefing, objectives.length]);

  return (
    <article
      aria-labelledby="case-file-title"
      onClick={isComplete ? undefined : handleSkip}
      className={cn(
        "relative isolate flex flex-col items-center rounded-[19.38px] border-[0.8px] border-[rgb(252_163_17/0.18)] p-[0.8px] pb-8 backdrop-blur-[8px] lg:min-h-[965px] lg:w-[775px] lg:pb-10",
        "bg-[radial-gradient(930px_1158px_at_50%_0,rgb(5_31_104/0.45),rgb(4_20_66/0.65)_50%,rgb(2_8_28/0.85))]",
        "cursor-default shadow-[0_20.18px_40.37px_-9.69px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-103.33px] left-[-103.33px] -z-10 size-[258.34px] rounded-full bg-[#051f68] opacity-60 blur-[40.37px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[calc(50%+115.88px)] right-[-103.35px] -z-10 size-[232.5px] -translate-y-1/2 rounded-full bg-accent opacity-10 blur-[56.51px]"
      />

      <header className="flex w-full flex-col gap-2.5 border-b-[0.8px] border-white/10 px-5 pt-7 pb-6 lg:px-[32.29px] lg:pt-[44px] lg:pb-[33.1px]">
        <div className="flex items-center justify-between">
          <p className={cn(label, "text-accent")}>
            {isComplete ? (
              number
            ) : (
              <>
                {number.slice(0, numberChars)}
                {numberChars < number.length && <Cursor />}
              </>
            )}
          </p>

          {!isComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] tracking-widest text-[#9aa3bd] uppercase transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent active:scale-95 active:brightness-110"
            >
              <span>[ SKIP</span>
              <span className="text-accent transition-transform group-hover:translate-x-0.5">
                ❯❯ ]
              </span>
            </button>
          )}
        </div>

        <h1
          id="case-file-title"
          className="min-h-[1.2em] font-display text-[26px] leading-[1.2] font-black tracking-[-0.97px] uppercase drop-shadow-[0_0.8px_0.4px_rgb(0_0_0/0.05)] lg:text-[32.29px]"
        >
          {isComplete ? (
            codename
          ) : (
            <>
              {codename.slice(0, titleChars)}
              {numberChars >= number.length && titleChars < codename.length && <Cursor />}
            </>
          )}
        </h1>

        <p
          className={cn(
            "flex items-center gap-2 pt-1 text-[13px] leading-[19.38px] text-[rgb(203_213_225/0.7)] transition-opacity duration-300",
            isComplete || headerComplete ? "opacity-100" : "opacity-0",
          )}
        >
          Difficulty: <span className="font-bold text-white">{difficulty}</span>
          <span aria-hidden className="px-1 text-[rgb(203_213_225/0.4)]">
            •
          </span>
          Status: <span className="font-bold text-accent">{STATUS_LABEL[status]}</span>
        </p>
      </header>

      <div className="flex w-full flex-col gap-7 p-5 lg:p-[32.29px]">
        {/* Briefing Section */}
        <div
          className={cn(
            "transition-opacity duration-300",
            isComplete || briefingVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Section id="case-file-briefing" title="Briefing">
            <div className="flex flex-col gap-3 font-roboto text-[13px] leading-[1.75]">
              {briefing.map((paragraph, i) => {
                if (isComplete) {
                  return (
                    <p
                      key={i}
                      className={
                        i === briefing.length - 1 ? "font-medium text-slate-300" : "text-white"
                      }
                    >
                      {renderHighlights(paragraph)}
                    </p>
                  );
                }

                const isFinished = i < briefParaIndex;
                const isCurrent = i === briefParaIndex && briefingVisible;
                const pData = parsedBriefing[i]!;

                if (!isFinished && !isCurrent) {
                  return null;
                }

                return (
                  <p
                    key={i}
                    className={
                      i === briefing.length - 1 ? "font-medium text-slate-300" : "text-white"
                    }
                  >
                    {isFinished
                      ? renderTypedTokens(pData.tokens, pData.totalLength, false)
                      : renderTypedTokens(pData.tokens, briefCharIndex, true)}
                  </p>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Known Information Section */}
        <div
          className={cn(
            "transition-opacity duration-300",
            isComplete || knownVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Section id="case-file-known" title="Known information">
            <dl className="flex flex-col gap-3 sm:flex-row">
              <div
                className={cn(
                  "flex-1 transition-all duration-300",
                  isComplete || knownCardCount >= 1
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
                )}
              >
                <InfoCard
                  icon="/icons/case-file/wallet.svg"
                  label="Initial wallet"
                  value={knownInformation.initialWallet}
                />
              </div>
              <div
                className={cn(
                  "flex-1 transition-all duration-300",
                  isComplete || knownCardCount >= 2
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
                )}
              >
                <InfoCard
                  icon="/icons/case-file/amount.svg"
                  label="Missing amount"
                  value={knownInformation.missingAmount}
                />
              </div>
              <div
                className={cn(
                  "flex-1 transition-all duration-300",
                  isComplete || knownCardCount >= 3
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
                )}
              >
                <InfoCard
                  icon="/icons/case-file/time.svg"
                  label="Approximate time"
                  value={knownInformation.approximateTime}
                />
              </div>
            </dl>
          </Section>
        </div>

        {/* Your Objectives Section */}
        <div
          className={cn(
            "transition-opacity duration-300",
            isComplete || objectivesVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Section id="case-file-objectives" title="Your objectives">
            <ol className="flex flex-col gap-2.5">
              {objectives.map((objective, i) => (
                <li
                  key={i}
                  className={cn(
                    "group/item flex items-center gap-3.5 rounded-[10px] border border-white/8 bg-[rgb(4_18_58/0.45)] px-4 py-3.5 font-roboto text-[14px] leading-relaxed text-slate-200 transition-all duration-300 hover:translate-x-1 hover:border-accent/35 hover:bg-[rgb(6_24_78/0.6)]",
                    isComplete || objCount >= i + 1
                      ? "translate-x-0 opacity-100"
                      : "pointer-events-none -translate-x-2 opacity-0",
                  )}
                >
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/15 font-display text-[12px] font-bold text-accent shadow-[0_0_8px_rgba(252,163,17,0.2)] transition-colors group-hover/item:border-accent group-hover/item:bg-accent/25"
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 tracking-[-0.2px]">{objective}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>

      <div className="flex w-full justify-center px-5 pt-4 pb-2 lg:px-[32.29px] lg:pt-6">
        <Link
          href={beginHref}
          className={cn(
            "group relative flex h-[54px] w-full max-w-[570px] shrink-0 items-center justify-center gap-3 overflow-hidden rounded-full bg-linear-to-r from-[#fca311] via-[#ffbe4d] to-[#fca311] px-6 font-display text-[15px] font-black tracking-wider text-[#020512] uppercase shadow-[0_4px_25px_rgba(252,163,17,0.4)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_36px_rgba(252,163,17,0.75),0_10px_24px_rgba(0,0,0,0.4)] hover:brightness-105 active:translate-y-0 active:scale-[0.98]",
            isComplete
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0",
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
          />
          <span className="relative z-10">Begin investigation</span>
          <Image
            src="/icons/arrow-line.svg"
            alt=""
            width={20}
            height={20}
            className="relative z-10 size-5 -scale-y-100 -rotate-90 transition-transform duration-200 group-hover:translate-x-2 group-hover:scale-110"
          />
        </Link>
      </div>
    </article>
  );
}
