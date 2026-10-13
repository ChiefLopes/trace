"use client";

import { useState } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

import type { DashboardSummary } from "../data";

/* Dashboard stats (Figma: Desktop - 4 › "Html → Body", 1280px wide). */

const tile = "rounded-[16px] border border-[#222533] bg-[#0e1017]";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={`${tile} flex min-h-[96px] min-w-0 flex-1 flex-col gap-[17.5px] px-[21px] py-[17px]`}
    >
      <dt className="font-display text-[11px] leading-[16.5px] font-bold tracking-[1.1px] text-[#71778e] uppercase">
        {label}
      </dt>
      <dd className="font-roboto text-[22px] leading-[28px] font-bold tracking-[-0.55px] whitespace-pre text-accent tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export function StatsPanel({
  summary,
  resumeHref,
}: {
  summary: DashboardSummary;
  resumeHref: Route;
}) {
  const [isResuming, setIsResuming] = useState(false);
  const { activeCase, objectives, evidenceCount, academy } = summary;
  const percent = objectives.total
    ? Math.round((objectives.completed / objectives.total) * 100)
    : 0;

  return (
    <section
      aria-label="Your progress"
      className="flex w-full justify-center bg-[linear-gradient(101.95deg,#020614_0.58%,#051b5a_117.54%)] px-4 py-5 lg:w-[1280px] lg:py-[37.5px] lg:pr-[32px] lg:pl-[9px]"
    >
      <div className="flex w-full max-w-[1152px] flex-col gap-[14px]">
        <dl className="grid grid-cols-2 gap-[14px] lg:flex">
          <StatCard label="Active case" value={activeCase ? activeCase.label.toUpperCase() : "—"} />
          <StatCard
            label="Objectives"
            value={
              activeCase && objectives.total > 0
                ? `${objectives.completed} / ${objectives.total}`
                : "—"
            }
          />
          <StatCard label="Evidence" value={String(evidenceCount)} />
          <StatCard label="Academy" value={`${academy.completed}  /  ${academy.total}`} />
        </dl>

        {activeCase && (
          <div
            className={`${tile} flex flex-col gap-4 px-[21px] py-[17px] lg:flex-row lg:items-center lg:gap-[123.2px]`}
          >
            <div className="shrink-0">
              <p className="text-base leading-[22px] font-bold whitespace-nowrap">
                Investigation in progress
              </p>
              <p className="text-sm leading-[21px] text-[#7e859b]">Pick up where you left off.</p>
            </div>

            <div className="min-w-0 flex-1 lg:max-w-[496px] lg:px-6">
              <div className="flex max-w-[448px] flex-col gap-1.5">
                <div className="flex items-center justify-between font-roboto text-[11px] leading-4">
                  <span className="font-medium uppercase">
                    {objectives.completed} of {objectives.total} objectives
                  </span>
                  <span className="font-bold text-accent">{percent}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Case objectives completed"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="relative h-2 overflow-hidden rounded-full border border-[#222533] bg-[#151722]"
                >
                  <div
                    className="absolute inset-y-px left-0 rounded-full bg-accent shadow-[0_0_10px_rgb(147_51_234/0.5)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex lg:flex-1 lg:justify-end">
              <Link
                href={resumeHref}
                onClick={() => setIsResuming(true)}
                className={cn(
                  "flex items-center gap-2 rounded-[19px] bg-accent px-6 py-2.5 font-display text-sm leading-5 font-black text-black uppercase shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)] transition-[filter] hover:brightness-110",
                  isResuming && "pointer-events-none cursor-wait opacity-85",
                )}
              >
                {isResuming ? (
                  <>
                    <Loader2 className="size-4 shrink-0 animate-spin text-black" />
                    <span>Resuming…</span>
                  </>
                ) : (
                  <>
                    <span>Resume</span>
                    <Image
                      src="/icons/arrow-right-black.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="size-4"
                    />
                  </>
                )}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
