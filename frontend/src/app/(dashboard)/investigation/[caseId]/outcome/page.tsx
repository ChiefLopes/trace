import type { Metadata, Route } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TraceLoader } from "@/components/feedback/trace-loader";
import { getNextOpenCaseId } from "@/features/cases/active-case";
import { caseRoutes } from "@/features/cases/routes";
import { CaseSolved } from "@/features/investigation/components/case-solved";
import { getCaseOutcome } from "@/features/investigation/outcome";
import { getSelectedInvestigator } from "@/features/investigators/selection";

type Props = PageProps<"/investigation/[caseId]/outcome">;

export const metadata: Metadata = {
  title: "Case solved",
};

/** Floor shadows under the faded investigator (Figma ellipses, relative to <main>). */
const FLOOR_SHADOWS = [
  { x: 1056, y: 929 },
  { x: 1056, y: 923 },
  { x: 952, y: 907 },
  { x: 952, y: 901 },
];

async function OutcomeContent({ params }: Pick<Props, "params">) {
  const { caseId } = await params;
  const [outcome, investigator] = await Promise.all([
    getCaseOutcome(caseId),
    getSelectedInvestigator(),
  ]);
  if (!outcome) notFound();

  const art = investigator.fullBody ?? investigator.image;

  const nextCaseId =
    (await getNextOpenCaseId(caseId)) ?? (caseId === "case-001" ? "case-002" : "case-001");

  return (
    <>
      {/* Centered on mobile/tablet, 78px inside <main> on desktop */}
      <div className="flex w-full justify-center lg:ml-[78px] lg:block">
        <CaseSolved
          outcome={outcome}
          portrait={{ ...art, alt: investigator.description }}
          homeHref={"/dashboard" as Route}
          nextCaseHref={caseRoutes.briefing(nextCaseId)}
        />
      </div>

      {/* Faded investigator standing beside the card, relative to <main>. */}
      <div aria-hidden className="pointer-events-none hidden lg:block">
        {FLOOR_SHADOWS.map(({ x, y }, i) => (
          <Image
            key={i}
            src="/effects/floor-shadow.svg"
            alt=""
            width={304}
            height={246}
            className="absolute h-[245.77px] w-[303.58px] max-w-none"
            style={{ left: x - 147 * 0.5298, top: y - 90 * 0.8718 }}
          />
        ))}
        <Image
          src={art.src}
          alt=""
          width={art.width}
          height={art.height}
          sizes="372px"
          className="absolute top-[193.6px] left-[831px] h-auto w-[371.2px] max-w-none opacity-34"
        />
      </div>
    </>
  );
}

export default function OutcomePage(props: Props) {
  return (
    <Suspense fallback={<TraceLoader label="Tallying the evidence" />}>
      <OutcomeContent params={props.params} />
    </Suspense>
  );
}
