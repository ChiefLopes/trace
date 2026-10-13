import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TraceLoader } from "@/components/feedback/trace-loader";
import { CaseFile } from "@/features/cases/components/case-file";
import { caseIds, getCaseFile } from "@/features/cases/data";
import { caseRoutes } from "@/features/cases/routes";
import { InvestigatorStanding } from "@/features/investigators/components/investigator-standing";
import { getSelectedInvestigator } from "@/features/investigators/selection";

type Props = PageProps<"/cases/[caseId]/file">;

export function generateStaticParams() {
  return caseIds.map((caseId) => ({ caseId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const caseFile = await getCaseFile((await params).caseId);
  return { title: caseFile ? `${caseFile.number}: ${caseFile.codename}` : "Case not found" };
}

async function CaseFileContent({ params }: Pick<Props, "params">) {
  const [{ caseId }, investigator] = await Promise.all([params, getSelectedInvestigator()]);
  const caseFile = await getCaseFile(caseId);
  if (!caseFile) notFound();

  return (
    // Card at canvas x=450, y=163; the figure and floor shadows stand beside it with comfortable breathing room from the text.
    <div className="relative lg:mt-[10px] lg:ml-[54px] lg:w-[775px]">
      <CaseFile caseFile={caseFile} beginHref={caseRoutes.workspace(caseId)} />
      <InvestigatorStanding
        investigator={investigator}
        sizes="384px"
        className="absolute top-[32.6px] left-[800px] hidden h-[915.2px] w-[383.7px] lg:block"
      />
      {[
        { top: 704.5, left: 841.7 },
        { top: 726.5, left: 945.6 },
      ].map(({ top, left }) => (
        <Image
          key={left}
          src="/effects/floor-shadow-c.svg"
          alt=""
          width={304}
          height={246}
          className="pointer-events-none absolute hidden h-[245.77px] w-[303.58px] max-w-none lg:block"
          style={{ top, left }}
        />
      ))}
    </div>
  );
}

export default function CaseFilePage(props: Props) {
  return (
    <Suspense fallback={<TraceLoader label="Opening the case file" />}>
      <CaseFileContent {...props} />
    </Suspense>
  );
}
