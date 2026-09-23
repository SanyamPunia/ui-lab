"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

// Drawing space for the cassette; the SVG scales with its container.
const VB_W = 440;
const VB_H = 280;
const LEFT = { x: 150, y: 140 };
const RIGHT = { x: 290, y: 140 };
// Hub radius, and the radius of a full pack. 58 keeps a full pack inside
// the 120 unit tall window.
const HUB = 22;
const FULL = 58;
// Tape guide posts at the bottom corners, where the tape leaves the packs.
const POST_L = { x: 96, y: 226 };
const POST_R = { x: 344, y: 226 };
const WINDOW = { x: 78, y: 80, w: 284, h: 120, r: 20 };
// Linear tape speed while playing: an empty hub turns half a turn a second,
// close to a real deck, so a full pack visibly crawls and an empty hub races.
const TAPE_SPEED = HUB * Math.PI;
// Dragging across the whole window moves this many seconds of tape. True
// tape speed would be about 3s per drag, too slow to be a useful scrubber.
const SCRUB_SPAN = 40;
// Time constants in seconds: the motor spins up quickly, a flick coasts a
// little longer before friction settles it back to play speed or rest.
const SPIN_UP = 0.12;
const COAST = 0.35;
// Critically damped seek spring (c = 2 * sqrt(k)), so arrow keys glide to
// the new spot in about half a second without overshooting.
const SEEK_K = 140;
const SEEK_C = 2 * Math.sqrt(SEEK_K);
const STEP = 5;
// A pointer that stood still this long before release has no momentum left.
const STILL_MS = 80;
const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;

type Mode = "free" | "drag" | "seek";
type Point = { x: number; y: number };

const clamp = (v: number, lo = 0, hi = 1) => Math.min(Math.max(v, lo), hi);

// Tape packs keep a constant total area, so radius goes with sqrt of length.
const packRadius = (share: number) =>
  Math.sqrt(HUB * HUB + share * (FULL * FULL - HUB * HUB));

// Where a line from an outside point touches a circle.
function tangent(c: Point, r: number, p: Point, side: 1 | -1) {
  const d = Math.hypot(p.x - c.x, p.y - c.y);
  const t =
    Math.atan2(p.y - c.y, p.x - c.x) + side * Math.acos(Math.min(r / d, 1));
  return `${(c.x + r * Math.cos(t)).toFixed(2)} ${(c.y + r * Math.sin(t)).toFixed(2)}`;
}

