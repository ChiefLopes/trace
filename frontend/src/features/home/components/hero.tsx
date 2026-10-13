import { Play } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { BrandBackdrop } from "@/components/layout/brand-backdrop";
import { buttonVariants } from "@/components/ui/button-variants";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-svh flex-col overflow-hidden">
      <BrandBackdrop />

      {/* ── Copy ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 pt-32 text-center sm:pt-36 lg:pt-40">
        <h1 className="font-display text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.15] font-black tracking-tight uppercase motion-safe:animate-fade-up">
          <span className="block">Be the investigator.</span>
          <span className="block">
            Trace the story. <span className="whitespace-nowrap text-accent">Solve the case.</span>
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/85 [animation-delay:120ms] motion-safe:animate-fade-up sm:text-base">
          Explore real blockchain activity, follow wallets, uncover evidence, and crack onchain
          mysteries through gameplay.
        </p>

        <Link
          href={"/cases" as Route}
          className={buttonVariants({
            className: "mt-8 [animation-delay:240ms] motion-safe:animate-fade-up",
          })}
        >
          <span className="grid size-5 place-items-center rounded-[5px] bg-background">
            <Play className="size-3 translate-x-px fill-accent text-accent" />
          </span>
          Play your first case
        </Link>
      </div>

      {/* ── Characters, anchored to the bottom ─────────────────────────── */}
      <div className="relative mx-auto mt-auto w-full max-w-5xl px-2 pt-10 [animation-delay:200ms] motion-safe:animate-rise">
        <Image
          src="/trace-hero-img.png"
          alt="The five TRACE investigators in uniform, standing together"
          width={1365}
          height={768}
          preload
          sizes="(min-width: 1024px) 1024px, (min-width: 640px) 100vw, 165vw"
          // Phones: overscale so the investigators stay large; the section clips the sides.
          className="relative left-1/2 h-auto w-[165%] max-w-none -translate-x-1/2 mask-b-from-70% mask-b-to-100% sm:w-full"
        />
      </div>
    </section>
  );
}
