"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils/cn";

type UserMenuProps = {
  displayName: string;
  avatar?: { src: string } | null;
};

export function UserMenu({ displayName, avatar = { src: "/avatar.svg" } }: UserMenuProps) {
  const avatarSrc = avatar?.src || "/avatar.svg";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        // Figma header chip: 202×50, 6.9px padding, 1px white/10 outline (measured from the render).
        className={cn(
          "flex h-[50.2px] w-[202px] items-center justify-end gap-[5.5px] rounded-[7.56px] border border-white/10 p-[6.87px]",
          "bg-linear-to-r from-black/10 to-[rgb(12_55_151/0.1)] transition-colors hover:bg-white/5 active:scale-[0.98]",
        )}
      >
        <span className="font-display text-[11.69px] leading-[17.53px] font-bold tracking-[0.29px] whitespace-nowrap text-accent uppercase">
          {displayName}
        </span>
        {/* 36.4px amber disc with the 30.9px photo inset 2.75px. */}
        <span className="ml-[6.2px] grid size-[36.43px] shrink-0 place-items-center rounded-full bg-accent">
          <Image
            src={avatarSrc}
            alt=""
            width={62}
            height={62}
            className="size-[30.93px] rounded-full object-cover"
          />
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-[9.4px] text-[#71778e] transition-transform", open && "rotate-180")}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-white/10 bg-background/95 py-1 shadow-2xl backdrop-blur-md"
        >
          {/* A Server Action, so logging out clears the httpOnly session cookie. */}
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary"
            >
              <LogOut className="size-4 text-muted" />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
