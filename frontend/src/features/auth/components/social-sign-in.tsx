import { ArrowRight, Loader2 } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";

import { GoogleLogo } from "@/components/icons/google-logo";
import { XLogo } from "@/components/icons/x-logo";
import { cn } from "@/lib/utils/cn";

const ALL_PROVIDERS = [
  { id: "google", name: "Google", Logo: GoogleLogo },
  { id: "x", name: "X", Logo: XLogo },
] as const;

export type OAuthProvider = (typeof ALL_PROVIDERS)[number]["id"];

export const oauthProviderName = Object.fromEntries(
  ALL_PROVIDERS.map(({ id, name }) => [id, name]),
) as Record<OAuthProvider, string>;

/** Horizontal drag (px) that counts as a swipe between providers. */
const SWIPE_THRESHOLD = 28;

type SocialSignInProps = {
  /** "Sign up with" / "Continue with": prefixes the provider name. */
  label: string;
  /** Called with the chosen provider. */
  onContinue: (provider: OAuthProvider) => void;
  /** Whether an OAuth redirect is in progress. */
  isLoading?: boolean;
  /** Whether to show X (Twitter) authentication. Hidden by default on prod until ready. */
  showX?: boolean;
};

/**
 * Social sign-in button. When showX is enabled, the logo switch on the left
 * picks the provider (click, arrow keys, or swipe anywhere on the pill); the
 * rest of the pill continues with it, and its label slides to match.
 * When showX is false (e.g. on prod before X OAuth is configured), it renders
 * directly as a clean Google sign-in button.
 */
export function SocialSignIn({
  label,
  onContinue,
  isLoading,
  showX = process.env.NEXT_PUBLIC_ENABLE_X_AUTH === "true" || process.env.NODE_ENV === "test",
}: SocialSignInProps) {
  const providers = showX ? ALL_PROVIDERS : ALL_PROVIDERS.filter((p) => p.id === "google");
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const dragStartX = useRef<number | null>(null);
  const swiped = useRef(false);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);

  const provider = providers[index] ?? providers[0]!;

  const select = (next: number, focus = false) => {
    if (providers.length <= 1) return;
    const bounded = (next + providers.length) % providers.length;
    if (bounded === index) return;
    setDirection(bounded > index ? "next" : "prev");
    setIndex(bounded);
    if (focus) radios.current[bounded]?.focus();
  };

  // Swipe: left → next provider, right → previous. Mouse drags count too.
  const onPointerDown = (event: PointerEvent) => {
    if (providers.length <= 1) return;
    dragStartX.current = event.clientX;
    swiped.current = false;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (providers.length <= 1 || dragStartX.current === null) return;
    const dx = event.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    // Swallow the click this pointerup is about to fire, then forget the swipe
    // so a later keyboard activation isn't swallowed too.
    swiped.current = true;
    setTimeout(() => (swiped.current = false), 0);
    select(dx < 0 ? index + 1 : index - 1);
  };

  // Roving focus, as in a native radio group.
  const onRadioKeyDown = (event: KeyboardEvent) => {
    if (providers.length <= 1) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") select(index + 1, true);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") select(index - 1, true);
    else return;
    event.preventDefault();
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (dragStartX.current = null)}
      // Lets touch swipes reach us instead of scrolling the page sideways.
      className="group flex h-11 w-full touch-pan-y items-center gap-1 rounded-full bg-foreground p-1 text-background shadow-[0_2px_12px_rgba(255,255,255,0.12)] transition-all duration-200 select-none hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_4px_20px_rgba(255,255,255,0.25)] active:translate-y-0"
    >
      {providers.length > 1 ? (
        <div
          role="radiogroup"
          aria-label={`${label}…`}
          className="relative grid h-full w-[76px] shrink-0 grid-cols-2 rounded-full bg-[#dfe4ee]"
        >
          {/* Sliding thumb behind the selected logo. */}
          <span
            aria-hidden
            className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-[0_1px_3px_rgb(2_10_35/0.25)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(${index * 100}%)` }}
          />
          {providers.map(({ id, name, Logo }, i) => (
            <button
              key={id}
              ref={(el) => {
                radios.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={i === index}
              aria-label={name}
              tabIndex={i === index ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={onRadioKeyDown}
              disabled={isLoading}
              className={cn(
                "relative z-10 grid place-items-center rounded-full transition-opacity active:scale-95",
                i === index ? "opacity-100" : "opacity-45 hover:opacity-80",
                isLoading && "pointer-events-none opacity-50",
              )}
            >
              <Logo className="size-4" />
            </button>
          ))}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="relative grid size-9 shrink-0 place-items-center rounded-full bg-[#dfe4ee] shadow-[0_1px_3px_rgb(2_10_35/0.15)]"
        >
          <provider.Logo className="size-4" />
        </div>
      )}

      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          // A swipe that ends on this button must not also count as a click.
          if (swiped.current) {
            swiped.current = false;
            return;
          }
          onContinue(provider.id);
        }}
        className="flex h-full min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full px-3 text-xs font-bold tracking-wide active:scale-[0.98] active:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:translate-x-1"
      >
        <span
          key={provider.id}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap",
            providers.length > 1 &&
              (direction === "next"
                ? "motion-safe:animate-swipe-from-right"
                : "motion-safe:animate-swipe-from-left"),
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            <>
              {label} {provider.name}
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </>
          )}
        </span>
      </button>
    </div>
  );
}
