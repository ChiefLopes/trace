import Image from "next/image";

import { cn } from "@/lib/utils/cn";

import type { Investigator } from "../data";

/**
 * The chosen investigator standing under a spotlight that falls from the
 * top-right corner (Figma: Desktop - 6). The box is 462×1073 with its origin
 * at Figma canvas x=1266, y=0; place it with `className`.
 *
 * The beam is Figma's render with the background subtracted, so it is drawn
 * with additive blending (`plus-lighter`) and lights whatever is behind it.
 */
type SpotlightPlacement = {
  top: number;
  left: number;
  width: number;
  height: number;
  flip: boolean;
};

/**
 * Calibrated positions ensuring all investigators:
 * 1. Face left towards the prompt (flipping officers 1, 3, 4 horizontally).
 * 2. Start at the top of the spotlight beam (head aligned with light angle).
 * 3. Have their feet planted grounded on the floor ellipse.
 */
const DEFAULT_PLACEMENT: SpotlightPlacement = {
  top: 306.2,
  left: 36.4,
  width: 332.1,
  height: 792.8,
  flip: false,
};

const SPOTLIGHT_PLACEMENTS: Record<string, SpotlightPlacement> = {
  "officer-1": {
    top: 277.0,
    left: 109.1,
    width: 340.5,
    height: 824.8,
    flip: true,
  },
  "officer-2": { ...DEFAULT_PLACEMENT, flip: false },
  "officer-3": {
    top: 310.7,
    left: 106.6,
    width: 275.0,
    height: 782.2,
    flip: true,
  },
  "officer-4": {
    top: 282.8,
    left: 98.4,
    width: 291.1,
    height: 775.5,
    flip: true,
  },
};

export function SpotlightInvestigator({
  investigator,
  className,
}: {
  investigator: Investigator;
  className?: string;
}) {
  const art = investigator.fullBody;
  const placement: SpotlightPlacement = SPOTLIGHT_PLACEMENTS[investigator.id] ?? DEFAULT_PLACEMENT;

  return (
    <div className={cn("pointer-events-none relative h-[1073px] w-[462px] select-none", className)}>
      <Image
        src="/effects/spotlight-floor.png"
        alt=""
        width={412}
        height={183}
        className="absolute top-[890px] left-[50.4px] max-w-none"
      />

      {art ? (
        <Image
          src={art.src}
          alt={investigator.description}
          width={art.width}
          height={art.height}
          sizes={`${Math.round(placement.width)}px`}
          preload
          style={{
            top: `${placement.top}px`,
            left: `${placement.left}px`,
            width: `${placement.width}px`,
            height: `${placement.height}px`,
          }}
          className={cn(
            "pointer-events-none absolute max-w-none select-none",
            placement.flip && "-scale-x-100",
          )}
        />
      ) : (
        <div className="absolute top-[391px] left-[120px] h-[611px] w-[220px]">
          <Image
            src={investigator.image.src}
            alt={investigator.description}
            fill
            preload
            sizes="220px"
            className="object-contain object-bottom"
          />
        </div>
      )}

      <Image
        src="/effects/spotlight-beam.png"
        alt=""
        width={462}
        height={760}
        preload
        className="absolute top-0 left-[0.4px] max-w-none mix-blend-plus-lighter"
      />
    </div>
  );
}
