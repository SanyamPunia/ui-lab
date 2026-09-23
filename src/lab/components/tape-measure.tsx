"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

// Pixels per centimetre. Wide enough that a 1mm step is still a whole pixel
// under the finger, so fine adjustments are actually reachable.
const SCALE = 10;
const CASE_W = 120;
const BLADE_H = 26;
// The tab is only grabbable near its own edge; this is the reach past it.
const TAB_REACH = 28;
// Within this of a whole centimetre the blade drops into the detent; between
// detents it moves in 1mm steps.
const DETENT = 0.15;
// Keyboard moves and external changes slide the blade with no overshoot,
// so the reading never passes the value it is heading for.
const SLIDE = { type: "spring", stiffness: 500, damping: 45 } as const;
// The retract motor: fast, and just underdamped enough that a long blade
// slams the tab into the mouth. That overshoot becomes the case's jolt.
const RETRACT = { type: "spring", stiffness: 380, damping: 28 } as const;
// The largest jolt the case takes from the tab hitting it, in px.
const MAX_JOLT = 8;

function detent(raw: number) {
  const whole = Math.round(raw);
  if (Math.abs(raw - whole) < DETENT) return whole;
  return Math.round(raw * 10) / 10;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

const format = (cm: number) => Math.max(0, cm).toFixed(1);

export function TapeMeasure({
  value,
  onChange,
  label,
  max = 300,
  className,
}: {
  /** Length in centimetres, to one decimal. */
  value: number;
  onChange: (value: number) => void;
  label: string;
  max?: number;
  className?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const length = useMotionValue(value);
  const [locked, setLocked] = useState(true);
  // The readout and ARIA value are written straight from the motion value,
  // so React only ever renders the first one.
  const [initial] = useState(() => format(value));

  const sliderRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const anim = useRef<ReturnType<typeof animate> | null>(null);
  const drag = useRef<{ id: number; startX: number; start: number } | null>(null);
  // The last value handed to onChange, so a prop change can be told apart
  // from our own echo.
  const committed = useRef(value);

  const shown = useTransform(length, (l) => Math.max(l, 0));
  const stripX = useTransform(shown, (l) => (l - max) * SCALE);
  const tabX = useTransform(shown, (l) => l * SCALE);
  // Past zero, the tab is inside the mouth: the whole tape shoves left.
  const jolt = useTransform(length, (l) =>
    l < 0 ? -MAX_JOLT * Math.tanh((-l * SCALE) / 40) : 0,
  );

  // The reading ticks along with the blade without re-rendering per frame.
  useMotionValueEvent(length, "change", (l) => {
    const text = format(l);
    if (readoutRef.current) readoutRef.current.textContent = text;
    sliderRef.current?.setAttribute("aria-valuenow", text);
    sliderRef.current?.setAttribute("aria-valuetext", `${text} centimetres`);
  });

  const halt = () => {
    anim.current?.stop();
    anim.current = null;
  };

  const commit = (v: number) => {
    const next = Math.round(clamp(v, 0, max) * 10) / 10;
    committed.current = next;
    onChange(next);
  };

  const slideTo = (v: number) => {
    halt();
    if (reduceMotion) length.jump(v);
    else anim.current = animate(length, v, SLIDE);
  };

  useEffect(() => {
    if (Math.abs(value - committed.current) < 1e-6) return;
    committed.current = value;
    anim.current?.stop();
    if (reduceMotion) length.jump(value);
    else anim.current = animate(length, value, SLIDE);
  }, [value, reduceMotion, length]);

  useEffect(() => () => anim.current?.stop(), []);

  const retract = () => {
    halt();
    commit(0);
    if (reduceMotion) {
      length.jump(0);
      return;
    }
    anim.current = animate(length, 0, { ...RETRACT, velocity: length.getVelocity() });
  };

  const toggleLock = () => {
    if (locked && length.get() > 0) {
      setLocked(false);
      retract();
    } else {
      setLocked(!locked);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag.current) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX - box.left > shown.get() * SCALE + TAB_REACH) return;
    halt();
    e.currentTarget.setPointerCapture(e.pointerId);
    // A thumb on the lock is what keeps a real tape out; grabbing sets it.
    setLocked(true);
    drag.current = { id: e.pointerId, startX: e.clientX, start: shown.get() };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const raw = d.start + (e.clientX - d.startX) / SCALE;
    length.set(detent(clamp(raw, 0, max)));
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const velocity = length.getVelocity();
    // A flick keeps sliding on its own speed, then settles into a detent.
    if (!reduceMotion && Math.abs(velocity) > 15) {
      anim.current = animate(length, length.get(), {
        type: "inertia",
        velocity,
        power: 0.5,
        timeConstant: 220,
        min: 0,
        max,
        bounceStiffness: 600,
        bounceDamping: 40,
        modifyTarget: Math.round,
        onComplete: () => commit(length.get()),
      });
      return;
    }
    commit(length.get());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    const base = committed.current;
    let next: number;
    // Keys land on whole centimetres, the way a detent would catch them.
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.floor(base + 1e-6) + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.ceil(base - 1e-6) - step;
    else if (e.key === "PageUp") next = Math.floor(base + 1e-6) + 10;
    else if (e.key === "PageDown") next = Math.ceil(base - 1e-6) - 10;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = max;
    else return;
    e.preventDefault();
    next = clamp(next, 0, max);
    setLocked(true);
    commit(next);
    slideTo(next);
  };

  return (
    <div className={cn("flex w-[480px] max-w-full flex-col gap-5", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span id={`${id}-label`} className="text-sm text-muted">
            {label}
          </span>
          <span className="flex items-baseline gap-1.5">
            <span ref={readoutRef} className="text-4xl font-medium tracking-tight tabular-nums">
              {initial}
            </span>
            <span className="text-lg text-muted">cm</span>
          </span>
        </div>
        <span className="pb-1 text-sm text-muted">{locked ? "Locked" : "Free"}</span>
      </div>

      <div className="relative h-[120px] w-full">
        <motion.div className="absolute inset-0" style={{ x: jolt }}>
          <div
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-labelledby={`${id}-label`}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Number(initial)}
            aria-valuetext={`${initial} centimetres`}
            aria-describedby={`${id}-hint`}
            className="absolute top-[72px] right-0 h-12 cursor-grab touch-none overflow-hidden outline-hidden select-none [mask-image:linear-gradient(to_right,black_calc(100%_-_48px),transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:cursor-grabbing"
            style={{ left: CASE_W }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onKeyDown={onKeyDown}
          >
            <motion.div className="absolute top-2 left-0" style={{ x: stripX }}>
              <Blade max={max} />
            </motion.div>
            {/* The hook: a bent tab that stands proud of the blade. */}
            <motion.div
              className="absolute top-0.5 left-0 h-[42px] w-[7px] rounded-[3px] bg-foreground shadow-raised"
              style={{ x: tabX }}
            />
          </div>

          <div
            className="absolute top-0 left-0 h-[112px] rounded-[30px] rounded-br-[10px] bg-foreground shadow-raised"
            style={{ width: CASE_W }}
          >
            {/* Spring drum cover and its rivet. */}
            <div className="absolute top-9 left-3.5 flex size-[58px] items-center justify-center rounded-full bg-background/5 ring-1 ring-background/15">
              <div className="size-2.5 rounded-full bg-background/25" />
            </div>
            {/* The mouth the blade feeds out of. */}
            <div className="absolute top-[76px] right-0.5 h-[32px] w-px bg-background/25" />
            <button
              type="button"
              aria-label="Tape lock"
              aria-pressed={locked}
              onClick={toggleLock}
              className="absolute top-1.5 left-[70px] flex size-11 items-center justify-center rounded-full outline-hidden transition-[scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-background active:scale-[0.96]"
            >
              <span className="relative h-8 w-3.5 rounded-full bg-background/15">
                <span
                  className={cn(
                    "absolute top-0 left-0 size-3.5 rounded-full bg-background transition-[translate] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                    locked && "translate-y-[18px]",
                  )}
                />
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      <p id={`${id}-hint`} className="text-sm text-muted">
        Pull the tab to measure. Release the lock to reel it back in.
      </p>
    </div>
  );
}

// Thousands of ticks that never change, so they render once.
const Blade = memo(function Blade({ max }: { max: number }) {
  const width = max * SCALE + 1;
  const ticks: React.ReactNode[] = [];
  for (let half = 0; half <= max * 2; half++) {
    const cm = half / 2;
    // Numbers grow away from the hook, so the scale runs right to left.
    const x = (max - cm) * SCALE + 0.5;
    const h = cm % 10 === 0 ? 13 : cm % 5 === 0 ? 10 : Number.isInteger(cm) ? 7 : 4;
    ticks.push(<line key={half} x1={x} x2={x} y1={0} y2={h} />);
  }
  const labels: React.ReactNode[] = [];
  for (let cm = 10; cm <= max; cm += 10) {
    labels.push(
      <text
        key={cm}
        x={(max - cm) * SCALE}
        y={BLADE_H - 3}
        textAnchor="middle"
        // Metre marks in ink red, as on a real blade.
        className={cn("text-xs tabular-nums", cm % 100 === 0 ? "fill-danger" : "fill-foreground")}
      >
        {cm}
      </text>,
    );
  }
  return (
    <svg width={width} height={BLADE_H} viewBox={`0 0 ${width} ${BLADE_H}`} aria-hidden className="block">
      <rect width={width} height={BLADE_H} className="fill-surface" />
      {/* The blade is cupped; a hairline on each edge sells the curve. */}
      <line x1={0} x2={width} y1={0.5} y2={0.5} className="stroke-foreground/20" />
      <line x1={0} x2={width} y1={BLADE_H - 0.5} y2={BLADE_H - 0.5} className="stroke-foreground/10" />
      <g className="stroke-foreground">{ticks}</g>
      {labels}
    </svg>
  );
});

export default function TapeMeasureDemo() {
  const [value, setValue] = useState(28);
  return <TapeMeasure label="Shelf depth" value={value} onChange={setValue} />;
}
