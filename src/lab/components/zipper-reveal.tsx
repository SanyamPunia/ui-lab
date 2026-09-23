"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  motion,
  type AnimationPlaybackControls,
} from "motion/react";
import { cn } from "@/lib/cn";

// Everything is drawn in a 360 x 280 viewBox that scales with the card.
const W = 360;
const H = 280;
const CX = W / 2;
// The slider's travel. Closed it parks just under the top edge; fully open
// it stops where its 42 tall tab still clears the bottom edge.
const P_MIN = 26;
const P_MAX = H - 44;
// Teeth part at the top of the slider, 10 above its pivot.
const SLIDER_TOP = 10;
// Half the widest gap, and how far above the slider the gap takes to open
// fully. A longer run gives the soft V a real zipper makes.
const MAX_HALF = 110;
const OPEN_RUN = 130;
// The first 48 of travel only loosens the top, so a tiny pull doesn't
// flare the whole pouch open.
const RAMP = 48;
const TOOTH_PITCH = 7;
// The zip ends at the bottom stop, just under the fully open slider.
const ZIP_END = P_MAX + 8;
const TOOTH_COUNT = Math.floor((ZIP_END - 3) / TOOTH_PITCH);
const TAPE = 7;
const STEP = 0.1;
// Copying only makes sense once the button is fully in the gap.
const REVEAL_AT = 0.9;
const SETTLE = { type: "spring", stiffness: 500, damping: 50 } as const;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

// Half-width of the gap at height y with the slider at p, and its slope.
function gap(y: number, p: number) {
  const d = p - SLIDER_TOP - y;
  if (d <= 0) return { h: 0, slope: 0 };
  const r = clamp((p - P_MIN) / RAMP, 0, 1);
  const t = Math.min(d / OPEN_RUN, 1);
  return {
    h: MAX_HALF * r * (1 - (1 - t) ** 2),
    slope: t < 1 ? (MAX_HALF * r * 2 * (1 - t)) / OPEN_RUN : 0,
  };
}

function edge(p: number) {
  const points: [number, number][] = [];
  const end = p - SLIDER_TOP;
  for (let y = 0; y < end; y += 6) points.push([gap(y, p).h, y]);
  points.push([0, end]);
  return points;
}

function flapPath(p: number, side: 1 | -1) {
  const outer = side === -1 ? 0 : W;
  const pts = edge(p)
    .map(([h, y]) => `L${CX + side * h} ${y}`)
    .join("");
  return `M${outer} 0${pts}L${CX} ${H}L${outer} ${H}Z`;
}

function tapePath(p: number, side: 1 | -1) {
  const pts = edge(p);
  const inner = pts.map(([h, y]) => `${CX + side * h} ${y}`);
  const outer = pts.map(([h, y]) => `${CX + side * (h + TAPE)} ${y}`).reverse();
  return `M${inner.join("L")}L${CX} ${ZIP_END}L${CX + side * TAPE} ${ZIP_END}L${outer.join("L")}Z`;
}

// Each tooth stays square to its tape, so as the tape leans away from the
// seam the teeth tilt apart with it.
function toothTransform(i: number, side: 1 | -1, p: number) {
  const y = 3 + i * TOOTH_PITCH + (side === 1 ? TOOTH_PITCH / 2 : 0);
  const { h, slope } = gap(y, p);
  const angle = (Math.atan(slope) * 180) / Math.PI;
  return `translate(${CX + side * h} ${y}) rotate(${side * angle})`;
}

function openness(p: number) {
  return (p - P_MIN) / (P_MAX - P_MIN);
}

function describe(p: number) {
  const pct = Math.round(openness(p) * 100);
  return pct === 0 ? "Zipped" : pct === 100 ? "Open" : `Open ${pct}%`;
}

