import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TraceLoader } from "@/components/feedback/trace-loader";
import { caseRoutes } from "@/features/cases/routes";
import { WalletDetail } from "@/features/investigation/components/wallet-detail";
import { getWalletDetail, getWorkspace, walletParams } from "@/features/investigation/data";
import { getSelectedInvestigator } from "@/features/investigators/selection";

type Props = PageProps<"/investigation/[caseId]/wallets/[walletId]">;

export function generateStaticParams() {
  return walletParams;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { caseId, walletId } = await params;
  const wallet = await getWalletDetail(caseId, decodeURIComponent(walletId));
  return { title: wallet ? wallet.label : "Wallet not found" };
}

async function WalletContent({ params }: Pick<Props, "params">) {
  const { caseId, walletId } = await params;
  const [wallet, workspace, investigator] = await Promise.all([
    getWalletDetail(caseId, decodeURIComponent(walletId)),
    getWorkspace(caseId),
    getSelectedInvestigator(),
  ]);
  if (!wallet || !workspace) notFound();

  // Neighbours on the trail, linked to their own wallet pages.
  const neighbor = (id: string | null) => {
    const found = id ? workspace.trail.find((w) => w.id === id) : undefined;
    return found ? { label: found.label, href: caseRoutes.wallet(caseId, found.id) } : null;
  };

  return (
    <div className="relative max-w-[1022px] lg:ml-[31px]">
      <Link
        href={caseRoutes.workspace(caseId)}
        aria-label="Back to the investigation workspace"
        className="grid size-[33px] place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_0_14px_-4px_var(--accent)] transition-[filter] hover:brightness-110"
      >
        <ChevronLeft className="size-5" strokeWidth={2.5} />
      </Link>

      {/* The investigator stands behind the card's top-right corner. */}
      <Image
        src={investigator.image.src}
        alt={investigator.description}
        width={investigator.image.width}
        height={investigator.image.height}
        sizes="120px"
        loading="eager"
        className="pointer-events-none absolute -top-[62px] right-[-18px] hidden h-[160px] w-auto lg:block"
      />

      <div className="relative mt-[38px] lg:mt-[44px]">
        <WalletDetail
          wallet={wallet}
          receivedFrom={neighbor(wallet.receivedFromWalletId)}
          sentTo={neighbor(wallet.sentToWalletId)}
          targetHref={(target) => caseRoutes.target(caseId, target)}
          caseId={caseId}
        />
      </div>
    </div>
  );
}

export default function WalletPage(props: Props) {
  return (
    <Suspense fallback={<TraceLoader label="Pulling up the wallet" />}>
      <WalletContent {...props} />
    </Suspense>
  );
}
