import Image from "next/image";
import Link from "next/link";

import { BrandBackdrop } from "@/components/layout/brand-backdrop";
import { siteConfig } from "@/config/site";

/** Login / sign-up: logo only, no main navigation, so the form is the single focus. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-svh flex-1 flex-col overflow-hidden">
      <BrandBackdrop fadeBottom={false} />
      <header className="relative z-20 mx-auto flex h-20 w-full max-w-7xl items-center px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-display text-lg font-black tracking-wider uppercase sm:text-xl"
        >
          <Image
            src="/avatar.svg"
            alt="TRACE Logo"
            width={32}
            height={32}
            priority
            className="size-7 rounded-lg object-contain shadow-[0_0_12px_rgba(252,163,17,0.35)] transition-transform group-hover:scale-105 sm:size-8"
          />
          <span>{siteConfig.name}</span>
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
