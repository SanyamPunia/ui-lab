"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

// Inside the glass, in viewBox units: the ink line when full and when dry.
const FULL_Y = 21;
const DRY_Y = 51;
const LEFT = 7;
const RIGHT = 41;
// The level follows the count on a slightly loose spring so each keystroke
// lets the ink settle rather than step.
const LEVEL_K = 90;
const LEVEL_C = 16;
// Surface ripples die out over about a second and a half once typing stops.
const WAVE_DECAY = 2.4;
const WAVE_MAX = 2.6;
// Below this, the surface is flat enough to stop drawing frames.
const REST = 0.02;
// Remaining-count fraction where the ink turns to the danger color.
const WARN = 0.1;

type Bucket = "ok" | "warn" | "full" | "over";

function bucketFor(remaining: number, limit: number): Bucket {
  if (remaining < 0) return "over";
  if (remaining === 0) return "full";
  if (remaining <= Math.max(1, Math.round(limit * WARN))) return "warn";
  return "ok";
}

function surfacePath(level: number, amp: number, phase: number) {
  let d = "";
  // Two detuned sines read as liquid; a single one reads as a graph.
  for (let x = LEFT; x <= RIGHT; x += 2) {
    const y =
      level +
      amp * Math.sin(x * 0.32 + phase) +
      amp * 0.45 * Math.sin(x * 0.71 - phase * 1.4);
    d += `${d ? "L" : "M"}${x} ${y.toFixed(2)}`;
  }
  return `${d}L${RIGHT} 60L${LEFT} 60Z`;
}

export function InkWell({
  value,
  onChange,
  limit = 200,
  label,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  limit?: number;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const remaining = limit - value.length;
  const bucket = bucketFor(remaining, limit);
  const fraction = Math.min(Math.max(remaining / limit, 0), 1);
  const target = DRY_Y - (DRY_Y - FULL_Y) * fraction;

  const inkRef = useRef<SVGPathElement>(null);
  // Rendered once; after that only the rAF loop writes the surface, so a
  // re-render mid-slosh never snaps it flat.
  const [initialInk] = useState(() => surfacePath(target, 0, 0));
  const sim = useRef({ level: target, vel: 0, amp: 0, phase: 0, target });
  const frame = useRef(0);
  const lastInput = useRef(0);

  // Announce only when crossing a threshold; a running count in a live
  // region would talk over every keystroke.
  const [announcement, setAnnouncement] = useState("");
  const lastBucket = useRef(bucket);
  useEffect(() => {
    if (bucket === lastBucket.current) return;
    lastBucket.current = bucket;
    setAnnouncement(
      bucket === "warn"
        ? `${remaining} characters left`
        : bucket === "full"
          ? "Character limit reached"
          : bucket === "over"
            ? "Over the character limit"
            : "",
    );
    // Only the crossing matters here, not every count inside a bucket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket]);

  const draw = () => {
    const s = sim.current;
    inkRef.current?.setAttribute("d", surfacePath(s.level, s.amp, s.phase));
  };

  const run = () => {
    if (frame.current) return;
    let last = performance.now();
    const tick = (now: number) => {
      const s = sim.current;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      s.vel += (-LEVEL_K * (s.level - s.target) - LEVEL_C * s.vel) * dt;
      s.level += s.vel * dt;
      s.amp *= Math.exp(-WAVE_DECAY * dt);
      s.phase += dt * 7;
      draw();
      const still =
        s.amp < REST &&
        Math.abs(s.vel) < REST &&
        Math.abs(s.level - s.target) < REST;
      if (still) {
        s.amp = 0;
        s.level = s.target;
        draw();
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const s = sim.current;
    s.target = target;
    if (reduceMotion) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      Object.assign(s, { level: target, vel: 0, amp: 0 });
      draw();
      return;
    }
    run();
    // run and draw only touch refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduceMotion]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const slosh = () => {
    if (reduceMotion) return;
    const now = performance.now();
    const gap = now - lastInput.current;
    lastInput.current = now;
    // Quick typing sloshes harder; a lone key after a pause barely ripples.
    const kick = Math.min(1, 90 / Math.max(gap, 30)) * 0.9 + 0.15;
    const s = sim.current;
    s.amp = Math.min(WAVE_MAX, s.amp + kick);
    run();
  };

  const dry = remaining <= 0;
  const hot = bucket !== "ok";

  return (
    <div className={cn("w-[min(440px,100%)]", className)}>
      <label
        htmlFor={`${id}-field`}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <textarea
        id={`${id}-field`}
        value={value}
        placeholder={placeholder}
        aria-describedby={`${id}-count`}
        aria-invalid={remaining < 0 || undefined}
        onChange={(e) => {
          onChange(e.target.value);
          slosh();
        }}
        rows={5}
        className={cn(
          "block h-36 w-full resize-none rounded-xl bg-background px-3.5 py-3 text-[15px] leading-relaxed text-foreground shadow-raised outline-hidden transition-[box-shadow] duration-150 ease-out placeholder:text-muted focus:shadow-[0_0_0_1.5px_var(--foreground)]",
          remaining < 0 &&
            "shadow-[0_0_0_1.5px_var(--danger)] focus:shadow-[0_0_0_1.5px_var(--danger)]",
        )}
      />
      <div className="mt-3 flex items-center justify-end gap-3">
        <p
          aria-hidden
          className={cn(
            "text-right text-sm leading-tight transition-[color] duration-200 ease-out",
            hot ? "text-danger" : "text-muted",
          )}
        >
          <span className="block text-2xl font-semibold tracking-tight tabular-nums">
            {remaining}
          </span>
          {remaining < 0 ? "over the limit" : "characters left"}
        </p>
        <span id={`${id}-count`} className="sr-only">
          {remaining < 0
            ? `${-remaining} characters over the ${limit} character limit`
            : `${remaining} of ${limit} characters remaining`}
        </span>
        <svg viewBox="0 0 48 56" className="h-14 w-12 shrink-0" aria-hidden>
          <defs>
            <clipPath id={`${id}-glass`}>
              <path d="M9 17h30a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V21a4 4 0 0 1 4-4Z" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-glass)`}>
            {/* A dried ring where the last of the ink sat. */}
            <ellipse
              cx={24}
              cy={50}
              rx={15}
              ry={2.5}
              className={cn(
                "fill-none stroke-foreground transition-[opacity] duration-300 ease-out",
                dry ? "opacity-20" : "opacity-0",
              )}
              strokeWidth={1}
            />
            <path
              ref={inkRef}
              d={initialInk}
              className={cn(
                "transition-[fill] duration-200 ease-out",
                hot ? "fill-danger" : "fill-foreground/85",
              )}
            />
          </g>
          {/* Glass body, neck and lip. */}
          <path
            d="M9 17h30a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V21a4 4 0 0 1 4-4Z"
            className="fill-foreground/[0.04] stroke-foreground/35"
            strokeWidth={1.25}
          />
          <path
            d="M17 17v-8h14v8"
            className="fill-foreground/[0.04] stroke-foreground/35"
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
          <rect
            x={15}
            y={5}
            width={18}
            height={4}
            rx={1.5}
            className="fill-surface stroke-foreground/35"
            strokeWidth={1.25}
          />
          {/* Highlight down the glass wall. */}
          <path
            d="M9 23v22"
            className="stroke-background/70"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

export default function InkWellDemo() {
  const [text, setText] = useState(
    "Dear Ada, the prototype finally runs. ",
  );
  return (
    <InkWell
      label="Postcard"
      placeholder="Write a short note"
      limit={160}
      value={text}
      onChange={setText}
    />
  );
}
