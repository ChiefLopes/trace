import { ArrowDownLeft, ArrowRight, ArrowUpLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/ui/copy-button";
import { formatSol } from "@/lib/solana/format";
import { cn } from "@/lib/utils/cn";
import { formatLongDate } from "@/lib/utils/date";

import type { Target, WalletActivity, WalletDetail as WalletDetailData } from "../data";
import { AddToEvidenceLink } from "./add-to-evidence-link";
import { VerifyTraceButton } from "./verify-trace-button";

function SectionLabel({
  id,
  tone = "muted",
  children,
}: {
  id: string;
  tone?: "muted" | "accent";
  children: ReactNode;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "font-display text-[9px] font-black tracking-[0.08em] uppercase",
        tone === "accent" ? "text-accent" : "text-[#9aa3bd]",
      )}
    >
      {children}
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[82px] flex-col justify-center gap-2.5 rounded-[10px] border border-white/[0.07] bg-linear-to-br from-[#081544] to-[#0e2a7a]/80 px-4">
      <dt className="font-display text-[8.5px] font-black tracking-wide text-accent uppercase">
        {label}
      </dt>
      <dd className="text-xl leading-none font-bold">{value}</dd>
    </div>
  );
}

function ConnectedWallet({
  caption,
  label,
  href,
  icon,
  iconSide,
}: {
  caption: string;
  label: string;
  href: Route;
  icon: ReactNode;
  iconSide: "left" | "right";
}) {
  const iconTile = (
    <span className="grid size-[22px] place-items-center rounded-md bg-white/5 text-[#9aa3bd]">
      {icon}
    </span>
  );
  return (
    <Link
      href={href}
      className="flex h-[49px] items-center gap-3 rounded-[10px] border border-white/10 bg-[#050d2e]/80 px-3 transition-colors hover:border-white/25"
    >
      {iconSide === "left" && iconTile}
      <span>
        <span className="block text-[9px] text-accent">{caption}</span>
        <span className="block text-[11px] font-semibold">{label}</span>
      </span>
      {iconSide === "right" && iconTile}
    </Link>
  );
}

function ActivityRow({ entry, href }: { entry: WalletActivity; href: Route }) {
  const incoming = entry.direction === "in";
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex h-[66px] items-center gap-4 rounded-[10px] border px-5 transition-colors",
          entry.flagged
            ? "border-accent/70 bg-[#0d1235]/80"
            : "border-white/[0.07] bg-[#050c2c]/80 hover:border-white/20",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "grid size-[27px] shrink-0 place-items-center rounded-md bg-white/5",
            incoming ? "text-[#7aa2ff]" : entry.flagged ? "text-accent" : "text-white/70",
          )}
        >
          {incoming ? <ArrowDownLeft className="size-4" /> : <ArrowUpLeft className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-mono text-[9px] text-[#8f98b3]">
            <time>{entry.time}</time>
            {entry.key && (
              <span className="rounded-[3px] border border-accent/40 bg-accent/15 px-1 py-px text-[7.5px] text-accent uppercase">
                Key
              </span>
            )}
          </p>
          <p className="mt-1 truncate">
            <span
              className={cn(
                "font-mono text-[13px] font-bold",
                incoming ? "text-[#7aa2ff]" : entry.flagged ? "text-accent" : "text-foreground",
              )}
            >
              {incoming ? "+" : "-"}
              {formatSol(entry.amountLamports)} SOL
            </span>{" "}
            <span className="ml-1.5 text-[10px] text-[#9aa3bd]">
              {incoming ? "from" : "to"} {entry.counterparty}
            </span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[8.5px] font-semibold uppercase">
          Tx
          <ArrowRight className="size-3.5" />
        </span>
      </Link>
    </li>
  );
}

type Neighbor = { label: string; href: Route } | null;

type WalletDetailProps = {
  wallet: WalletDetailData;
  receivedFrom: Neighbor;
  sentTo: Neighbor;
  targetHref: (target: Target) => Route;
  caseId: string;
  isFinalDestination?: boolean;
  evidenceCount?: number;
};