export function ZipperReveal({
  label = "Your code",
  secret = "LAB-7Q2X",
  note = "20% off your next order",
  className,
}: {
  label?: string;
  secret?: string;
  note?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const p = useMotionValue(P_MIN);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const glide = useRef<AnimationPlaybackControls>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const flapL = useRef<SVGPathElement>(null);
  const flapR = useRef<SVGPathElement>(null);
  const tapeL = useRef<SVGPathElement>(null);
  const tapeR = useRef<SVGPathElement>(null);
  const teeth = useRef<(SVGRectElement | null)[]>([]);
  const slider = useRef<SVGGElement>(null);
  const tab = useRef<SVGGElement>(null);
  const drag = useRef<{
    id: number;
    startY: number;
    startP: number;
    lastY: number;
    lastT: number;
    v: number;
  } | null>(null);

  // The tab points at your finger while you pull, then swings back to
  // hanging straight: a spring with a little bounce, like a pendulum.
  const lean = useMotionValue(0);
  const swing = useSpring(lean, { stiffness: 260, damping: 12 });
  useMotionValueEvent(swing, "change", (a) =>
    tab.current?.setAttribute("transform", `rotate(${a})`),
  );

  // The content comes into focus as the gap opens: sharp by 60%.
  const blur = useTransform(p, (v) => {
    const b = 4 * clamp(1 - openness(v) / 0.6, 0, 1);
    return b > 0.01 ? `blur(${b}px)` : "none";
  });

  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
      glide.current?.stop();
    },
    [],
  );

  useMotionValueEvent(p, "change", (v) => {
    flapL.current?.setAttribute("d", flapPath(v, -1));
    flapR.current?.setAttribute("d", flapPath(v, 1));
    tapeL.current?.setAttribute("d", tapePath(v, -1));
    tapeR.current?.setAttribute("d", tapePath(v, 1));
    for (let i = 0; i < TOOTH_COUNT; i++) {
      teeth.current[i * 2]?.setAttribute("transform", toothTransform(i, -1, v));
      teeth.current[i * 2 + 1]?.setAttribute(
        "transform",
        toothTransform(i, 1, v),
      );
    }
    slider.current?.setAttribute("transform", `translate(${CX} ${v})`);
    const text = describe(v);
    if (readoutRef.current) readoutRef.current.textContent = text;
    if (columnRef.current)
      columnRef.current.style.transform = `translateY(${(v / H) * 100}%)`;
    const handle = handleRef.current;
    if (handle) {
      handle.setAttribute(
        "aria-valuenow",
        String(Math.round(openness(v) * 100)),
      );
      handle.setAttribute("aria-valuetext", text);
    }
    const open = openness(v) >= REVEAL_AT;
    if (open !== revealed) setRevealed(open);
  });

  const moveTo = (target: number) => {
    glide.current?.stop();
    const to = clamp(target, P_MIN, P_MAX);
    if (reduceMotion) p.set(to);
    else glide.current = animate(p, to, SETTLE);
  };

  const scale = () => W / (boxRef.current?.offsetWidth || W);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(secret);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Nothing to undo: the code stays on screen to copy by hand.
    }
  };

  return (
    <div className={cn("w-[min(400px,100%)]", className)}>
      <div
        ref={boxRef}
        className="relative w-full overflow-hidden rounded-[24px] bg-background shadow-raised"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        {/* Underneath: the lining, recessed, with the secret on it. */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center pt-[8%] shadow-wheel"
          style={{ filter: blur }}
          inert={!revealed}
        >
          <span className="text-xs text-muted">{label}</span>
          <span className="mt-1 font-mono text-2xl font-semibold tracking-wider text-foreground">
            {secret}
          </span>
          <span className="mt-1 text-sm text-muted">{note}</span>
          <button
            type="button"
            onClick={copy}
            className="mt-3 h-9 touch-manipulation rounded-full bg-foreground px-4 text-sm font-medium text-background outline-hidden transition-[scale] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96]"
          >
            <span className="grid">
              <span
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,filter] duration-200 ease-out",
                  copied && "opacity-0 blur-[4px]",
                )}
              >
                Copy code
              </span>
              <span
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,filter] duration-200 ease-out",
                  !copied && "opacity-0 blur-[4px]",
                )}
              >
                Copied
              </span>
            </span>
          </button>
        </motion.div>

        <svg
          aria-hidden
          viewBox={`0 0 ${W} ${H}`}
          className="pointer-events-none absolute inset-0 size-full"
        >
          {/* The flaps, shading the lining where they lift off it. */}
          <g className="pointer-events-auto [filter:drop-shadow(0_1px_3px_oklch(0_0_0/0.22))]">
            <path
              ref={flapL}
              d={flapPath(P_MIN, -1)}
              className="fill-surface"
            />
            <path ref={flapR} d={flapPath(P_MIN, 1)} className="fill-surface" />
          </g>
          {/* Stitching around the three closed sides. */}
          <path
            d={`M12 30 V${H - 28} Q12 ${H - 12} 28 ${H - 12} H${W - 28} Q${W - 12} ${H - 12} ${W - 12} ${H - 28} V30`}
            fill="none"
            strokeDasharray="4 3"
            className="stroke-foreground/15"
          />
          <path
            ref={tapeL}
            d={tapePath(P_MIN, -1)}
            className="fill-foreground/[0.08]"
          />
          <path
            ref={tapeR}
            d={tapePath(P_MIN, 1)}
            className="fill-foreground/[0.08]"
          />
          {Array.from({ length: TOOTH_COUNT }, (_, i) =>
            ([-1, 1] as const).map((side) => (
              <rect
                key={`${i}${side}`}
                ref={(el) => {
                  teeth.current[i * 2 + (side === 1 ? 1 : 0)] = el;
                }}
                // Each tooth reaches 1.5 past the seam, into the gap
                // between two teeth on the other side: that overlap is
                // what locks a zip.
                x={side === -1 ? -6.5 : -1.5}
                y={-2}
                width={8}
                height={4}
                rx={1.2}
                transform={toothTransform(i, side, P_MIN)}
                className="fill-foreground/55"
              />
            )),
          )}
          {/* The zip ends here. */}
          <rect
            x={CX - 4}
            y={P_MAX + 2}
            width={8}
            height={6}
            rx={1.5}
            className="fill-foreground/55"
          />

          <g ref={slider} transform={`translate(${CX} ${P_MIN})`}>
            <g ref={tab}>
              <rect
                x={-7}
                y={2}
                width={14}
                height={40}
                rx={7}
                className="fill-foreground"
              />
              <rect
                x={-3}
                y={26}
                width={6}
                height={10}
                rx={3}
                className="fill-surface"
              />
            </g>
            <path
              d={`M-11 ${-SLIDER_TOP} H11 L8 8 Q0 11 -8 8 Z`}
              strokeLinejoin="round"
              className="fill-foreground"
            />
            <circle r={2.5} cy={0} className="fill-surface/40" />
          </g>
        </svg>

        {/* A full-height column, so translating it by a percentage of its
            own height moves the handle in the card's units without
            measuring anything. */}
        <div
          ref={columnRef}
          className="pointer-events-none absolute inset-0 z-10"
          style={{ transform: `translateY(${(P_MIN / H) * 100}%)` }}
        >
          {/* The hit target and keyboard handle, over the slider and tab. */}
          <div
            ref={handleRef}
            role="slider"
            tabIndex={0}
            aria-label="Zipper"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            aria-valuetext="Zipped"
            className="pointer-events-auto absolute left-1/2 w-12 -translate-x-1/2 cursor-grab touch-none rounded-full outline-hidden focus-visible:outline-2 focus-visible:outline-foreground active:cursor-grabbing"
            // From the slider's top edge to just past the tab's end.
            style={{ top: `${(-12 / H) * 100}%`, height: `${(58 / H) * 100}%` }}
            onPointerDown={(e) => {
              if (e.button !== 0 || drag.current) return;
              glide.current?.stop();
              drag.current = {
                id: e.pointerId,
                startY: e.clientY,
                startP: p.get(),
                lastY: e.clientY,
                lastT: e.timeStamp,
                v: 0,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || d.id !== e.pointerId) return;
              const k = scale();
              const dt = Math.max(e.timeStamp - d.lastT, 1) / 1000;
              // Smoothed, so one uneven sample can't decide the glide.
              d.v = d.v * 0.5 + (((e.clientY - d.lastY) * k) / dt) * 0.5;
              d.lastY = e.clientY;
              d.lastT = e.timeStamp;
              // The zip's end stops are hard, like the metal ones.
              p.set(clamp(d.startP + (e.clientY - d.startY) * k, P_MIN, P_MAX));
              if (reduceMotion) return;
              const box = boxRef.current!.getBoundingClientRect();
              const px = (e.clientX - box.left) * k - CX;
              const py = (e.clientY - box.top) * k - p.get();
              lean.set(
                clamp(
                  (-Math.atan2(px, Math.max(py, 20)) * 180) / Math.PI,
                  -35,
                  35,
                ),
              );
            }}
            onPointerUp={(e) => {
              const d = drag.current;
              if (!d || d.id !== e.pointerId) return;
              drag.current = null;
              lean.set(0);
              if (reduceMotion) return;
              // A zip has friction: a flick carries it on only a little,
              // and near either end it runs home.
              let target = clamp(p.get() + d.v * 0.06, P_MIN, P_MAX);
              if (target < P_MIN + 12) target = P_MIN;
              if (target > P_MAX - 12) target = P_MAX;
              glide.current = animate(p, target, { ...SETTLE, velocity: d.v });
            }}
            onPointerCancel={(e) => {
              if (drag.current?.id !== e.pointerId) return;
              drag.current = null;
              lean.set(0);
            }}
            onKeyDown={(e) => {
              const range = P_MAX - P_MIN;
              const current = p.get();
              const target = {
                ArrowDown: current + range * STEP,
                ArrowRight: current + range * STEP,
                ArrowUp: current - range * STEP,
                ArrowLeft: current - range * STEP,
                PageDown: current + range * STEP * 2.5,
                PageUp: current - range * STEP * 2.5,
                Home: P_MIN,
                End: P_MAX,
              }[e.key];
              if (target === undefined) return;
              e.preventDefault();
              moveTo(target);
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1 text-sm">
        <span
          ref={readoutRef}
          aria-hidden
          className="font-medium text-foreground tabular-nums"
        >
          Zipped
        </span>
        <span className="text-muted">Drag the pull down</span>
      </div>
    </div>
  );
}

export default function ZipperRevealDemo() {
  return <ZipperReveal />;
}
