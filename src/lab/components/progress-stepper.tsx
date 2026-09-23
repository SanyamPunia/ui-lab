"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;
// One connector fills in 240ms: long enough to read as travel from one step
// to the next, short enough to stay under the 300ms UI budget.
const LINE_MS = 240;
// A jump across several steps runs the connectors as a relay, each starting
// halfway through the previous one, so a full reset still ends in ~480ms.
const STAGGER_MS = 120;
// The step a line is heading for lights up just before the fill reaches it,
// so the circle reads as the line's destination rather than a separate event.
const ARRIVE_MS = 160;

type Status = "complete" | "current" | "upcoming";

export function ProgressStepper({
  steps,
  current,
  label = "Progress",
  className,
}: {
  steps: string[];
  current: number;
  label?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  // Remembers where the last move started, so delays run in the direction of
  // travel: forward fills left to right, back unfills right to left.
  const [move, setMove] = useState({ from: current, to: current });
  if (move.to !== current) setMove({ from: move.to, to: current });
  const { from } = move;
  const last = steps.length - 1;

  const lineDelay = (k: number) => {
    if (reduceMotion) return 0;
    if (current > from && k >= from && k < current) return (k - from) * STAGGER_MS;
    if (current < from && k >= current && k < from)
      return (from - 1 - k) * STAGGER_MS;
    return 0;
  };

  const stepDelay = (j: number) => {
    if (reduceMotion) return 0;
    if (current > from && j > from && j <= current)
      return (j - 1 - from) * STAGGER_MS + ARRIVE_MS;
    if (current < from && j >= current && j < from)
      return (from - 1 - j) * STAGGER_MS + ARRIVE_MS;
    return 0;
  };

  const statusOf = (j: number): Status =>
    j < current ? "complete" : j === current ? "current" : "upcoming";

  return (
    <div className={cn("w-[min(520px,100%)]", className)}>
      <ol
        aria-label={label}
        className="grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, j) => {
          const status = statusOf(j);
          // The last step is a destination, not a task: reaching it completes it.
          const checked =
            status === "complete" || (status === "current" && j === last);
          const delay = stepDelay(j);
          return (
            <li
              key={step}
              aria-current={status === "current" ? "step" : undefined}
              className="relative flex flex-col items-center gap-2.5"
            >
              {j < last && (
                // Starts 8px clear of each 36px circle: 18px radius + 8px gap.
                <span
                  aria-hidden
                  className="absolute top-[17px] right-[calc(-50%+26px)] left-[calc(50%+26px)] h-0.5 overflow-hidden rounded-full bg-border"
                >
                  <span
                    className={cn(
                      "absolute inset-0 origin-left rounded-full bg-foreground transition-[scale] ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none rtl:origin-right",
                      j < current ? "scale-x-100" : "scale-x-0",
                    )}
                    style={{
                      transitionDuration: `${LINE_MS}ms`,
                      transitionDelay: `${lineDelay(j)}ms`,
                    }}
                  />
                </span>
              )}
              <span
                aria-hidden
                className={cn(
                  "relative grid size-9 place-items-center rounded-full text-sm font-medium tabular-nums inset-ring ring-foreground/10 transition-[background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  checked
                    ? "bg-foreground text-background inset-ring-foreground"
                    : status === "current"
                      ? "bg-background text-foreground inset-ring-foreground"
                      : "bg-background text-muted inset-ring-border",
                  // A soft 4px halo marks where you are without another color.
                  status === "current" ? "ring-4" : "ring-0",
                )}
                style={{ transitionDelay: `${delay}ms` }}
              >
                <Swap visible={!checked} delay={delay} reduceMotion={reduceMotion}>
                  {j + 1}
                </Swap>
                <Swap visible={checked} delay={delay} reduceMotion={reduceMotion}>
                  <svg
                    viewBox="0 0 16 16"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                </Swap>
              </span>
              <span
                className={cn(
                  "text-center text-sm transition-[color] duration-200 ease-out",
                  status === "upcoming" ? "text-muted" : "text-foreground",
                )}
                style={{ transitionDelay: `${delay}ms` }}
              >
                {step}
                <span className="sr-only">
                  {checked ? ", completed" : status === "upcoming" ? ", not started" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <span className="sr-only" aria-live="polite">
        {current !== from
          ? `Step ${current + 1} of ${steps.length}: ${steps[current]}`
          : ""}
      </span>
    </div>
  );
}

function Swap({
  visible,
  delay,
  reduceMotion,
  children,
}: {
  visible: boolean;
  delay: number;
  reduceMotion: boolean | null;
  children: React.ReactNode;
}) {
  // Reduced motion keeps the cross-fade but drops the scale and blur.
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { scale: 0.25, opacity: 0, filter: "blur(4px)" };
  return (
    <motion.span
      className="col-start-1 row-start-1 grid place-items-center"
      initial={false}
      animate={visible ? { scale: 1, opacity: 1, filter: "blur(0px)" } : hidden}
      // Both glyphs wait with the circle's fill, so a circle is never left
      // blank while its color is still catching up.
      transition={{ ...ICON_SWAP, delay: delay / 1000 }}
    >
      {children}
    </motion.span>
  );
}

const button =
  "h-10 touch-manipulation rounded-full px-4 text-sm font-medium outline-hidden transition-[scale,opacity] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-[opacity]";

export default function ProgressStepperDemo() {
  const steps = ["Cart", "Shipping", "Payment", "Done"];
  const [current, setCurrent] = useState(0);
  const last = steps.length - 1;
  const atStart = current === 0;
  const atEnd = current === last;

  return (
    <div className="flex w-[min(520px,100%)] flex-col gap-10">
      <ProgressStepper steps={steps} current={current} label="Checkout progress" />
      <div className="flex items-center justify-between">
        {/* aria-disabled rather than disabled, so a keyboard user who backs up
            to the start keeps focus on the button instead of losing it. */}
        <button
          type="button"
          aria-disabled={atStart}
          onClick={() => !atStart && setCurrent((c) => c - 1)}
          className={cn(
            button,
            "bg-surface text-foreground shadow-raised",
            atStart && "cursor-not-allowed opacity-50 active:scale-100",
          )}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setCurrent((c) => (c === last ? 0 : c + 1))}
          className={cn(button, "bg-foreground text-background")}
        >
          {/* Both labels share one cell, so the button keeps one width and
              never shifts under the cursor when it turns into Start over. */}
          <span className="grid">
            <Label visible={!atEnd}>Continue</Label>
            <Label visible={atEnd}>Start over</Label>
          </span>
        </button>
      </div>
    </div>
  );
}

function Label({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <span
      aria-hidden={!visible}
      className={cn(
        "col-start-1 row-start-1 transition-[opacity,filter] duration-200 ease-out",
        !visible && "opacity-0 blur-[4px]",
      )}
    >
      {children}
    </span>
  );
}
