"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

// Everything is drawn in a 280 unit square; pointer math scales into it.
const SIZE = 280;
const C = SIZE / 2;
const HOLE_RING = 98;
const HOLE_R = 19;
// A little larger than the hole so a finger landing on its rim still catches.
const HIT_R = 24;
const DISC_R = 128;
const CARD_R = 52;

// Angles are compass degrees: 0 at twelve o'clock, growing clockwise.
// Holes sit 30deg apart with 1 at two o'clock and 0 near five, leaving the
// gap at the bottom right where the finger stop lives.
const HOOK = 126;
// A hole is blocked by the hook once its centre gets this close: its own
// angular radius plus room for a fingertip.
const BLOCKED = HOOK - 22;
// How far a finger can overshoot the stop or the rest position before the
// disc stops caring where the pointer went.
const SLACK = 90;
// Letting go this close to the stop still counts, like a real dial's give.
const STOP_TOLERANCE = 4;
// A governor holds a real dial's return to about ten pulses a second. Slower
// than other UI on purpose: the steady unwind is the feel of the object, and
// even 0 comes home in under a second.
const RETURN_SPEED = 360;
// Nearly linear with softened ends, so the disc neither lurches off the stop
// nor thumps into rest. No overshoot: governors don't bounce.
const RETURN_EASE = [0.1, 0.04, 0.9, 0.96] as const;
// A hand winding the disc: quick to get going, easing into the stop.
const WIND_EASE = [0.45, 0, 0.25, 1] as const;
// Held against the stop for a beat before letting go, as a finger would.
const HOLD_MS = 70;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

function rest(digit: number) {
  const k = digit === 0 ? 10 : digit;
  return 60 - 30 * (k - 1);
}

function travel(digit: number) {
  return BLOCKED - rest(digit);
}

function polar(radius: number, degrees: number) {
  const a = (degrees * Math.PI) / 180;
  return [C + radius * Math.sin(a), C - radius * Math.cos(a)] as const;
}

