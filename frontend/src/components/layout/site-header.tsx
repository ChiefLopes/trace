"use client";

import { Menu, X } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button-variants";
import { authNav, mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { logoutAction } from "@/features/auth/actions";
import type { CurrentUser } from "@/features/auth/session";
import { cn } from "@/lib/utils/cn";

export function SiteHeader({ user }: { user?: CurrentUser | null } = {}) {
  const pathname = usePathname();
  // Remember which page the menu was opened on: navigating elsewhere closes it
  // without needing an effect to reset state.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const getNavHref = (item: (typeof mainNav)[number]) => {
    if (item.label === "Pick Character" || item.href === "/characters") {
      return (user ? "/dashboard" : "/login") as Route;
    }
    return item.href;
  };

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
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

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-10 lg:gap-14">
            {mainNav.map((item) => {
              const href = getNavHref(item);
              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={cn(
                      "relative py-2 text-xs font-bold tracking-wider text-foreground/85 uppercase transition-colors hover:text-foreground",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100",
                      "aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user ? (
          <div className="hidden items-center gap-3 md:flex">
            <Link href={"/dashboard" as Route} className={buttonVariants({ size: "sm" })}>
              Dashboard
            </Link>
            <UserMenu displayName={user.displayName} avatar={user.avatar} />
          </div>
        ) : (
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href={authNav.login.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {authNav.login.label}
            </Link>
            <Link href={authNav.signUp.href} className={buttonVariants({ size: "sm" })}>
              {authNav.signUp.label}
            </Link>
          </div>
        )}

        <button
          type="button"
          className="-mr-2 rounded-md p-2 transition-transform active:scale-95 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setOpenedOn(menuOpen ? null : pathname)}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="mx-4 rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md md:hidden"
        >
          <ul className="flex flex-col">
            {mainNav.map((item) => {
              const href = getNavHref(item);
              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className="block rounded-lg px-3 py-3 text-sm font-bold tracking-wider uppercase hover:bg-primary aria-[current=page]:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {user ? (
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted">Signed in as</span>
                <span className="font-display text-xs font-bold text-accent uppercase">
                  {user.displayName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={"/dashboard" as Route}
                  className={buttonVariants({ className: "w-full" })}
                >
                  Dashboard
                </Link>
                <form action={logoutAction} className="w-full">
                  <button
                    type="submit"
                    className={buttonVariants({
                      variant: "ghost",
                      className: "w-full border border-white/10 text-muted hover:text-foreground",
                    })}
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <Link
                href={authNav.login.href}
                className={buttonVariants({
                  variant: "ghost",
                  className: "border border-accent/40",
                })}
              >
                {authNav.login.label}
              </Link>
              <Link href={authNav.signUp.href} className={buttonVariants()}>
                {authNav.signUp.label}
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
