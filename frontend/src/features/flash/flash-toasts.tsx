"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

import { FLASH_COOKIE, FLASH_MESSAGES, isFlashKey } from "./messages";

function takeFlash() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]*)`));
  if (!match) return null;
  // Consume it: one toast per flash.
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  const key = decodeURIComponent(match[1] ?? "");
  return isFlashKey(key) ? key : null;
}

function FlashToastsContent() {
  const pathname = usePathname();

  useEffect(() => {
    const key = takeFlash();
    if (!key) return;
    const { type, title, description } = FLASH_MESSAGES[key];
    // Fixed id: a message can't stack twice (e.g. Strict Mode re-running effects).
    toast[type](title, { description, id: `flash-${key}` });
  }, [pathname]);

  return null;
}

/** Shows any flash message the server left, on load and after each navigation. */
export function FlashToasts() {
  return (
    <Suspense fallback={null}>
      <FlashToastsContent />
    </Suspense>
  );
}