function compass(x: number, y: number) {
  return (Math.atan2(x - C, C - y) * 180) / Math.PI;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

// One path with the holes cut by evenodd, so the disc is a single layer.
const DISC_PATH = [
  circle(C, C, DISC_R),
  circle(C, C, CARD_R + 4),
  ...DIGITS.map((d) => {
    const [x, y] = polar(HOLE_RING, rest(d));
    return circle(x, y, HOLE_R);
  }),
].join("");

const HOOK_FROM = polar(HOLE_RING + 8, HOOK);
const HOOK_TO = polar(C - 3, HOOK);

type Phase = "idle" | "drag" | "out" | "back";
type Grab = {
  id: number;
  digit: number;
  last: number;
  raw: number;
  moved: number;
  atStop: boolean;
};

export function RotaryDial({
  value,
  onChange,
  label,
  maxLength = 10,
  groups = [3, 3, 4],
  autoFocus = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  maxLength?: number;
  /** Digit group sizes in the readout, e.g. [3, 3, 4] for a phone number. */
  groups?: number[];
  autoFocus?: boolean;
  className?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const rotation = useMotionValue(0);
  const dialRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<HTMLDivElement>(null);

  const phase = useRef<Phase>("idle");
  const active = useRef<number | null>(null);
  const queue = useRef<number[]>([]);
  const grab = useRef<Grab | null>(null);
  const anim = useRef<ReturnType<typeof animate> | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Animation callbacks outlive the render that started them, so they read
  // the latest props through refs.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const reduceRef = useRef(reduceMotion);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    reduceRef.current = reduceMotion;
  });

  useEffect(() => {
    if (autoFocus) dialRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  useEffect(
    () => () => {
      anim.current?.stop();
      clearTimeout(hold.current);
    },
    [],
  );

  const commit = (digit: number) => {
    if (valueRef.current.length >= maxLength) return;
    const next = valueRef.current + digit;
    valueRef.current = next;
    onChangeRef.current(next);
  };

  const inFlight = () =>
    (phase.current === "out" || phase.current === "back") && active.current !== null ? 1 : 0;
  const room = () => maxLength - valueRef.current.length - queue.current.length - inFlight();

  const halt = () => {
    anim.current?.stop();
    anim.current = null;
    clearTimeout(hold.current);
  };

  const bumpStop = () => {
    if (reduceRef.current) return;
    stopRef.current?.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(1.5deg)" }, { transform: "rotate(0deg)" }],
      { duration: 180, easing: EASE_OUT },
    );
  };

  const settle = () => {
    phase.current = "idle";
    active.current = null;
    const next = queue.current.shift();
    if (next !== undefined) windOut(next);
  };

  const unwind = (digit: number | null) => {
    phase.current = "back";
    active.current = digit;
    const from = rotation.get();
    const done = () => {
      anim.current = null;
      if (digit !== null) commit(digit);
      settle();
    };
    if (reduceRef.current || from < 0.5) {
      rotation.jump(0);
      done();
      return;
    }
    anim.current = animate(rotation, 0, {
      duration: from / RETURN_SPEED,
      ease: RETURN_EASE,
      onComplete: done,
    });
  };

  // Typed digits and tapped holes take exactly the path a finger would.
  const windOut = (digit: number) => {
    phase.current = "out";
    active.current = digit;
    if (reduceRef.current) {
      rotation.jump(0);
      commit(digit);
      settle();
      return;
    }
    const to = travel(digit);
    anim.current = animate(rotation, to, {
      duration: 0.16 + (to - rotation.get()) / 1100,
      ease: WIND_EASE,
      onComplete: () => {
        bumpStop();
        hold.current = setTimeout(() => unwind(digit), HOLD_MS);
      },
    });
  };

  // Grabbing the disc mid-flight lands everything already dialed or typed,
  // so a quick finger never loses a digit.
  const flush = () => {
    const was = phase.current;
    halt();
    if ((was === "out" || was === "back") && active.current !== null) commit(active.current);
    for (const d of queue.current) commit(d);
    queue.current = [];
    phase.current = "idle";
    active.current = null;
  };

  const enqueue = (digit: number) => {
    if (room() <= 0) return;
    queue.current.push(digit);
    if (phase.current === "idle") settle();
  };

  const erase = () => {
    // A digit still waiting its turn is the newest, so it goes first.
    if (queue.current.length) {
      queue.current.pop();
      return;
    }
    if (!valueRef.current) return;
    const next = valueRef.current.slice(0, -1);
    valueRef.current = next;
    onChangeRef.current(next);
  };

  const local = (e: React.PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const scale = SIZE / box.width;
    return [(e.clientX - box.left) * scale, (e.clientY - box.top) * scale] as const;
  };

  const holeAt = (x: number, y: number, r: number) => {
    for (const d of DIGITS) {
      // Holes already wound past their own stop are out of reach.
      if (r > travel(d) + 0.5) continue;
      const [hx, hy] = polar(HOLE_RING, rest(d) + r);
      if (Math.hypot(x - hx, y - hy) <= HIT_R) return d;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || grab.current) return;
    const [x, y] = local(e);
    const digit = holeAt(x, y, rotation.get());
    if (digit === null) return;
    flush();
    e.currentTarget.setPointerCapture(e.pointerId);
    phase.current = "drag";
    active.current = digit;
    grab.current = {
      id: e.pointerId,
      digit,
      last: compass(x, y),
      raw: rotation.get(),
      moved: 0,
      atStop: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = grab.current;
    if (!g || e.pointerId !== g.id) return;
    const [x, y] = local(e);
    const angle = compass(x, y);
    // Unwrap across the +-180 seam so a pull through six o'clock is smooth.
    let delta = angle - g.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    g.last = angle;
    g.moved += Math.abs(delta);
    const t = travel(g.digit);
    g.raw = clamp(g.raw + delta, -SLACK, t + SLACK);
    const r = clamp(g.raw, 0, t);
    rotation.set(r);
    const atStop = r >= t;
    if (atStop && !g.atStop) bumpStop();
    g.atStop = atStop;
  };

  const release = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = grab.current;
    if (!g || e.pointerId !== g.id) return;
    grab.current = null;
    const fits = room() > 0;
    // A tap on a hole dials it for you.
    if (!cancelled && g.moved < 2 && fits) {
      windOut(g.digit);
      return;
    }
    const reached = rotation.get() >= travel(g.digit) - STOP_TOLERANCE;
    unwind(!cancelled && reached && fits ? g.digit : null);
  };

  const groupStarts = new Set<number>();
  groups.reduce((at, size) => {
    groupStarts.add(at);
    return at + size;
  }, 0);

  return (
    <div className={cn("flex w-[340px] max-w-full flex-col items-center gap-7", className)}>
      <div className="flex w-full flex-col gap-1.5">
        <span id={`${id}-label`} className="px-1 text-sm text-muted">
          {label}
        </span>
        <div className="flex h-14 items-center gap-2 rounded-2xl bg-surface pr-2 pl-4 shadow-raised">
          <output
            aria-labelledby={`${id}-label`}
            aria-live="polite"
            className="flex min-w-0 flex-1 items-baseline overflow-hidden font-mono text-2xl tabular-nums"
          >
            {value ? (
              value.split("").map((digit, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, filter: "blur(4px)", y: reduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className={cn("inline-block", i > 0 && groupStarts.has(i) && "ml-[0.45em]")}
                >
                  {digit}
                </motion.span>
              ))
            ) : (
              <span className="font-sans text-base text-muted">Dial a number</span>
            )}
          </output>
          <button
            type="button"
            aria-label="Delete last digit"
            disabled={!value}
            onClick={erase}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted outline-hidden transition-[scale,color,opacity] duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7Z" />
              <path d="m11.5 9.5 5 5M16.5 9.5l-5 5" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={dialRef}
        role="group"
        tabIndex={0}
        aria-label={`${label} dial`}
        aria-describedby={`${id}-hint`}
        aria-keyshortcuts="0 1 2 3 4 5 6 7 8 9 Backspace"
        className="relative aspect-square w-[280px] max-w-full cursor-grab touch-none rounded-full outline-hidden select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => release(e, false)}
        onPointerCancel={(e) => release(e, true)}
        onKeyDown={(e) => {
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (/^\d$/.test(e.key)) {
            e.preventDefault();
            if (!e.repeat && !grab.current) enqueue(Number(e.key));
          } else if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            erase();
          }
        }}
      >
        <span id={`${id}-hint`} className="sr-only">
          Type digits to dial them. Backspace deletes.
        </span>
        {/* The number plate stays put; its digits show through the holes. */}
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full" aria-hidden>
          <circle cx={C} cy={C} r={C - 1} strokeWidth={1} className="fill-surface stroke-border" />
          {DIGITS.map((d) => {
            const [x, y] = polar(HOLE_RING, rest(d));
            return (
              <text
                key={d}
                x={x}
                y={y}
                dy="0.35em"
                textAnchor="middle"
                className="fill-foreground text-lg font-medium tabular-nums"
              >
                {d}
              </text>
            );
          })}
        </svg>

        <motion.div className="absolute inset-0" style={{ rotate: rotation }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden>
            <path d={DISC_PATH} fillRule="evenodd" className="fill-foreground" />
            {/* A faint lip on every edge reads as moulded bakelite. */}
            <circle cx={C} cy={C} r={DISC_R - 1} fill="none" className="stroke-background/15" />
            {DIGITS.map((d) => {
              const [x, y] = polar(HOLE_RING, rest(d));
              return (
                <circle key={d} cx={x} cy={y} r={HOLE_R} fill="none" className="stroke-background/20" />
              );
            })}
          </svg>
        </motion.div>

        <div ref={stopRef} className="pointer-events-none absolute inset-0">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden>
            {/* A collar in the plate colour separates the hook from the disc. */}
            <line
              x1={HOOK_FROM[0]}
              y1={HOOK_FROM[1]}
              x2={HOOK_TO[0]}
              y2={HOOK_TO[1]}
              strokeWidth={11}
              strokeLinecap="round"
              className="stroke-surface"
            />
            <line
              x1={HOOK_FROM[0]}
              y1={HOOK_FROM[1]}
              x2={HOOK_TO[0]}
              y2={HOOK_TO[1]}
              strokeWidth={6}
              strokeLinecap="round"
              className="stroke-muted"
            />
          </svg>
        </div>

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden
        >
          <circle cx={C} cy={C} r={CARD_R} strokeWidth={1} className="fill-background stroke-border" />
          <text x={C} y={C - 3} textAnchor="middle" className="fill-muted text-xs">
            Pull a hole
          </text>
          <text x={C} y={C + 13} textAnchor="middle" className="fill-muted text-xs">
            to the stop
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function RotaryDialDemo() {
  const [value, setValue] = useState("");
  return <RotaryDial label="Phone number" value={value} onChange={setValue} autoFocus />;
}
