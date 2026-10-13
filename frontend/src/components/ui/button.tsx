import { cn } from "@/lib/utils/cn";
import { ButtonClient, type ButtonProps } from "./button-client";

const base =
  "group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full font-bold tracking-wide whitespace-nowrap uppercase transition-all duration-200 ease-out cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] active:brightness-95 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:translate-x-0.5";

const variants = {
  /** Amber call-to-action with glowing bloom and smooth lift. */
  primary:
    "bg-linear-to-r from-accent via-[#ffbe4d] to-accent text-accent-foreground shadow-[0_0_24px_-4px_var(--accent)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(252,163,17,0.75),0_8px_20px_rgba(0,0,0,0.35)] hover:brightness-105 active:translate-y-0 active:scale-[0.97] before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/35 before:to-transparent before:transition-transform before:duration-700 before:ease-in-out hover:before:translate-x-full",
  /** Off-white, for secondary actions such as social sign-in. */
  light:
    "bg-foreground text-background normal-case shadow-[0_0_16px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white hover:shadow-[0_0_28px_rgba(255,255,255,0.4)] active:translate-y-0 active:scale-[0.97] before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent before:transition-transform before:duration-700 before:ease-in-out hover:before:translate-x-full",
  /** Text-only, amber with soft background pill. */
  ghost:
    "text-accent hover:bg-accent/10 hover:-translate-y-0.5 hover:text-[color-mix(in_srgb,var(--accent)_90%,white)] hover:shadow-[0_0_16px_rgba(252,163,17,0.25)] active:translate-y-0 active:scale-[0.97]",
} as const;

const sizes = {
  sm: "h-9 px-5 text-xs",
  md: "h-11 px-6 text-xs sm:text-sm",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/**
 * Button classes, usable on any element (Server or Client component). Use this to
 * style a `<Link>` as a button so navigation stays a real anchor (middle-click, prefetch, a11y).
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export { ButtonClient as Button };
export type { ButtonProps };
