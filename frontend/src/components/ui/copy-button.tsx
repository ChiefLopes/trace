"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";

/** Copies `value` to the clipboard and briefly confirms. */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** Accessible name, e.g. "Copy wallet address". */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label}
      disabled={copying}
      onClick={async () => {
        setCopying(true);
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied to clipboard", { id: "copied" });
        } catch {
          // Clipboard blocked (insecure context or permissions).
          toast.error("Couldn't copy", { description: "Select the text and copy it manually." });
        } finally {
          setCopying(false);
        }
      }}
      className={cn(
        "grid size-6 place-items-center rounded text-[#8f98b3] transition-colors hover:text-foreground active:scale-[0.9] active:brightness-110 disabled:opacity-50",
        className,
      )}
    >
      {copying ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : copied ? (
        <Check className="size-3.5 text-accent" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
