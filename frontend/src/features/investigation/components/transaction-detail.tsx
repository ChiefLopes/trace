import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, CircleCheck } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { formatSol } from "@/lib/solana/format";
import { cn } from "@/lib/utils/cn";

import type { Transaction, Workspace } from "../data";
import { AddToEvidenceLink } from "./add-to-evidence-link";

type Wallet = Workspace["trail"][number];

/**
 * Descriptive names read with "the" ("the Treasury Wallet"); letter names
 * don't ("Wallet B").
 */
export function walletName(label: string) {
  return /wallet$/i.test(label) ? `the ${label}` : label;
}

const STATUS_LABEL: Record<Transaction["status"], string> = {
  confirmed: "Confirmed",
  finalized: "Finalized",
  failed: "Failed",
};

function Endpoint({
  role,
  wallet,
  icon,
}: {
  role: "From" | "To";
  wallet: Wallet;
  icon: ReactNode;
}) {
  return (
    <div className="flex w-24 flex-col items-center text-center sm:w-36">
      <div className="grid size-[63px] place-items-center rounded-[10px] border border-white/10 bg-[#060f33]">
        <div className="flex flex-col items-center gap-1.5">
          {icon}
          <span className="font-mono text-[8px] tracking-[0.15em] text-[#8f98b3] uppercase">
            {role}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold">{wallet.label}</p>
      <p className="mt-1 font-mono text-[9px] whitespace-nowrap text-[#8f98b3]">{wallet.address}</p>
    </div>
  );
}

function RelatedWallet({
  href,
  label,
  wallet,
  icon,
}: {
  href: Route;
  label: string;
  wallet: Wallet;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-[66px] items-center gap-3.5 rounded-[10px] border border-white/[0.06] bg-[#050d2e]/80 px-4 transition-colors hover:border-white/15"
    >
      <span className="grid size-[27px] place-items-center rounded-md border border-white/10 bg-white/5 text-white/70">
        {icon}
      </span>
      <span>
        <span className="block text-[11px] font-semibold">{label}</span>
        <span className="block text-[10px] text-[#8f98b3]">{wallet.label}</span>
      </span>
    </Link>
  );
}

type TransactionDetailProps = {
  transaction: Transaction;
  from: Wallet;
  to: Wallet;
  walletHref: (walletId: string) => Route;
  /** "Trace the Funds": follow the money to the receiving wallet. */
  traceHref: Route;
  caseId: string;
};

export function TransactionDetail({
  transaction,
  from,
  to,
  walletHref,
  traceHref,
  caseId,
}: TransactionDetailProps) {
  const amount = formatSol(transaction.amountLamports);

  return (
    <article
      aria-labelledby="transaction-signature"
      className="rounded-[14px] border border-white/10 bg-linear-to-b from-[#0a1c5a]/90 to-[#06123f]/90 px-5 pt-7 pb-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] sm:px-[33px] sm:pt-[37px] sm:pb-[33px]"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-[9px] font-black tracking-[0.1em] text-accent uppercase">
            Transaction
          </p>
          <h1 id="transaction-signature" className="mt-1.5 text-[26px] leading-none font-bold">
            {transaction.signature}
          </h1>
        </div>
        <div className="flex items-center gap-3 sm:mr-6">
          <span
            className={cn(
              "flex h-[22px] items-center gap-1.5 rounded border px-2 font-display text-[8.5px] font-black tracking-wide uppercase",
              transaction.status === "failed"
                ? "border-destructive/60 text-destructive"
                : "border-accent/70 bg-accent/10 text-accent",
            )}
          >
            <CircleCheck className="size-3" />
            {STATUS_LABEL[transaction.status]}
            <Check className="size-3" strokeWidth={2.5} />
          </span>
          <time className="font-mono text-[10px] text-[#8f98b3]">{transaction.time}</time>
        </div>
      </header>

      {/* Money flow: from → amount → to */}
      <div className="mt-10 flex items-start justify-center gap-2 sm:mt-[64px] sm:gap-6">
        <Endpoint role="From" wallet={from} icon={<ArrowUpRight className="size-3.5" />} />
        <div className="flex flex-col items-center pt-[15px]">
          <span className="grid h-[54px] min-w-[110px] place-items-center rounded-xl border border-accent/80 bg-[#0a1a55] px-4 text-lg font-bold text-accent shadow-[0_0_24px_-6px_var(--accent)] sm:min-w-[147px] sm:px-5 sm:text-[22px]">
            −{amount} SOL
          </span>
          <span aria-hidden className="mt-[22px] flex items-center text-accent">
            <span className="h-px w-16 bg-accent sm:w-[150px]" />
            <ArrowRight className="-ml-1.5 size-3" />
          </span>
        </div>
        <Endpoint role="To" wallet={to} icon={<ArrowDownLeft className="size-3.5 text-accent" />} />
      </div>

      <p className="mt-[38px] rounded-[10px] border border-white/[0.06] bg-[#050c2c]/90 px-5 py-[22px] text-sm">
        {amount} SOL moved from {walletName(from.label)} to {walletName(to.label)}.
      </p>

      <section aria-labelledby="related-activity" className="mt-8">
        <h2
          id="related-activity"
          className="font-mono text-[8.5px] tracking-[0.15em] text-[#8f98b3] uppercase"
        >
          Related activity
        </h2>
        <div className="mt-2.5 grid gap-[13px] sm:grid-cols-2">
          <RelatedWallet
            href={walletHref(from.id)}
            label="Sender wallet"
            wallet={from}
            icon={<ArrowUpRight className="size-3.5" />}
          />
          <RelatedWallet
            href={walletHref(to.id)}
            label="Receiver wallet"
            wallet={to}
            icon={<ArrowDownLeft className="size-3.5" />}
          />
        </div>
      </section>

      <div className="mt-[34px] flex flex-wrap gap-2.5">
        <AddToEvidenceLink
          caseId={caseId}
          kind="transaction"
          targetId={transaction.id}
          label={transaction.signature}
        />
        <Link
          href={traceHref}
          className="flex h-9 items-center gap-2 rounded-lg border border-accent/70 bg-[#0d1640] px-4 text-xs font-semibold text-accent transition-colors hover:border-accent"
        >
          Trace the Funds
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
