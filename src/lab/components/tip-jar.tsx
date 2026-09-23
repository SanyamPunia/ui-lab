"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useAnimate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/cn";

type Coin = { id: number; value: number; leaving?: boolean };
type Body = {
  id: number;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
};

// The jar, in px. Coins fall in through the mouth at MOUTH_Y and rest on
// the glass floor.
const JAR_W = 176;
const STAGE_H = 260;
const MOUTH_Y = 60;
const GLASS = 8;
const FLOOR = STAGE_H - 12;
const LEFT = GLASS;
const RIGHT = JAR_W - GLASS;

// Tuned by feel: heavy enough that a coin drops like metal, a bounce that
// dies after two or three hops, and slow impacts that don't bounce at all
// so a pile can actually come to rest.
const GRAVITY = 2400;
const RESTITUTION = 0.32;
const REST_SPEED = 40;
const FLOOR_FRICTION = 0.86;
const SUBSTEPS = 4;
const ITERATIONS = 4;
// Asleep once nothing has moved more than 0.2px a frame for 24 frames.
// Position, not speed: in a pile the solver leaves small speeds that the
// contacts cancel every frame, so speed alone would never settle.
const SLEEP_MOVE = 0.2;
const SLEEP_FRAMES = 24;
const MAX_THROW = 1400;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const HOME = { type: "spring", stiffness: 500, damping: 34 } as const;

// Bigger coins are worth more, like real money.
function radius(value: number) {
  return value >= 5 ? 17 : value >= 2 ? 15 : 13;
}

function step(bodies: Body[], dt: number) {
  const h = dt / SUBSTEPS;
  for (let s = 0; s < SUBSTEPS; s++) {
    for (const b of bodies) {
      b.vy += GRAVITY * h;
      b.x += b.vx * h;
      b.y += b.vy * h;
      // Rolling without slipping: distance over radius.
      b.angle += (b.vx * h) / b.r;
    }
    for (let it = 0; it < ITERATIONS; it++) {
      for (const b of bodies) {
        if (b.x < LEFT + b.r) {
          b.x = LEFT + b.r;
          if (b.vx < 0) b.vx = -b.vx * RESTITUTION;
        } else if (b.x > RIGHT - b.r) {
          b.x = RIGHT - b.r;
          if (b.vx > 0) b.vx = -b.vx * RESTITUTION;
        }
        if (b.y > FLOOR - b.r) {
          b.y = FLOOR - b.r;
          if (b.vy > 0) b.vy = b.vy < REST_SPEED ? 0 : -b.vy * RESTITUTION;
          b.vx *= FLOOR_FRICTION;
        }
      }
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          // Mass goes with area, so a big coin shoves a small one aside.
          const ma = a.r * a.r;
          const mb = b.r * b.r;
          const push = (min - d) / (ma + mb);
          a.x -= nx * push * mb;
          a.y -= ny * push * mb;
          b.x += nx * push * ma;
          b.y += ny * push * ma;
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn >= 0) continue;
          const e = -vn < REST_SPEED ? 0 : RESTITUTION;
          const impulse = (-(1 + e) * vn) / (1 / ma + 1 / mb);
          a.vx -= (impulse / ma) * nx;
          a.vy -= (impulse / ma) * ny;
          b.vx += (impulse / mb) * nx;
          b.vy += (impulse / mb) * ny;
          // Metal on metal grips a little, which is what lets coins stack
          // instead of sliding off each other forever.
          const tx = -ny;
          const ty = nx;
          const vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
          const grip = vt * 0.15;
          a.vx += (grip * tx * mb) / (ma + mb);
          a.vy += (grip * ty * mb) / (ma + mb);
          b.vx -= (grip * tx * ma) / (ma + mb);
          b.vy -= (grip * ty * ma) / (ma + mb);
        }
      }
    }
  }
}

// A random offset in [-spread / 2, spread / 2].
function jitter(spread: number) {
  return (Math.random() - 0.5) * spread;
}

