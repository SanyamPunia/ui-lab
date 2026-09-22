"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

// No bounce: an arc that overshoots would briefly show a value that isn't
// true. Longer than a UI transition because the eye has to follow a change
// in magnitude, not just notice one.
const FILL = { visualDuration: 0.6, bounce: 0 };

// Arc geometry in viewBox units. A half circle centred on (CX, CY), drawn
// left to right so pathLength 0 to 1 reads as 0 to 100.
const CX = 100;
const CY = 100;
const R = 84;
const STROKE = 12;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

function pointAt(percent: number, radius: number) {
  const angle = Math.PI * (1 - percent / 100);
  return [CX + radius * Math.cos(angle), CY - radius * Math.sin(angle)];
}

export function Gauge({
  value,
  label,
  threshold = 85,
  className,
}: {
  value: number;
  label: string;
  threshold?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  // Fills in when first seen, so a gauge below the fold still gets its
  // entrance instead of finishing offscreen.
  const inView = useInView(rootRef, { once: true });
  const clamped = Math.round(Math.min(Math.max(value, 0), 100));
  const high = clamped > threshold;

  // One spring drives both the arc and the number so they never drift apart.
  const progress = useSpring(0, FILL);
  const length = useTransform(progress, (v) => v / 100);
  // Round caps would otherwise leave a dot on an empty arc.
  const visible = useTransform(progress, (v) => (v < 0.5 ? 0 : 1));
  const shown = useTransform(progress, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) progress.jump(clamped);
    else progress.set(clamped);
  }, [clamped, inView, reduceMotion, progress]);

  // Colour follows the arc rather than the target, so it turns red the
  // moment the fill passes the threshold tick. Written to the DOM directly
  // to avoid a React render per frame.
  useMotionValueEvent(progress, "change", (v) => {
    const el = arcRef.current;
    if (el) el.dataset.danger = String(v > threshold);
  });

  // A small tick just outside the track marks where danger starts.
  const [tx1, ty1] = pointAt(threshold, R + STROKE / 2 + 4);
  const [tx2, ty2] = pointAt(threshold, R + STROKE / 2 + 9);

  return (
    <div
      ref={rootRef}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={`${clamped}%${high ? ", high" : ""}`}
      className={cn("flex w-[320px] max-w-full flex-col items-center", className)}
    >
      <div className="relative w-full">
        <svg
          viewBox="0 0 200 108"
          className="block w-full overflow-visible"
          fill="none"
          aria-hidden
        >
          <path
            d={ARC}
            className="stroke-border"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          <line
            x1={tx1}
            y1={ty1}
            x2={tx2}
            y2={ty2}
            className="stroke-muted"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <motion.path
            ref={arcRef}
            d={ARC}
            strokeWidth={STROKE}
            strokeLinecap="round"
            style={{ pathLength: length, opacity: visible }}
            className="stroke-foreground transition-[stroke] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] data-[danger=true]:stroke-danger"
          />
        </svg>

        {/* Tabular so the width holds steady while the number counts. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex items-baseline justify-center text-6xl leading-none font-semibold tracking-tight text-foreground tabular-nums"
        >
          <motion.span>{shown}</motion.span>
          <span className="ml-1 text-2xl font-medium text-muted">%</span>
        </span>
      </div>

      <div aria-hidden className="relative mt-3 flex h-6 items-center text-[15px]">
        <span className="text-muted">{label}</span>
        {/* Status never rides on colour alone, so high usage also gets a word.
            Out of flow so the label stays centred whether or not it shows. */}
        <span
          className={cn(
            "absolute left-full ml-2 flex items-center whitespace-nowrap gap-1.5 font-medium text-foreground transition-[opacity,filter,translate] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[opacity]",
            high
              ? "translate-y-0 opacity-100 blur-[0px] duration-200"
              : "translate-y-0.5 opacity-0 blur-[4px] duration-150 motion-reduce:translate-y-0",
          )}
        >
          <span className="size-2 rounded-full bg-danger" />
          High
        </span>
      </div>
    </div>
  );
}

const PRESETS = [
  { label: "CPU", value: 34 },
  { label: "Memory", value: 72 },
  { label: "Disk", value: 91 },
];

export default function GaugeDemo() {
  const [active, setActive] = useState(0);
  const preset = PRESETS[active];

  return (
    <div className="flex max-w-full flex-col items-center gap-6">
      <Gauge value={preset.value} label={preset.label} />
      <div className="flex gap-1 rounded-full bg-surface p-1">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "h-10 touch-manipulation rounded-full px-4 text-sm font-medium outline-none transition-[scale,color,background-color,box-shadow] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-[color,background-color,box-shadow]",
              i === active
                ? "bg-background text-foreground shadow-raised"
                : "text-muted hover:text-foreground",
            )}
          >
            {p.label} <span className="tabular-nums">{p.value}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
