"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNav } from "@/config/navigation";
import type { DashboardSummary } from "@/features/dashboard/data";
import { cn } from "@/lib/utils/cn";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

const railLabel =
  "font-mono text-[10px] leading-4 font-medium tracking-[0.12em] text-[#71778e] uppercase";

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[10px] border border-white/5 bg-[rgb(0_6_20/0.45)] px-2.5 py-2">
      <dt className={railLabel}>{label}</dt>
      <dd className="font-roboto text-[15px] leading-5 font-bold text-accent tabular-nums">
        {value}
      </dd>
    </div>
  );
}

/**
 * Bottom of the rail: where the player is in their current case, with a way
 * back in. Fills the rail's lower half with something useful instead of space.
 */
function RailCaseCard({
  progress,
  resumeHref,
}: {
  progress: DashboardSummary;
  resumeHref: Route | null;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const { activeCase, objectives, evidenceCount, academy } = progress;
  const percent = objectives.total
    ? Math.round((objectives.completed / objectives.total) * 100)
    : 0;

  if (!activeCase || !resumeHref) {
    return (
      <div className="flex flex-col gap-3 rounded-[16px] border border-white/5 bg-[rgb(0_6_20/0.35)] p-3.5">
        <p className={railLabel}>No open case</p>
        <p className="font-roboto text-[13px] leading-5 text-[#cbd5e1]">
          Pick a case to start tracing funds.
        </p>
        <Link
          href={"/cases" as Route}
          onClick={() => setIsNavigating(true)}
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-[12px] bg-accent font-display text-[12px] font-black text-black uppercase transition-[filter] hover:brightness-110 active:scale-[0.98] active:brightness-120",
            isNavigating && "pointer-events-none cursor-wait opacity-85",
          )}
        >
          {isNavigating ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Loading…</span>
            </>
          ) : (
            <>
              <span>Browse cases</span>
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </>
          )}
        </Link>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="rail-active-case"
      className="flex flex-col gap-3 rounded-[16px] border border-[rgb(0_36_114/0.55)] bg-[linear-gradient(135deg,rgb(1_27_85/0.5),rgb(0_6_20/0.72))] p-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
    >
      <div>
        <p className={railLabel}>Active case</p>
        <h2
          id="rail-active-case"
          className="font-display text-[15px] leading-6 font-black text-accent uppercase"
        >
          {activeCase.label}
        </h2>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-roboto text-[11px] leading-4">
          <span className="text-[#cbd5e1]">
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
          className="h-1.5 overflow-hidden rounded-full border border-white/5 bg-[rgb(0_6_20/0.8)]"
        >
          <div
            className="h-full min-w-1.5 rounded-full bg-linear-to-r from-accent to-[#fcd34d] shadow-[0_0_8px_rgb(252_163_17/0.7)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <MiniStat label="Evidence" value={String(evidenceCount)} />
        <MiniStat label="Academy" value={`${academy.completed}/${academy.total}`} />
      </dl>

      <Link
        href={resumeHref}
        onClick={() => setIsNavigating(true)}
        className={cn(
          "flex h-9 items-center justify-center gap-1.5 rounded-[12px] bg-accent font-display text-[12px] font-black text-black uppercase transition-[filter] hover:brightness-110 active:scale-[0.98] active:brightness-120",
          isNavigating && "pointer-events-none cursor-wait opacity-85",
        )}
      >
        {isNavigating ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            <span>Loading…</span>
          </>
        ) : (
          <>
            <span>Resume case</span>
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </>
        )}
      </Link>
    </section>
  );
}

function RailCaseCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-[16px] border border-white/5 bg-[rgb(0_6_20/0.35)] p-3.5">
      <div className="h-2.5 w-16 rounded bg-white/10" />
      <div className="h-4 w-28 rounded bg-white/10" />
      <div className="h-9 w-full rounded-[12px] bg-white/5" />
    </div>
  );
}

/**
 * Game rail on the left on desktop. Compact, sticky, starts
 * 16px below the header and sized to the window, so the whole menu is always
 * visible and only the page content scrolls. The active-case card sits at
 * the bottom; the 520px minimum keeps menu and card from overlapping.
 * Viewport units are zoomed by `.design-canvas`, hence the division by
 * --ui-scale.
 */
export function DashboardSidebar({
  progress,
  resumeHref,
}: {
  progress?: DashboardSummary | null;
  /** Workspace of the active case, or null when there is none. */
  resumeHref?: Route | null;
} = {}) {
  const isActive = useIsActive();

  return (
    <aside
      className={cn(
        "hidden w-[248px] shrink-0 self-start rounded-[24px] p-3 lg:sticky lg:top-[88px] lg:flex lg:flex-col",
        "h-[max(520px,calc(100svh/var(--ui-scale,1)-104px))]",
        "border border-white/5 backdrop-blur-[24px]",
        "bg-[linear-gradient(175.56deg,#010614_13%,#06257a_111.66%)]",
        "shadow-[0_0_38.6px_-4.8px_rgb(0_0_0/0.8)]",
      )}
    >
      <nav aria-label="Game" className="pt-2">
        <ul className="flex flex-col gap-1">
          {dashboardNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="relative">
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_10px_rgb(155_70_248/0.45)]"
                  />
                )}
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-[12px] border px-3 transition-colors",
                    "font-display text-[13px] leading-5 font-bold tracking-[0.4px] uppercase",
                    active
                      ? "border-accent bg-[linear-gradient(98.93deg,#011442_1.27%,#010818_111.72%)] text-accent"
                      : "border-transparent text-[#858393] hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  {/* Fixed slot keeps labels aligned; icons keep their Figma
                      proportions (viewBoxes differ, e.g. Cases is 29×34). */}
                  <span className="grid w-6 shrink-0 place-items-center">
                    <Icon className="[zoom:0.8]" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto pt-4">
        {progress ? (
          <RailCaseCard progress={progress} resumeHref={resumeHref ?? null} />
        ) : (
          <RailCaseCardSkeleton />
        )}
      </div>
    </aside>
  );
}

export function DashboardSidebarSkeleton() {
  return <DashboardSidebar />;
}

/** Horizontal, scrollable version of the same navigation below `lg`. */
export function DashboardTabs() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Game"
      className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 lg:hidden [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-2">
        {dashboardNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 whitespace-nowrap",
                  "font-display text-[11px] font-bold tracking-wide uppercase",
                  active
                    ? "border-accent bg-[#011442] text-accent"
                    : "border-white/10 bg-background/60 text-[#858393]",
                )}
              >
                <Icon width={16} height={16} className="shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
