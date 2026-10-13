import { Shield } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/*
 * Centered High-Tech Cyber-Forensic Spinner Overlay:
 * Appears dead center as a frosted overlay while page/route loading happens.
 * Features a dual-ring counter-rotating radar reticle, glowing pulse core,
 * laser scanline beam, and an active status ticker.
 *
 * CSS-only animations for instant Suspense fallback with 0 JS hydration lag.
 */

const STATUS_LINES = [
  "Scanning the ledger…",
  "Following the money…",
  "Linking wallets…",
  "Decoding transactions…",
];

export function TraceLoader({
  label = "Tracing the funds",
  className,
}: {
  /** Headline under the spinner. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-all duration-300",
        className,
      )}
    >
      {/* Floating Center HUD Card */}
      <div className="relative flex w-full max-w-sm flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-accent/40 bg-linear-to-b from-[#030a24] via-[#020719] to-[#010410] p-8 text-center shadow-[0_0_60px_rgba(0,18,60,0.9),0_0_35px_rgba(252,163,17,0.35)]">
        {/* Top specular highlight edge line */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent to-transparent"
        />

        {/* HUD corner brackets */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 left-2 size-3 border-t-2 border-l-2 border-accent/80"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 right-2 size-3 border-t-2 border-r-2 border-accent/80"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-accent/80"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 bottom-2 size-3 border-r-2 border-b-2 border-accent/80"
        />

        {/* Sweeping laser scanline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_var(--accent)] motion-safe:animate-scanline"
        />

        {/* Concentric High-Tech Radar Spinner */}
        <div aria-hidden className="relative size-20">
          {/* Subtle ambient core glow */}
          <div className="absolute inset-0 m-auto size-12 animate-pulse rounded-full bg-accent/20 blur-md" />

          {/* Outer dashed radar ring (clockwise) */}
          <div className="absolute inset-0 m-auto size-20 animate-spin rounded-full border-2 border-dashed border-accent/70 [animation-duration:3.5s]" />

          {/* Middle counter-rotating radar reticle (counter-clockwise) */}
          <div className="absolute inset-0 m-auto size-14 animate-spin rounded-full border-2 border-accent/20 border-t-accent border-r-accent/60 shadow-[0_0_10px_rgba(252,163,17,0.35)] [animation-direction:reverse] [animation-duration:1.6s]" />

          {/* Inner rotating reticle ring (clockwise) */}
          <div className="absolute inset-0 m-auto size-9 animate-spin rounded-full border-2 border-dashed border-accent/50 [animation-duration:2.2s]" />

          {/* Center spinning loader SVG (exact center) */}
          <svg
            className="absolute inset-0 m-auto size-5 animate-spin text-accent [animation-duration:1.1s]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>

          {/* Center pulsing bullseye core */}
          <div className="absolute inset-0 m-auto size-2 animate-pulse rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
        </div>

        {/* Status telemetry badge */}
        <div
          aria-hidden
          className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3.5 py-1 font-mono text-[10px] font-bold tracking-widest text-accent uppercase shadow-[0_0_12px_rgba(252,163,17,0.25)]"
        >
          <span className="size-1.5 animate-ping rounded-full bg-accent" />
          <Shield className="size-3" />
          TRACE FORENSICS
        </div>

        {/* Headline & status lines */}
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="font-display text-xl font-black tracking-wide text-white uppercase sm:text-2xl">
            {label}
          </h3>

          {/* Rotating status lines ticker */}
          <div aria-hidden className="h-5 overflow-hidden">
            <ul className="font-mono text-[12px] leading-5 tracking-[0.06em] text-accent motion-safe:animate-trace-ticker">
              {STATUS_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <p className="max-w-[260px] text-xs leading-relaxed text-[#94a3b8]">
            Syncing on-chain activity. Hang tight while the workspace loads.
          </p>
        </div>

        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
