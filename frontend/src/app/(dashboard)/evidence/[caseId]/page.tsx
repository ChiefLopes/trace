import { ChevronLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TraceLoader } from "@/components/feedback/trace-loader";
import { caseRoutes } from "@/features/cases/routes";
import { EvidenceForm } from "@/features/evidence/components/evidence-form";
import { evidenceCaseIds, getEvidencePrompt } from "@/features/evidence/data";
import { listEvidence } from "@/features/evidence/server-api";
import { RemoveEvidenceButton } from "@/features/evidence/components/remove-evidence-button";
import { getWorkspace } from "@/features/investigation/data";
import { InvestigatorPortrait } from "@/features/investigators/components/investigator-portrait";
import { getSelectedInvestigator } from "@/features/investigators/selection";

import { submitEvidence } from "./actions";

type Props = PageProps<"/evidence/[caseId]">;

export function generateStaticParams() {
  return evidenceCaseIds.map((caseId) => ({ caseId }));
}

export const metadata: Metadata = {
  title: "Add evidence",
};

async function EvidenceContent({ params, searchParams }: Props) {
  const { caseId } = await params;
  const sp = searchParams ? await searchParams : {};
  const fromWallet = typeof sp.fromWallet === "string" ? sp.fromWallet : undefined;
  const isVerifiedRedirect = sp.verified === "1";

  const [prompt, workspace, evidence] = await Promise.all([
    getEvidencePrompt(caseId),
    getWorkspace(caseId),
    listEvidence(caseId),
  ]);
  if (!prompt || !workspace) notFound();

  // Wallet choices are labelled from the case trail (single source of names/addresses).
  const destinations = prompt.destinationWalletIds.flatMap((id) => {
    const wallet = workspace.trail.find((w) => w.id === id);
    return wallet
      ? [{ value: id, label: `${wallet.label} (${wallet.address.replace(/\s+/g, "")})` }]
      : [];
  });

  return (
    <div className="relative max-w-[706px] lg:ml-[37px]">
      <Link
        href={caseRoutes.workspace(caseId)}
        aria-label="Back to the investigation workspace"
        className="grid size-[33px] place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_0_14px_-4px_var(--accent)] transition-[filter] hover:brightness-110"
      >
        <ChevronLeft className="size-5" strokeWidth={2.5} />
      </Link>

      <h1 className="mt-[22px] font-display text-[clamp(1.5rem,2.1vw,1.875rem)] leading-none font-black tracking-tight uppercase">
        Add some evidence
      </h1>

      {isVerifiedRedirect && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-xs">
          <ShieldCheck className="size-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold text-accent">Final Destination Located</p>
            <p className="text-[#c9d4ee]">
              You reached the end of the trace! Pin your evidence below and click Verify Trace to
              complete the case.
            </p>
          </div>
        </div>
      )}

      <section
        aria-labelledby="evidence-collection"
        className="mt-5 rounded-[14px] border border-white/10 bg-[#050a24]/90 p-5"
      >
        <h2
          id="evidence-collection"
          className="font-display text-sm font-black tracking-wide uppercase"
        >
          Pinned evidence ({evidence.length})
        </h2>
        {evidence.length === 0 ? (
          <p className="mt-2 text-xs text-[#8f98b3]">
            Wallets and transactions you add will be saved here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/10">
            {evidence.map((item) => (
              <li
                key={item.id ?? `${item.kind}:${item.targetId}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#8f98b3]">
                    {item.kind} · {item.targetId}
                  </p>
                  {item.notes && (
                    <p className="mt-2 rounded border border-white/5 bg-[#03061a] p-2.5 text-xs leading-relaxed text-[#c9d4ee] italic">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>
                <RemoveEvidenceButton caseId={caseId} evidenceId={item.id ?? item.targetId} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="evidence-question"
        className="mt-[22px] rounded-[14px] border border-white/10 bg-linear-to-br from-[#050a24]/95 via-[#061247]/95 to-[#0a1d63]/95 px-5 pt-[33px] pb-[33px] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] sm:px-[37px]"
      >
        <p className="font-display text-[9px] font-black tracking-[0.12em] text-accent uppercase">
          Build your evidence
        </p>
        <h2
          id="evidence-question"
          className="mt-2.5 font-display text-[26px] leading-none font-black tracking-tight uppercase"
        >
          Where did the{" "}
          <span className="bg-linear-to-r from-[#c9d4ee] to-[#8fa3cf] bg-clip-text text-transparent">
            funds go?
          </span>
        </h2>
        <p className="mt-2 text-xs text-[#8f98b3]">Assemble your evidence into a conclusion.</p>

        <div className="mt-[30px]">
          <EvidenceForm
            action={submitEvidence.bind(null, caseId)}
            destinations={destinations}
            scenarios={prompt.scenarios.map((s) => ({ value: s.id, label: s.label }))}
            theoryPlaceholder={prompt.theoryPlaceholder}
            caseId={caseId}
            evidenceCount={evidence.length}
            defaultDestination={fromWallet ?? "exchange"}
          />
        </div>
      </section>
    </div>
  );
}

export default function EvidencePage(props: Props) {
  return (
    <>
      <Suspense fallback={<TraceLoader label="Opening the evidence board" />}>
        <EvidenceContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <Portrait />
      </Suspense>
    </>
  );
}

/** Top-right, relative to <main> (the dashboard layout's positioning context). */
async function Portrait() {
  const investigator = await getSelectedInvestigator();
  return (
    <InvestigatorPortrait
      investigator={investigator}
      className="absolute top-[36px] right-[26px] hidden size-[200px] xl:block"
    />
  );
}
