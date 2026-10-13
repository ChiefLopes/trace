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
  "group relative overflow-hidden flex h-[71px] w-full items-center justify-center gap-3 rounded-[32px] p-2.5 font-display text-[18px] leading-[1.62] font-black whitespace-nowrap uppercase transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0 active:scale-[0.97] lg:text-[20px]";

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
        <Link
          href={rejectHref}
          className={`${action} bg-white text-[#020512] shadow-[0_0_24px_rgba(255,255,255,0.25)] hover:shadow-[0_0_40px_rgba(255,255,255,0.6),0_10px_25px_rgba(0,0,0,0.4)] sm:w-[273px]`}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
          />
          <Image
            src="/icons/reject.svg"
            alt=""
            width={28}
            height={28}
            className="relative z-10 size-[28.1px] transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12"
          />
          <span className="relative z-10">Reject trace</span>
        </Link>
        <Link
          href={acceptHref}
          className={`${action} bg-linear-to-r from-accent via-[#ffbe4d] to-accent text-[#020512] shadow-[0_0_32px_rgba(252,163,17,0.45)] hover:shadow-[0_0_55px_rgba(252,163,17,0.85),0_10px_25px_rgba(0,0,0,0.5)] sm:w-[335px]`}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
          />
          <Image
            src="/icons/play.svg"
            alt=""
            width={24}
            height={24}
            className="relative z-10 size-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-6"
          />
          <span className="relative z-10">Open case file</span>
        </Link>
      </div>
    </section>
  );
}
