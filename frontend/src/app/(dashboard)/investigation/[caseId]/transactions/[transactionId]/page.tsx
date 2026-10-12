import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TraceLoader } from "@/components/feedback/trace-loader";
import { caseRoutes } from "@/features/cases/routes";
import { LeadDialog } from "@/features/investigation/components/lead-dialog";
import { ProgressStrip } from "@/features/investigation/components/progress-strip";
import { TransactionDetail } from "@/features/investigation/components/transaction-detail";
import {
  findCaseWallet,
  getTransaction,
  getWorkspace,
  transactionParams,
} from "@/features/investigation/data";
import { getSelectedInvestigator } from "@/features/investigators/selection";

type Props = PageProps<"/investigation/[caseId]/transactions/[transactionId]">;

export function generateStaticParams() {
  return transactionParams;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { caseId, transactionId } = await params;
  const transaction = await getTransaction(caseId, transactionId);
  return { title: transaction ? `Transaction ${transaction.signature}` : "Transaction not found" };
}

async function TransactionContent({ params }: Pick<Props, "params">) {
  const { caseId, transactionId } = await params;
  const [transaction, workspace, investigator] = await Promise.all([
    getTransaction(caseId, transactionId),
    getWorkspace(caseId),
    getSelectedInvestigator(),
  ]);
  if (!transaction || !workspace) notFound();

  const wallet = (id: string) => findCaseWallet(workspace, id);
  const from = wallet(transaction.fromWalletId);
  const to = wallet(transaction.toWalletId);
  if (!from || !to) notFound();

  return (
    <div className="relative max-w-[897px] lg:ml-[53px]">
      <Link
        href={caseRoutes.workspace(caseId)}
        aria-label="Back to the investigation workspace"
        className="grid size-[33px] place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_0_14px_-4px_var(--accent)] transition-[filter] hover:brightness-110"
      >
        <ChevronLeft className="size-5" strokeWidth={2.5} />
      </Link>

      {/* The chosen investigator looks over the case, overlapping the strip's corner. */}
      <Image
        src={investigator.image.src}
        alt={investigator.description}
        width={investigator.image.width}
        height={investigator.image.height}
        sizes="120px"
        loading="eager"
        className="pointer-events-none absolute -top-[34px] right-[-18px] z-10 hidden h-[178px] w-auto lg:block"
      />

      <ProgressStrip
        completed={transaction.progress.completed}
        total={transaction.progress.total}
        className="mt-[26px]"
      />
      <div className="mt-[9px]">
        <TransactionDetail
          transaction={transaction}
          from={from}
          to={to}
          walletHref={(id) => caseRoutes.wallet(caseId, id)}
          traceHref={caseRoutes.wallet(caseId, to.id)}
          caseId={caseId}
        />
      </div>

      {transaction.lead && (
        <LeadDialog
          lead={transaction.lead}
          actionHref={caseRoutes.target(caseId, transaction.lead.target)}
        />
      )}
    </div>
  );
}

export default function TransactionPage(props: Props) {
  return (
    <Suspense fallback={<TraceLoader label="Reading the transaction" />}>
      <TransactionContent {...props} />
    </Suspense>
  );
}