function place(el: HTMLElement, b: Body) {
  el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${b.angle}rad)`;
}

export function TipJar({
  denominations = [1, 2, 5],
  currency = "$",
  capacity = 24,
  onChange,
  className,
}: {
  denominations?: number[];
  currency?: string;
  capacity?: number;
  onChange?: (total: number) => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [ghost, setGhost] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const bodies = useRef<Body[]>([]);
  const els = useRef(new Map<number, HTMLElement>());
  const nextId = useRef(0);
  const frame = useRef(0);
  const [jarScope, animateJar] = useAnimate<HTMLDivElement>();

  const format = (v: number) => `${currency}${v.toFixed(2)}`;
  const total = coins.reduce((sum, c) => (c.leaving ? sum : sum + c.value), 0);
  const count = coins.filter((c) => !c.leaving).length;
  const full = count >= capacity;

  // Counts up to the new total rather than jumping, so each coin reads as
  // being added to what was there.
  const shown = useMotionValue(0);
  useMotionValueEvent(shown, "change", (v) => {
    if (readoutRef.current) readoutRef.current.textContent = format(v);
  });
  useEffect(() => {
    if (reduceMotion) {
      shown.jump(total);
      if (readoutRef.current) readoutRef.current.textContent = format(total);
      return;
    }
    const controls = animate(shown, total, { duration: 0.5, ease: EASE_OUT });
    return () => controls.stop();
    // format only depends on currency, which the readout text covers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, reduceMotion, shown]);

  useEffect(() => {
    const ref = frame;
    return () => cancelAnimationFrame(ref.current);
  }, []);

  const render = () => {
    for (const b of bodies.current) {
      const el = els.current.get(b.id);
      if (el) place(el, b);
    }
  };

  // Runs only while something moves, then sleeps until the next coin.
  const wake = () => {
    if (frame.current) return;
    if (reduceMotion) {
      // Jump to where everything would come to rest.
      for (let i = 0; i < 600; i++) step(bodies.current, 1 / 60);
      for (const b of bodies.current) b.vx = b.vy = 0;
      render();
      return;
    }
    let last = 0;
    let still = 0;
    const tick = (now: number) => {
      // The first frame only records the time.
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 0;
      last = now;
      const list = bodies.current;
      const before = list.map((b) => [b.x, b.y]);
      step(list, dt);
      render();
      const moving = list.some(
        (b, i) =>
          Math.hypot(b.x - before[i][0], b.y - before[i][1]) > SLEEP_MOVE,
      );
      still = moving || !dt ? 0 : still + 1;
      if (still > SLEEP_FRAMES) {
        for (const b of list) b.vx = b.vy = 0;
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const add = (
    value: number,
    at?: { x: number; y: number; vx: number; vy: number },
  ) => {
    if (full) return;
    const r = radius(value);
    const id = nextId.current++;
    bodies.current.push({
      id,
      r,
      // Dropped by button: a little off center, so coins don't stack in a
      // perfect column.
      x: Math.min(
        Math.max(at?.x ?? JAR_W / 2 + jitter(48), LEFT + r),
        RIGHT - r,
      ),
      y: Math.min(at?.y ?? r + 4, FLOOR - r),
      vx: at?.vx ?? 0,
      vy: at?.vy ?? 0,
      angle: jitter(Math.PI * 2),
    });
    setCoins((c) => [...c, { id, value }]);
    onChange?.(total + value);
    wake();
  };

  const removeLast = () => {
    const last = coins.findLast((c) => !c.leaving);
    if (!last) return;
    onChange?.(total - last.value);
    const body = bodies.current.find((b) => b.id === last.id);
    bodies.current = bodies.current.filter((b) => b.id !== last.id);
    const el = els.current.get(last.id);
    if (reduceMotion || !body || !el) {
      setCoins((c) => c.filter((x) => x.id !== last.id));
      wake();
      return;
    }
    setCoins((c) =>
      c.map((x) => (x.id === last.id ? { ...x, leaving: true } : x)),
    );
    // The jar tips and wobbles back; everything inside gets jostled.
    animateJar(
      jarScope.current,
      { rotate: [0, -6, 4, -2, 0] },
      { duration: 0.45, ease: "easeInOut" },
    );
    for (const b of bodies.current) {
      b.vx += jitter(160);
      b.vy -= 140 + jitter(120);
    }
    wake();
    // The last coin hops out through the mouth and fades as it clears.
    const side = body.x < JAR_W / 2 ? -1 : 1;
    const from = `translate(${body.x - body.r}px, ${body.y - body.r}px) rotate(${body.angle}rad)`;
    const to = `translate(${body.x - body.r + side * 28}px, ${MOUTH_Y - 80}px) rotate(${body.angle + side * 2}rad)`;
    const exit = el.animate(
      [
        { transform: from, opacity: 1 },
        { transform: to, opacity: 0 },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
        fill: "forwards",
      },
    );
    exit.onfinish = () => setCoins((c) => c.filter((x) => x.id !== last.id));
  };

  // Dragging a coin from the tray.
  const drag = useRef<{
    pointer: number;
    value: number;
    home: { x: number; y: number };
    offset: { x: number; y: number };
    start: { x: number; y: number };
    last: { x: number; y: number; t: number };
    v: { x: number; y: number };
    active: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);

  const toRoot = (clientX: number, clientY: number) => {
    const box = rootRef.current!.getBoundingClientRect();
    return { x: clientX - box.left, y: clientY - box.top };
  };

  const release = (cancelled = false) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    suppressClick.current = true;
    const stage = stageRef.current!.getBoundingClientRect();
    const root = rootRef.current!.getBoundingClientRect();
    const cx = gx.get() + root.left - stage.left;
    const cy = gy.get() + root.top - stage.top;
    const r = radius(d.value);
    const overJar = cx > -r && cx < JAR_W + r && cy < FLOOR && cy > -r * 2;
    if (overJar && !full && !cancelled) {
      const clamp = (v: number) => Math.min(Math.max(v, -MAX_THROW), MAX_THROW);
      setGhost(null);
      add(d.value, { x: cx, y: cy, vx: clamp(d.v.x), vy: clamp(d.v.y) });
      return;
    }
    // Missed the jar: it springs home, carrying the throw's speed.
    Promise.all([
      animate(gx, d.home.x, { ...HOME, velocity: d.v.x }),
      animate(gy, d.home.y, { ...HOME, velocity: d.v.y }),
    ]).then(() => {
      if (!drag.current) setGhost(null);
    });
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative w-[min(420px,100%)] rounded-[20px] bg-surface p-5 shadow-raised select-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-foreground">Leave a tip</h2>
          <p className="mt-1 text-sm text-muted">Drop coins in the jar.</p>
        </div>
        <div className="text-right">
          <span
            ref={readoutRef}
            aria-hidden
            className="block text-3xl font-semibold tracking-tight text-foreground tabular-nums"
          >
            {format(0)}
          </span>
          <span className="text-xs text-muted tabular-nums">
            {count} {count === 1 ? "coin" : "coins"}
          </span>
        </div>
      </div>
      <output className="sr-only" aria-live="polite">
        Tip total {format(total)}
      </output>

      <div
        className="relative mx-auto mt-2"
        style={{ width: JAR_W, height: STAGE_H }}
        ref={stageRef}
      >
        <div
          ref={jarScope}
          className="absolute inset-0"
          style={{ transformOrigin: `50% ${FLOOR}px` }}
        >
          <svg
            aria-hidden
            viewBox={`0 0 ${JAR_W} ${STAGE_H}`}
            className="absolute inset-0 size-full overflow-visible"
          >
            {/* The back of the glass, behind the coins. */}
            <path
              d={`M4 ${MOUTH_Y + 6} V${FLOOR - 10} Q4 ${FLOOR + 8} 22 ${FLOOR + 8} H${JAR_W - 22} Q${JAR_W - 4} ${FLOOR + 8} ${JAR_W - 4} ${FLOOR - 10} V${MOUTH_Y + 6} Z`}
              className="fill-foreground/[0.035]"
            />
          </svg>

          {coins.map((coin) => {
            const r = radius(coin.value);
            return (
              <div
                key={coin.id}
                ref={(el) => {
                  if (!el) {
                    els.current.delete(coin.id);
                    return;
                  }
                  els.current.set(coin.id, el);
                  const body = bodies.current.find((b) => b.id === coin.id);
                  if (body && !coin.leaving) place(el, body);
                }}
                className="absolute top-0 left-0 transition-[opacity] duration-150 ease-out will-change-transform starting:opacity-0"
                style={{ width: r * 2, height: r * 2 }}
              >
                <CoinFace value={coin.value} currency={currency} />
              </div>
            );
          })}

          <svg
            aria-hidden
            viewBox={`0 0 ${JAR_W} ${STAGE_H}`}
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
            fill="none"
          >
            {/* The glass walls and the thick bottom. */}
            <path
              d={`M4 ${MOUTH_Y + 6} V${FLOOR - 10} Q4 ${FLOOR + 8} 22 ${FLOOR + 8} H${JAR_W - 22} Q${JAR_W - 4} ${FLOOR + 8} ${JAR_W - 4} ${FLOOR - 10} V${MOUTH_Y + 6}`}
              strokeWidth={1.5}
              className="stroke-foreground/25"
            />
            <path
              d={`M14 ${FLOOR + 1} H${JAR_W - 14}`}
              strokeWidth={1}
              className="stroke-foreground/10"
            />
            {/* The lip, drawn in front so coins drop in behind it. */}
            <rect
              x="1"
              y={MOUTH_Y - 4}
              width={JAR_W - 2}
              height="10"
              rx="4"
              strokeWidth={1.5}
              className="fill-surface stroke-foreground/25"
            />
            {/* Reflections on curved glass. */}
            <path
              d={`M15 ${MOUTH_Y + 24} V${FLOOR - 40}`}
              strokeWidth={3}
              strokeLinecap="round"
              className="stroke-foreground/[0.07]"
            />
            <path
              d={`M${JAR_W - 16} ${MOUTH_Y + 30} V${MOUTH_Y + 64}`}
              strokeWidth={2}
              strokeLinecap="round"
              className="stroke-foreground/[0.06]"
            />
          </svg>

          <button
            type="button"
            aria-label={
              count
                ? `Tip jar, ${format(total)}. Shake out the last coin`
                : "Tip jar, empty"
            }
            onClick={removeLast}
            className="absolute inset-x-0 touch-manipulation rounded-t-[6px] rounded-b-[22px] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            style={{ top: MOUTH_Y - 4, height: FLOOR + 8 - (MOUTH_Y - 4) }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Add a coin"
        >
          {denominations.map((value) => (
            <button
              key={value}
              type="button"
              disabled={full}
              aria-label={`Add ${format(value)}`}
              className="flex size-11 cursor-grab touch-none items-center justify-center rounded-full outline-hidden transition-[scale,opacity] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-foreground active:scale-[0.96] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                add(value);
              }}
              onPointerDown={(e) => {
                if (e.button !== 0 || drag.current || full) return;
                suppressClick.current = false;
                const box = e.currentTarget.getBoundingClientRect();
                const home = toRoot(
                  box.left + box.width / 2,
                  box.top + box.height / 2,
                );
                const p = toRoot(e.clientX, e.clientY);
                drag.current = {
                  pointer: e.pointerId,
                  value,
                  home,
                  offset: { x: p.x - home.x, y: p.y - home.y },
                  start: p,
                  last: { ...p, t: e.timeStamp },
                  v: { x: 0, y: 0 },
                  active: false,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || d.pointer !== e.pointerId) return;
                const p = toRoot(e.clientX, e.clientY);
                // 4px of slop keeps a click a click.
                if (
                  !d.active &&
                  Math.hypot(p.x - d.start.x, p.y - d.start.y) < 4
                )
                  return;
                if (!d.active) {
                  d.active = true;
                  setGhost(value);
                }
                const dt = Math.max(e.timeStamp - d.last.t, 1) / 1000;
                // Smoothed, so one uneven sample can't decide the throw.
                d.v.x = d.v.x * 0.5 + ((p.x - d.last.x) / dt) * 0.5;
                d.v.y = d.v.y * 0.5 + ((p.y - d.last.y) / dt) * 0.5;
                d.last = { ...p, t: e.timeStamp };
                gx.set(p.x - d.offset.x);
                gy.set(p.y - d.offset.y);
              }}
              onPointerUp={(e) => {
                if (drag.current?.pointer === e.pointerId) release();
              }}
              onPointerCancel={(e) => {
                if (drag.current?.pointer !== e.pointerId) return;
                drag.current.v = { x: 0, y: 0 };
                release(true);
              }}
            >
              <span
                className="pointer-events-none"
                style={{ width: radius(value) * 2, height: radius(value) * 2 }}
              >
                <CoinFace value={value} currency={currency} />
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={removeLast}
          disabled={count === 0}
          className="h-9 touch-manipulation rounded-full bg-background px-4 text-sm font-medium text-foreground shadow-raised outline-hidden transition-[scale,opacity] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] disabled:opacity-40 disabled:active:scale-100"
        >
          Remove last
        </button>
      </div>
      <p
        className={cn(
          "mt-2 h-4 text-xs text-muted transition-[opacity] duration-150 ease-out",
          !full && "opacity-0",
        )}
        aria-live="polite"
      >
        {full ? "The jar is full." : ""}
      </p>

      {ghost !== null && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-20"
          style={{
            x: gx,
            y: gy,
            width: radius(ghost) * 2,
            height: radius(ghost) * 2,
            marginLeft: -radius(ghost),
            marginTop: -radius(ghost),
          }}
        >
          <CoinFace value={ghost} currency={currency} lifted />
        </motion.div>
      )}
    </div>
  );
}

function CoinFace({
  value,
  currency,
  lifted = false,
}: {
  value: number;
  currency: string;
  lifted?: boolean;
}) {
  const big = value >= 5;
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        big
          ? "bg-foreground text-background"
          : "bg-background text-foreground shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_35%,transparent)]",
        lifted && "shadow-[0_6px_14px_-4px_oklch(0_0_0/0.3)]",
        lifted &&
          !big &&
          "shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_35%,transparent),0_6px_14px_-4px_oklch(0_0_0/0.3)]",
      )}
    >
      {/* The raised rim every coin has, inset from the edge. */}
      <span
        className={cn(
          "flex size-[78%] items-center justify-center rounded-full",
          big
            ? "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--background)_30%,transparent)]"
            : "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_15%,transparent)]",
          value === 2 &&
            "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_15%,transparent),0_0_0_2px_var(--background),0_0_0_3px_color-mix(in_oklab,var(--foreground)_15%,transparent)]",
        )}
      >
        {currency}
        {value}
      </span>
    </span>
  );
}

export default function TipJarDemo() {
  return <TipJar />;
}