function tapePath(rl: number, rr: number) {
  return `M${tangent(LEFT, rl, POST_L, 1)}L${POST_L.x} ${POST_L.y}M${POST_R.x} ${POST_R.y}L${tangent(RIGHT, rr, POST_R, -1)}`;
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

const WINDOW_PATH = roundedRect(
  WINDOW.x,
  WINDOW.y,
  WINDOW.w,
  WINDOW.h,
  WINDOW.r,
);

const clock = (s: number) => {
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

type Parts = {
  packL?: SVGCircleElement | null;
  packR?: SVGCircleElement | null;
  edgeL?: SVGCircleElement | null;
  edgeR?: SVGCircleElement | null;
  reelL?: SVGGElement | null;
  reelR?: SVGGElement | null;
  blurL?: SVGCircleElement | null;
  blurR?: SVGCircleElement | null;
  tape?: SVGPathElement | null;
};

export function CassetteScrubber({
  duration,
  title,
  side = "A",
  initialTime = 0,
  onTimeChange,
  className,
}: {
  /** Length of the track in seconds. */
  duration: number;
  title: string;
  side?: string;
  initialTime?: number;
  /** Called whenever the whole second changes. */
  onTimeChange?: (seconds: number) => void;
  className?: string;
}) {
  const reduceMotion = !!useReducedMotion();
  const clipId = useId();
  const [playing, setPlaying] = useState(false);

  const parts = useRef<Parts>({});
  const readout = useRef<HTMLSpanElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const start = clamp(initialTime / duration);
  const sim = useRef({
    pos: start,
    lastPos: start,
    vel: 0,
    mode: "free" as Mode,
    target: 0,
    angleL: 0,
    angleR: 0,
    blur: 0,
    second: -1,
  });
  const playingRef = useRef(false);
  const reduceRef = useRef(reduceMotion);
  const onTimeRef = useRef(onTimeChange);
  const drag = useRef<{ id: number; x: number; t: number } | null>(null);
  const frame = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    reduceRef.current = reduceMotion;
    onTimeRef.current = onTimeChange;
  });

  // Every frame writes straight to the DOM; React only re-renders when the
  // play state flips.
  const paint = useCallback(() => {
    const s = sim.current;
    const p = parts.current;
    const rl = packRadius(1 - s.pos);
    const rr = packRadius(s.pos);
    p.packL?.setAttribute("r", rl.toFixed(2));
    p.packR?.setAttribute("r", rr.toFixed(2));
    p.edgeL?.setAttribute("r", Math.max(rl - 3, HUB).toFixed(2));
    p.edgeR?.setAttribute("r", Math.max(rr - 3, HUB).toFixed(2));
    p.tape?.setAttribute("d", tapePath(rl, rr));
    p.reelL?.setAttribute(
      "transform",
      `rotate(${s.angleL.toFixed(2)} ${LEFT.x} ${LEFT.y})`,
    );
    p.reelR?.setAttribute(
      "transform",
      `rotate(${s.angleR.toFixed(2)} ${RIGHT.x} ${RIGHT.y})`,
    );
    // Spun fast, the hub cutouts would strobe backwards, so they fade into
    // a smeared ring instead, like motion blur on a real spool.
    const solid = (1 - s.blur * 0.8).toFixed(3);
    const smear = (s.blur * 0.5).toFixed(3);
    p.reelL?.setAttribute("opacity", solid);
    p.reelR?.setAttribute("opacity", solid);
    p.blurL?.setAttribute("opacity", smear);
    p.blurR?.setAttribute("opacity", smear);

    const second = Math.floor(s.pos * duration + 1e-6);
    if (second !== s.second) {
      s.second = second;
      if (readout.current) readout.current.textContent = clock(second);
      slider.current?.setAttribute("aria-valuenow", String(second));
      slider.current?.setAttribute(
        "aria-valuetext",
        `${clock(second)} of ${clock(duration)}`,
      );
      onTimeRef.current?.(second);
    }
  }, [duration]);

  const step = useCallback(
    function tick(now: number) {
      const s = sim.current;
      // Clamp long gaps (a background tab) so nothing leaps on return.
      const dt = Math.min((now - last.current) / 1000, 1 / 20);
      last.current = now;
      const drive = playingRef.current ? 1 / duration : 0;

      if (s.mode === "seek") {
        s.target = clamp(s.target + drive * dt);
        const a = SEEK_K * (s.target - s.pos) - SEEK_C * (s.vel - drive);
        s.vel += a * dt;
        s.pos += s.vel * dt;
        if (
          Math.abs(s.target - s.pos) < 0.2 / duration &&
          Math.abs(s.vel - drive) < 0.5 / duration
        ) {
          s.pos = s.target;
          s.vel = drive;
          s.mode = "free";
        }
      } else if (s.mode === "free") {
        const tau = Math.abs(s.vel) > Math.abs(drive) ? COAST : SPIN_UP;
        s.vel = drive + (s.vel - drive) * Math.exp(-dt / tau);
        s.pos += s.vel * dt;
      }

      if (s.pos >= 1 || s.pos <= 0) {
        s.pos = clamp(s.pos);
        if (s.mode === "free") s.vel = 0;
        if (s.pos >= 1 && playingRef.current && s.mode === "free") {
          playingRef.current = false;
          setPlaying(false);
        }
      }

      // Reels turn by the length of tape that moved over their own radius,
      // so tape speed is constant and the smaller pack always spins faster.
      const moved = (s.pos - s.lastPos) * duration * TAPE_SPEED;
      s.lastPos = s.pos;
      if (!reduceRef.current) {
        const dl = (-moved / packRadius(1 - s.pos)) * (180 / Math.PI);
        const dr = (-moved / packRadius(s.pos)) * (180 / Math.PI);
        s.angleL = (s.angleL + dl) % 360;
        s.angleR = (s.angleR + dr) % 360;
        const spin = dt > 0 ? Math.max(Math.abs(dl), Math.abs(dr)) / dt : 0;
        // Six cutouts start to alias around 1080 deg/s at 60fps.
        const goal = clamp((spin - 1080) / 1080);
        s.blur += (goal - s.blur) * Math.min(dt * 12, 1);
      }
      paint();

      if (
        s.mode === "free" &&
        !playingRef.current &&
        // Slower than 1/50th of play speed is invisible; let it sleep.
        Math.abs(s.vel) * duration < 0.02 &&
        s.blur < 0.01
      ) {
        s.vel = 0;
        s.blur = 0;
        paint();
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    },
    [duration, paint],
  );

  const wake = useCallback(() => {
    if (frame.current) return;
    last.current = performance.now();
    frame.current = requestAnimationFrame(step);
  }, [step]);

  useEffect(() => {
    paint();
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [paint]);

  const togglePlay = () => {
    const s = sim.current;
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    // Playing from the very end rewinds first, and the reels show it.
    if (next && s.pos >= 1) {
      if (reduceRef.current) {
        s.pos = 0;
        s.lastPos = 0;
      } else {
        s.mode = "seek";
        s.target = 0;
      }
    }
    wake();
  };

  const seekTo = (to: number) => {
    const s = sim.current;
    if (reduceRef.current) {
      s.pos = to;
      s.lastPos = to;
      s.mode = "free";
      paint();
      wake();
      return;
    }
    s.mode = "seek";
    s.target = to;
    wake();
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const s = sim.current;
    if (reduceRef.current || e.timeStamp - d.t > STILL_MS) s.vel = 0;
    s.mode = "free";
    wake();
  };

  return (
    <div
      className={cn(
        "flex w-[min(440px,100%)] flex-col gap-4 select-none",
        className,
      )}
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="block h-auto w-full"
          aria-hidden
        >
          <defs>
            <clipPath id={clipId}>
              <path d={WINDOW_PATH} />
            </clipPath>
          </defs>
          <rect
            x={8}
            y={8}
            width={424}
            height={264}
            rx={18}
            className="fill-surface stroke-foreground/15"
          />
          <path d={WINDOW_PATH} className="fill-foreground/[0.04]" />
          <g clipPath={`url(#${clipId})`}>
            {[LEFT, RIGHT].map((c, i) => (
              <g key={i}>
                <circle
                  ref={(el) => {
                    parts.current[i ? "packR" : "packL"] = el;
                  }}
                  cx={c.x}
                  cy={c.y}
                  r={packRadius(i ? start : 1 - start)}
                  className="fill-foreground/80"
                />
                {/* The outermost wraps catch a little light. */}
                <circle
                  ref={(el) => {
                    parts.current[i ? "edgeR" : "edgeL"] = el;
                  }}
                  cx={c.x}
                  cy={c.y}
                  r={Math.max(packRadius(i ? start : 1 - start) - 3, HUB)}
                  fill="none"
                  className="stroke-background/20"
                />
              </g>
            ))}
          </g>
          <path
            ref={(el) => {
              parts.current.tape = el;
            }}
            d={tapePath(packRadius(1 - start), packRadius(start))}
            fill="none"
            className="stroke-foreground/70"
            strokeWidth={1.5}
          />
          {[LEFT, RIGHT].map((c, i) => (
            <g key={i}>
              <g
                ref={(el) => {
                  parts.current[i ? "reelR" : "reelL"] = el;
                }}
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={HUB - 1}
                  className="fill-surface stroke-foreground/25"
                />
                {[0, 120, 240].map((a) => (
                  <circle
                    key={a}
                    // Rounded so server and browser trig agree on hydration.
                    cx={Math.round(c.x + 14 * Math.cos((a * Math.PI) / 180))}
                    cy={Math.round(c.y + 14 * Math.sin((a * Math.PI) / 180))}
                    r={3.5}
                    className="fill-foreground/15"
                  />
                ))}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={8}
                  className="fill-background stroke-foreground/30"
                />
                {[0, 60, 120, 180, 240, 300].map((a) => (
                  <rect
                    key={a}
                    x={c.x - 1.25}
                    y={c.y - 8}
                    width={2.5}
                    height={3.5}
                    rx={0.5}
                    transform={`rotate(${a} ${c.x} ${c.y})`}
                    className="fill-foreground/40"
                  />
                ))}
              </g>
              <circle
                ref={(el) => {
                  parts.current[i ? "blurR" : "blurL"] = el;
                }}
                cx={c.x}
                cy={c.y}
                r={14}
                fill="none"
                opacity={0}
                className="stroke-foreground/40"
                strokeWidth={7}
              />
            </g>
          ))}
          {/* The label, with the window cut out of it. */}
          <path
            d={`${roundedRect(30, 22, 380, 192, 10)}${WINDOW_PATH}`}
            fillRule="evenodd"
            className="fill-background stroke-foreground/10"
          />
          <text
            x={48}
            y={57}
            className="fill-foreground font-sans"
            fontSize={22}
            fontWeight={600}
          >
            {side}
          </text>
          <text
            x={76}
            y={56}
            className="fill-foreground font-sans"
            fontSize={15}
            fontWeight={500}
          >
            {title}
          </text>
          <text
            x={392}
            y={56}
            textAnchor="end"
            className="fill-muted font-mono"
            fontSize={12}
          >
            {clock(duration)}
          </text>
          <line
            x1={48}
            x2={392}
            y1={68}
            y2={68}
            className="stroke-foreground/10"
          />
          {/* Head opening, with the tape running across it. */}
          <path
            d="M112 272 L132 222 H308 L328 272"
            className="fill-background stroke-foreground/10"
          />
          <line
            x1={POST_L.x}
            x2={POST_R.x}
            y1={POST_L.y}
            y2={POST_R.y}
            className="stroke-foreground/70"
            strokeWidth={1.5}
          />
          {[POST_L, POST_R].map((p) => (
            <circle
              key={p.x}
              cx={p.x}
              cy={p.y + 4}
              r={4}
              className="fill-surface stroke-foreground/30"
            />
          ))}
          {[168, 272].map((x) => (
            <circle
              key={x}
              cx={x}
              cy={252}
              r={6}
              className="fill-surface stroke-foreground/15"
            />
          ))}
          {[
            [20, 20],
            [420, 20],
            [20, 260],
            [420, 260],
            [220, 250],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle
                cx={x}
                cy={y}
                r={4}
                className="fill-background stroke-foreground/20"
              />
              <path
                d={`M${x - 2} ${y}h4M${x} ${y - 2}v4`}
                className="stroke-foreground/30"
              />
            </g>
          ))}
        </svg>
        <div
          ref={slider}
          role="slider"
          tabIndex={0}
          aria-label={`Playback position, ${title}`}
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          // Seeded once for the server render; the frame loop owns it after.
          aria-valuenow={Math.floor(start * duration)}
          aria-valuetext={`${clock(start * duration)} of ${clock(duration)}`}
          className="absolute cursor-grab touch-none rounded-[7%/16%] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:cursor-grabbing"
          style={{
            left: `${(WINDOW.x / VB_W) * 100}%`,
            top: `${(WINDOW.y / VB_H) * 100}%`,
            width: `${(WINDOW.w / VB_W) * 100}%`,
            height: `${(WINDOW.h / VB_H) * 100}%`,
          }}
          onPointerDown={(e) => {
            if (e.button !== 0 || drag.current) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { id: e.pointerId, x: e.clientX, t: e.timeStamp };
            const s = sim.current;
            s.mode = "drag";
            s.vel = 0;
            wake();
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            const s = sim.current;
            const width = e.currentTarget.getBoundingClientRect().width || 1;
            const next = clamp(
              s.pos + ((e.clientX - d.x) / width) * (SCRUB_SPAN / duration),
            );
            const dt = (e.timeStamp - d.t) / 1000;
            // Smoothed, so one jittery event doesn't decide the flick.
            if (dt > 0) s.vel = s.vel * 0.5 + ((next - s.pos) / dt) * 0.5;
            s.pos = next;
            d.x = e.clientX;
            d.t = e.timeStamp;
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "k") {
              e.preventDefault();
              togglePlay();
              return;
            }
            const s = sim.current;
            const from = s.mode === "seek" ? s.target : s.pos;
            const by = (seconds: number) => clamp(from + seconds / duration);
            const to = {
              ArrowRight: by(STEP),
              ArrowUp: by(STEP),
              ArrowLeft: by(-STEP),
              ArrowDown: by(-STEP),
              PageUp: by(STEP * 6),
              PageDown: by(-STEP * 6),
              Home: 0,
              End: 1,
            }[e.key];
            if (to === undefined) return;
            e.preventDefault();
            seekTo(to);
          }}
        />
      </div>
      <div className="flex items-center gap-3 px-1">
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background outline-hidden transition-[scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-none"
        >
          <SwapIcon visible={!playing}>
            {/* Drawn 1 unit right of center: a triangle's visual weight
                sits left of its bounding box. */}
            <path d="M9 6.5v11a.75.75 0 0 0 1.14.64l8.6-5.5a.75.75 0 0 0 0-1.28l-8.6-5.5A.75.75 0 0 0 9 6.5Z" />
          </SwapIcon>
          <SwapIcon visible={playing}>
            <rect x={7} y={6} width={3.5} height={12} rx={1} />
            <rect x={13.5} y={6} width={3.5} height={12} rx={1} />
          </SwapIcon>
        </button>
        <p className="font-mono text-[15px] text-foreground tabular-nums">
          <span ref={readout}>{clock(start * duration)}</span>
          <span className="text-muted"> / {clock(duration)}</span>
        </p>
        <p className="ml-auto text-right text-[13px] text-muted">
          Drag the reels to scrub
        </p>
      </div>
    </div>
  );
}

function SwapIcon({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="absolute size-5"
      fill="currentColor"
      aria-hidden
      initial={false}
      animate={
        visible
          ? { scale: 1, opacity: 1, filter: "blur(0px)" }
          : { scale: 0.25, opacity: 0, filter: "blur(4px)" }
      }
      transition={ICON_SWAP}
    >
      {children}
    </motion.svg>
  );
}

export default function CassetteScrubberDemo() {
  return (
    <CassetteScrubber title="Night Drive" duration={214} initialTime={48} />
  );
}
