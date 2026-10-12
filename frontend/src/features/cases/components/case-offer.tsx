import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

type CaseOfferProps = {
  agentName: string;
  caseTitle: string;
  rejectHref: Route;
  acceptHref: Route;
};

const action =
  "flex h-[71px] w-full items-center justify-center gap-2.5 rounded-[32px] p-2.5 font-display text-[18px] leading-[1.62] font-black whitespace-nowrap text-[#020512] uppercase transition-[filter] hover:brightness-110 lg:text-[20px]";

/**
 * "Agent X, will you take this case?" (Figma: Desktop - 6). The block sits at
 * canvas x=483, y=320, i.e. 87/167px inside <main>.
 */
export function CaseOffer({ agentName, caseTitle, rejectHref, acceptHref }: CaseOfferProps) {
  return (
    <section aria-labelledby="case-offer-title" className="lg:pt-[167px] lg:pl-[87px]">
      <div className="flex flex-col gap-6 font-display text-[28px] leading-[1.62] font-black uppercase lg:w-[597px] lg:text-[40px]">
        <p className="text-accent">Agent {agentName}</p>
        <h1 id="case-offer-title">{caseTitle}</h1>
      </div>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row lg:mt-[76px]">
        <Link href={rejectHref} className={`${action} bg-white sm:w-[273px]`}>
          <Image src="/icons/reject.svg" alt="" width={28} height={28} className="size-[28.1px]" />
          Reject trace
        </Link>
        <Link href={acceptHref} className={`${action} bg-accent sm:w-[335px]`}>
          <Image src="/icons/play.svg" alt="" width={24} height={24} className="size-6" />
          Open case file
        </Link>
      </div>
    </section>
  );
}
