"use client";

import { useId, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

export type Swatch = {
  name: string;
  color: string;
  // Color of the check drawn on the swatch.
  ink: string;
};

const LIGHT_INK = "oklch(0.99 0 0)";
const DARK_INK = "oklch(0.22 0.01 260)";

// The one place raw colors are allowed: these swatches are the data. Muted
// mid-tones (chroma 0.08 to 0.13) so none shouts next to the monochrome UI,
// and all hold their own on either theme's background. Above about L 0.65 a
// white check drops under 3:1, so those swatches take the dark ink instead.
export const THEME_SWATCHES: Swatch[] = [
  { name: "Graphite", color: "oklch(0.42 0.02 260)", ink: LIGHT_INK },
  { name: "Clay", color: "oklch(0.6 0.13 35)", ink: LIGHT_INK },
  { name: "Ochre", color: "oklch(0.78 0.12 80)", ink: DARK_INK },
  { name: "Sage", color: "oklch(0.72 0.08 145)", ink: DARK_INK },
  { name: "Teal", color: "oklch(0.58 0.08 210)", ink: LIGHT_INK },
  { name: "Iris", color: "oklch(0.56 0.13 280)", ink: LIGHT_INK },
  { name: "Rose", color: "oklch(0.7 0.1 0)", ink: DARK_INK },
];

// No bounce: a ring that overshoots would briefly circle the wrong color.
const RING = { type: "spring", duration: 0.3, bounce: 0 } as const;
const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;
const INSTANT = { duration: 0 } as const;

export function ColorSwatches({
  swatches,
  value,
  onChange,
  label,
  className,
}: {
  swatches: Swatch[];
  value: string;
  onChange: (name: string) => void;
  label: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  // Scopes the ring's layoutId, so two pickers on a page never trade rings.
  const group = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Math.max(
    swatches.findIndex((s) => s.name === value),
    0,
  );

  // Radio pattern: arrows move focus and selection together, wrapping.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = swatches.length - 1;
    const forward = selected === last ? 0 : selected + 1;
    const back = selected === 0 ? last : selected - 1;
    const next: Record<string, number> = {
      ArrowRight: forward,
      ArrowDown: forward,
      ArrowLeft: back,
      ArrowUp: back,
      Home: 0,
      End: last,
    };
    const index = next[event.key];
    if (index === undefined) return;
    event.preventDefault();
    onChange(swatches[index].name);
    buttons.current[index]?.focus();
  };

  return (
    <LayoutGroup id={group}>
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn("flex items-center gap-3", className)}
      >
        {swatches.map((swatch, index) => {
          const checked = index === selected;
          return (
            <button
              key={swatch.name}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={swatch.name}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(swatch.name)}
              style={{ backgroundColor: swatch.color, color: swatch.ink }}
              className={cn(
                "relative flex size-8 touch-manipulation items-center justify-center rounded-full outline-none transition-[scale] duration-150 ease-out select-none active:scale-[0.96] motion-reduce:transition-none",
                // The image outline recipe, so a light swatch keeps its edge
                // on a light background and a dark one on a dark background.
                "shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.1)]",
                // Clears the 4px ring with a 2px gap.
                "focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-foreground",
                // Grows the hit area to 40px without growing the circle.
                "after:absolute after:-inset-1 after:rounded-full",
              )}
            >
              {checked && (
                <motion.span
                  layoutId="ring"
                  aria-hidden
                  transition={reduceMotion ? INSTANT : RING}
                  // 2px gap, then a 2px ring: a 32px swatch in a 40px ring.
                  className="pointer-events-none absolute -inset-1 rounded-full border-2 border-foreground"
                />
              )}
              <motion.svg
                aria-hidden
                viewBox="0 0 16 16"
                className="size-4"
                fill="none"
                stroke="currentColor"
                // Heavier than the lab's usual 1.5: it sits alone on
                // saturated color, with no text beside it to match.
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={
                  checked
                    ? { scale: 1, opacity: 1, filter: "blur(0px)" }
                    : reduceMotion
                      ? { scale: 1, opacity: 0, filter: "blur(0px)" }
                      : { scale: 0.25, opacity: 0, filter: "blur(4px)" }
                }
                transition={ICON_SWAP}
              >
                <path d="m3.5 8.5 3 3 6-7" />
              </motion.svg>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export default function ColorSwatchesDemo() {
  const [value, setValue] = useState("Clay");
  const swatch =
    THEME_SWATCHES.find((s) => s.name === value) ?? THEME_SWATCHES[0];

  return (
    <div className="flex flex-col items-center gap-6">
      <ColorSwatches
        swatches={THEME_SWATCHES}
        value={value}
        onChange={setValue}
        label="Theme color"
      />
      {/* A preview, not a real action: the chosen color applied to a button
          and a tag. Screen readers already hear the choice from the radio. */}
      <div aria-hidden className="flex items-center gap-2">
        <span
          style={{ backgroundColor: swatch.color, color: swatch.ink }}
          className="flex h-9 items-center rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-200 ease-out motion-reduce:transition-none"
        >
          Save changes
        </span>
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-surface pr-3 pl-2.5 text-xs font-medium text-foreground">
          <span
            style={{ backgroundColor: swatch.color }}
            className="size-2 rounded-full transition-[background-color] duration-200 ease-out motion-reduce:transition-none"
          />
          {/* Every name shares one grid cell, so the tag keeps the width of
              the longest and never jumps; the new one blurs in. */}
          <span className="grid">
            {THEME_SWATCHES.map((s) => (
              <span
                key={s.name}
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,filter,translate] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[opacity]",
                  s.name === value
                    ? "translate-y-0 opacity-100 blur-[0px] duration-200"
                    : "translate-y-0.5 opacity-0 blur-[4px] duration-150 motion-reduce:translate-y-0",
                )}
              >
                {s.name}
              </span>
            ))}
          </span>
        </span>
      </div>
    </div>
  );
}
