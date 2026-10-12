import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TraceLoader } from "@/components/feedback/trace-loader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { getCurrentUser } from "@/features/auth/session";
import { caseIds } from "@/features/cases/data";
import { caseRoutes } from "@/features/cases/routes";
import { ActivityTimeline } from "@/features/investigation/components/activity-timeline";
import { CaseProgress } from "@/features/investigation/components/case-progress";
import { InvestigatorStatus } from "@/features/investigation/components/investigator-status";
import { LeadDialog } from "@/features/investigation/components/lead-dialog";
import { EvidenceSummary, TrailStatus } from "@/features/investigation/components/trail-status";
import { WalletOverview } from "@/features/investigation/components/wallet-overview";
import { getWorkspace, isSolved } from "@/features/investigation/data";
import type { Investigator } from "@/features/investigators/data";
import { getSelectedInvestigator } from "@/features/investigators/selection";

type Props = PageProps<"/investigation/[caseId]">;

export function generateStaticParams() {
  return caseIds.map((caseId) => ({ caseId }));
}

export const metadata: Metadata = {
  title: "Investigation workspace",
};

/**
 * Head-and-shoulders of the investigator above the left column (Figma:
 * 166.68×243.36, mirrored; placed relative to <main>). Offsets fit the full-length art;
 * half-body art falls back to a top-aligned fit.
 *
 * Faces RIGHT (opposite of spotlight). Uses inverse flip logic.
 */
const WORKSPACE_FLIP: Record<string, boolean> = {
  "officer-1": false,
  "officer-2": true,
  "officer-3": false,
  "officer-4": false,
};

function WorkspacePortrait({ investigator }: { investigator: Investigator }) {
  const art = investigator.fullBody;
  const shouldFlip = WORKSPACE_FLIP[investigator.id] ?? true;
  return (
    <div
      className={cn(
        "pointer-events-none absolute! top-[-48px] left-[14.87px] hidden h-[243.36px] w-[166.68px] overflow-hidden select-none lg:block",
        shouldFlip && "-scale-x-100",
      )}
    >
      {art ? (
        <Image
          src={art.src}
          alt={investigator.description}
          width={art.width}
          height={art.height}
          sizes="211px"
          loading="eager"
          className="absolute top-[-10.7px] left-1/2 h-[502px] w-auto max-w-none -translate-x-1/2 object-contain object-top"
        />
      ) : (
        <Image
          src={investigator.image.src}
          alt={investigator.description}
          fill
          sizes="167px"
          loading="eager"
          className="object-contain object-top"
        />
      )}
    </div>
  );
}

async function WorkspaceContent({ params }: Props) {
  const [{ caseId }, investigator, user] = await Promise.all([
    params,
    getSelectedInvestigator(),
    getCurrentUser(),
  ]);
  const workspace = await getWorkspace(caseId);
  if (!workspace) notFound();

  const solved = isSolved(workspace);
  const firstName = user.displayName.split(" ")[0] ?? user.displayName;

  const walletHref = (walletId: string) => caseRoutes.wallet(caseId, walletId);

  return (
    // Columns 286/596/286 wide, 27px inside <main>; panels start 151px down.
    <div className="grid gap-6 lg:ml-[27px] lg:grid-cols-[286px_596px_286px] lg:gap-x-8">
      <WorkspacePortrait investigator={investigator} />

      {/* Left: who is investigating and how far along they are. */}
      <div className="flex flex-col gap-5 lg:order-1 lg:pt-[151px]">
        <CaseProgress objectives={workspace.objectives} />
        <InvestigatorStatus
          {...workspace.investigator}
          hint={workspace.hint}
          // Solving the case promotes the player from "Rookie Investigator".
          title={solved ? `Investigator ${firstName}` : undefined}
        />
      </div>

      {/* Centre: the wallet under investigation and its activity. */}
      <div className="order-first flex flex-col lg:order-2 lg:pt-[10px]">
        <div className="flex flex-col gap-1 leading-[1.62] lg:w-[672px]">
          <p className="font-roboto text-[20px] font-bold text-accent uppercase italic lg:text-[24px]">
            {workspace.caseNumber} — {workspace.codename}
          </p>
          <h1 className="font-display text-[28px] font-black uppercase lg:text-[36px]">
            Investigation workspace
          </h1>
        </div>
        <div className="mt-6 flex flex-col gap-6 lg:mt-[39.8px]">
          <WalletOverview
            wallet={workspace.investigating}
            walletHref={walletHref(workspace.investigating.id)}
          />
          {solved && (
            <Link
              href={caseRoutes.outcome(caseId)}
              className={buttonVariants({
                className:
                  "h-auto w-full rounded-[16px] py-3.5 font-display text-[16px] leading-6 font-black",
              })}
            >
              See trace outcome
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          )}
          <ActivityTimeline
            entries={workspace.timeline}
            entryHref={(id) => caseRoutes.transaction(caseId, id)}
            solved={solved}
          />
        </div>
      </div>

      {/* Right: where the money has been, and what you've pinned. */}
      <div className="flex flex-col gap-5 lg:order-3 lg:pt-[151px]">
        <TrailStatus
          trail={workspace.trail}
          currentWalletId={workspace.investigating.id}
          solved={solved}
          walletHref={walletHref}
        />
        <EvidenceSummary
          count={workspace.evidenceCount}
          notebookHref={caseRoutes.evidence(caseId)}
        />
      </div>

      {workspace.lead && (
        <LeadDialog
          lead={workspace.lead}
          actionHref={caseRoutes.target(caseId, workspace.lead.target)}
        />
      )}
    </div>
  );
}

export default function WorkspacePage(props: Props) {
  return (
    <Suspense fallback={<TraceLoader label="Opening the workspace" />}>
      <WorkspaceContent {...props} />
    </Suspense>
  );
}
