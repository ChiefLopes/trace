import type { Metadata, Route } from "next";
import Image from "next/image";

import { caseRoutes } from "@/features/cases/routes";
import { StatsPanel } from "@/features/dashboard/components/stats-panel";
import { getDashboardSummary } from "@/features/dashboard/data";
import { InvestigatorPicker } from "@/features/investigators/components/investigator-picker";
import { featuredInvestigator, investigators } from "@/features/investigators/data";

import { getSelectedInvestigator } from "@/features/investigators/selection";

import { selectInvestigator } from "./actions";

export const metadata: Metadata = {
  title: "Dashboard",
};

/*
 * Figma: Desktop - 4. offsets are relative to <main> (Figma x=396, y=153);
 * offsets below land each block on its Figma position.
 */
export default async function DashboardPage() {
  const [summary, selectedInvestigator] = await Promise.all([
    getDashboardSummary(),
    getSelectedInvestigator(),
  ]);
  const tracy = featuredInvestigator.fullBody;

  return (
    <>
      {/* x=427, y=160 */}
      <div className="lg:mt-[7px] lg:ml-[31px]">
        <StatsPanel
          summary={summary}
          resumeHref={
            summary.activeCase
              ? caseRoutes.workspace(summary.activeCase.id)
              : ("/investigation" as Route)
          }
        />
      </div>

      {/* x=437, y=461 */}
      <h2 className="mt-10 font-display text-2xl font-black uppercase lg:mt-[38px] lg:ml-[41px] lg:text-[32px] lg:leading-[1.62]">
        Select investigator
      </h2>

      {/* x=441, y=525 */}
      <div className="mt-4 lg:mt-[12.16px] lg:ml-[45px]">
        <InvestigatorPicker
          investigators={investigators}
          action={selectInvestigator}
          caseId={summary.activeCase?.id}
          selectedId={selectedInvestigator.id}
        />
      </div>

      {/* Tracy, positioned on the canvas: 785×958 box at x=1113, y=436 with Figma's crop. */}
      <div className="pointer-events-none absolute top-[283px] left-[717px] hidden h-[958px] w-[785px] overflow-hidden select-none lg:block">
        <Image
          src={tracy.src}
          alt={featuredInvestigator.description}
          width={tracy.width}
          height={tracy.height}
          preload
          sizes="2240px"
          className="absolute top-0 left-[-93.45%] h-[145.97%] w-[285.15%] max-w-none"
        />
      </div>
    </>
  );
}