export function WalletDetail({
  wallet,
  receivedFrom,
  sentTo,
  targetHref,
  caseId,
  isFinalDestination = false,
  evidenceCount = 0,
}: WalletDetailProps) {
  return (
    <article
      aria-labelledby="wallet-label"
      className="rounded-[14px] border border-white/10 bg-linear-to-br from-[#0a1c5a]/95 via-[#050c2e]/95 to-[#03081f]/95 px-5 pt-7 pb-7 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] sm:px-[37px] sm:pt-[37px]"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] pb-[30px]">
        <div className="min-w-0">
          <p className="font-display text-[8.5px] font-black tracking-[0.1em] uppercase">Wallet</p>
          <h1
            id="wallet-label"
            className="mt-1.5 font-display text-[28px] leading-none font-black tracking-tight text-accent uppercase"
          >
            {wallet.label}
          </h1>
          <p className="mt-3 flex items-center gap-1.5">
            <span className="font-mono text-[11px] break-all text-[#9aa3bd]">{wallet.address}</span>
            <CopyButton value={wallet.address} label="Copy wallet address" />
          </p>
          <p className="mt-2.5 text-xs text-foreground/85">{wallet.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <VerifyTraceButton
            caseId={caseId}
            walletId={wallet.id}
            walletLabel={wallet.label}
            isFinalDestination={isFinalDestination}
            evidenceCount={evidenceCount}
            className="h-[33px] text-[11px]"
          />
          <AddToEvidenceLink
            caseId={caseId}
            kind="wallet"
            targetId={wallet.id}
            label={wallet.label}
            className="h-[33px] text-[11px]"
          />
        </div>
      </header>

      <section aria-labelledby="wallet-overview" className="mt-[30px]">
        <SectionLabel id="wallet-overview">Overview</SectionLabel>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Balance" value={`${formatSol(wallet.balanceLamports)} SOL`} />
          <Stat label="Transactions" value={wallet.transactionCount.toLocaleString("en-US")} />
          <Stat label="Tokens" value={wallet.tokenCount.toLocaleString("en-US")} />
          <Stat label="First activity" value={formatLongDate(wallet.firstActivity)} />
          <Stat label="Last activity" value={formatLongDate(wallet.lastActivity)} />
        </dl>
      </section>

      <section aria-labelledby="wallet-connected" className="mt-[26px]">
        <SectionLabel id="wallet-connected" tone="accent">
          Connected wallets
        </SectionLabel>
        <ol className="mt-3 flex flex-wrap items-center gap-3">
          {receivedFrom && (
            <>
              <li>
                <ConnectedWallet
                  caption="Received from"
                  label={receivedFrom.label}
                  href={receivedFrom.href}
                  icon={<ArrowDownLeft className="size-3" />}
                  iconSide="left"
                />
              </li>
              <ArrowRight aria-hidden className="size-4 text-[#9aa3bd]" />
            </>
          )}
          <li
            aria-current="location"
            className="flex h-[49px] flex-col justify-center rounded-[10px] border border-accent bg-[#0b1d5e] px-3"
          >
            <span className="text-[9px]">This wallet</span>
            <span className="text-[11px] font-semibold text-accent">{wallet.label}</span>
          </li>
          {sentTo && (
            <>
              <ArrowRight aria-hidden className="size-4 text-[#9aa3bd]" />
              <li>
                <ConnectedWallet
                  caption="Sent to"
                  label={sentTo.label}
                  href={sentTo.href}
                  icon={<ArrowDownLeft className="size-3" />}
                  iconSide="right"
                />
              </li>
            </>
          )}
        </ol>
      </section>

      <section aria-labelledby="wallet-activity" className="mt-[30px]">
        <SectionLabel id="wallet-activity">Activity</SectionLabel>
        <ol className="mt-3 flex flex-col gap-[11px]">
          {wallet.activity.map((entry) => {
            const txId =
              entry.link.kind === "transaction" && entry.link.id ? entry.link.id : entry.id;
            return (
              <ActivityRow
                key={entry.id}
                entry={entry}
                href={targetHref({ kind: "transaction", id: txId })}
              />
            );
          })}
        </ol>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        <VerifyTraceButton
          caseId={caseId}
          walletId={wallet.id}
          walletLabel={wallet.label}
          isFinalDestination={isFinalDestination}
          evidenceCount={evidenceCount}
        />
        <AddToEvidenceLink
          caseId={caseId}
          kind="wallet"
          targetId={wallet.id}
          label={wallet.label}
        />
      </div>
    </article>
  );
}
