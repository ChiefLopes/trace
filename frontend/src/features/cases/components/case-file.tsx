import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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

/** The case dossier: briefing, known facts and objectives, then "Begin investigation". */
export function CaseFile({ caseFile, beginHref, className }: CaseFileProps) {
  const { number, codename, difficulty, status, briefing, knownInformation, objectives } = caseFile;

  return (
    <article
      aria-labelledby="case-file-title"
      className={cn(
        "relative isolate flex flex-col items-center rounded-[19.38px] border-[0.8px] border-[rgb(252_163_17/0.18)] p-[0.8px] pb-8 backdrop-blur-[8px] lg:min-h-[965px] lg:w-[775px] lg:pb-10",
        "bg-[radial-gradient(930px_1158px_at_50%_0,rgb(5_31_104/0.45),rgb(4_20_66/0.65)_50%,rgb(2_8_28/0.85))]",
        "shadow-[0_20.18px_40.37px_-9.69px_rgb(0_0_0/0.25)]",
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

      <header className="flex w-full flex-col gap-2.5 border-b-[0.8px] border-white/10 px-5 pt-8 pb-6 lg:px-[32.29px] lg:pt-[50.05px] lg:pb-[33.1px]">
        <p className={cn(label, "text-accent")}>{number}</p>
        <h1
          id="case-file-title"
          className="font-display text-[26px] leading-[1.2] font-black tracking-[-0.97px] uppercase drop-shadow-[0_0.8px_0.4px_rgb(0_0_0/0.05)] lg:text-[32.29px]"
        >
          {codename}
        </h1>
        <p className="flex items-center gap-2 pt-1 text-[13px] leading-[19.38px] text-[rgb(203_213_225/0.7)]">
          Difficulty: <span className="font-bold text-white">{difficulty}</span>
          <span aria-hidden className="px-1 text-[rgb(203_213_225/0.4)]">
            •
          </span>
          Status: <span className="font-bold text-accent">{STATUS_LABEL[status]}</span>
        </p>
      </header>

      <div className="flex w-full flex-col gap-7 p-5 lg:p-[32.29px]">
        <Section id="case-file-briefing" title="Briefing">
          <div className="flex flex-col gap-3 font-roboto text-[13px] leading-[1.75]">
            {briefing.map((paragraph, i) => (
              <p
                key={i}
                className={i === briefing.length - 1 ? "font-medium text-slate-300" : "text-white"}
              >
                {renderHighlights(paragraph)}
              </p>
            ))}
          </div>
        </Section>

        <Section id="case-file-known" title="Known information">
          <dl className="flex flex-col gap-3 sm:flex-row">
            <InfoCard
              icon="/icons/case-file/wallet.svg"
              label="Initial wallet"
              value={knownInformation.initialWallet}
            />
            <InfoCard
              icon="/icons/case-file/amount.svg"
              label="Missing amount"
              value={knownInformation.missingAmount}
            />
            <InfoCard
              icon="/icons/case-file/time.svg"
              label="Approximate time"
              value={knownInformation.approximateTime}
            />
          </dl>
        </Section>

        <Section id="case-file-objectives" title="Your objectives">
          <ol className="flex flex-col gap-2.5">
            {objectives.map((objective, i) => (
              <li
                key={i}
                className="group/item flex items-center gap-3.5 rounded-[10px] border border-white/8 bg-[rgb(4_18_58/0.45)] px-4 py-3.5 font-roboto text-[14px] leading-relaxed text-slate-200 transition-all duration-200 hover:translate-x-1 hover:border-accent/35 hover:bg-[rgb(6_24_78/0.6)]"
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

      <div className="flex w-full justify-center px-5 pt-4 pb-2 lg:px-[32.29px] lg:pt-6">
        <Link
          href={beginHref}
          className="group flex h-[58px] w-full max-w-[570px] shrink-0 items-center justify-center gap-3 rounded-full bg-linear-to-r from-[#fca311] via-[#ffb433] to-[#fca311] px-6 font-display text-[16px] font-black tracking-wider text-[#020512] uppercase shadow-[0_4px_20px_rgba(252,163,17,0.35)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_8px_28px_rgba(252,163,17,0.55)] hover:brightness-110 active:scale-[0.99]"
        >
          <span>Begin investigation</span>
          <Image
            src="/icons/arrow-line.svg"
            alt=""
            width={20}
            height={20}
            className="size-5 -scale-y-100 -rotate-90 transition-transform duration-200 group-hover:translate-x-1.5"
          />
        </Link>
      </div>
    </article>
  );
}
