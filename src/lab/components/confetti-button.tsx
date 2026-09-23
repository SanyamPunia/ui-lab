"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

// Enough to read as a burst, few enough that one frame stays well under a
// millisecond even with several bursts in flight.
const COUNT = 72;
// Half-angle of the launch cone around straight up.
const CONE = (34 * Math.PI) / 180;
// px/s. A spread of speeds is what separates a pop from a fountain.
const SPEED_MIN = 520;
const SPEED_MAX = 1000;
// px/s². Paired with heavy drag, paper tops out 60 to 130px above the
// button and then falls at gravity / drag, 130px/s, instead of dropping
// like a stone.
const GRAVITY = 650;
const DRAG = 5;
// Seconds. Fades over the last 30% so nothing blinks out.
const LIFE_MIN = 1.5;
const LIFE_MAX = 2.3;
const FADE = 0.3;
// Caps a frame after a hitch, so a stalled tab doesn't teleport particles.
const MAX_DT = 1 / 30;
const CHECK_FOR = 1400;

// Mostly quiet neutrals with an occasional accent, so it celebrates without
// shouting and follows the theme.
const PALETTE = [
  { token: "--foreground", weight: 0.45 },
  { token: "--muted", weight: 0.4 },
  { token: "--danger", weight: 0.15 },
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rotation: number;
  spin: number;
  // Flutter: the flip reads as paper turning over in the air, the sway as
  // it drifting side to side on the way down.
  flipSpeed: number;
  swaySpeed: number;
  sway: number;
  phase: number;
  age: number;
  life: number;
  color: string;
  alpha: number;
};

const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;

// Tokens are light-dark() declarations, which canvas can't parse. Routing
// each through `color` lets the browser resolve it for the current theme.
function readPalette(el: HTMLElement) {
  const colors = PALETTE.map(({ token, weight }) => {
    el.style.color = `var(${token})`;
    return { color: getComputedStyle(el).color, weight };
  });
  el.style.color = "";
  return colors;
}

function pick(colors: { color: string; weight: number }[]) {
  let r = Math.random();
  for (const c of colors) {
    if ((r -= c.weight) <= 0) return c.color;
  }
  return colors[0].color;
}

const between = (a: number, b: number) => a + Math.random() * (b - a);

export function ConfettiButton({
  children = "Celebrate",
  onCelebrate,
  className,
}: {
  children?: React.ReactNode;
  onCelebrate?: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef(0);
  const last = useRef(0);
  const [checked, setChecked] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keeps the backing store at device pixels, so confetti stays crisp.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      clearTimeout(checkTimer.current);
    };
  }, []);

  const tick = (now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dt = Math.min((now - last.current) / 1000, MAX_DT);
    last.current = now;
    const dpr = canvas.width / (canvas.clientWidth || 1);
    const decay = Math.exp(-DRAG * dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const alive: Particle[] = [];
    for (const p of particles.current) {
      p.age += dt;
      if (p.age >= p.life) continue;
      p.vx *= decay;
      p.vy = p.vy * decay + GRAVITY * dt;
      p.x += (p.vx + Math.sin(p.age * p.swaySpeed + p.phase) * p.sway) * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;

      const flip = Math.cos(p.age * p.flipSpeed + p.phase);
      const cos = Math.cos(p.rotation);
      const sin = Math.sin(p.rotation);
      const remaining = (p.life - p.age) / p.life;
      ctx.globalAlpha = p.alpha * Math.min(remaining / FADE, 1);
      ctx.fillStyle = p.color;
      // Rotate, then squash on one axis: a cheap stand-in for a 3D tumble.
      ctx.setTransform(
        dpr * cos,
        dpr * sin,
        -dpr * sin * flip,
        dpr * cos * flip,
        dpr * p.x,
        dpr * p.y,
      );
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      alive.push(p);
    }
    particles.current = alive;
    ctx.globalAlpha = 1;

    // The loop exists only while something is in the air.
    frame.current = alive.length > 0 ? requestAnimationFrame(tick) : 0;
  };

  const burst = () => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    if (!canvas || !button) return;
    const area = canvas.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    const colors = readPalette(canvas);
    const originX = rect.left + rect.width / 2 - area.left;
    const originY = rect.top + rect.height / 2 - area.top;

    for (let i = 0; i < COUNT; i++) {
      const angle = -Math.PI / 2 + between(-CONE, CONE);
      const speed = between(SPEED_MIN, SPEED_MAX);
      const square = Math.random() < 0.25;
      const w = between(5, 9);
      particles.current.push({
        // Spread along the button's face, so it pops from the button rather
        // than a single point.
        x: originX + between(-rect.width / 3, rect.width / 3),
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w,
        h: square ? w : w * between(0.4, 0.55),
        rotation: between(0, Math.PI * 2),
        spin: between(-6, 6),
        flipSpeed: between(6, 14),
        swaySpeed: between(3, 6),
        sway: between(15, 40),
        phase: between(0, Math.PI * 2),
        age: 0,
        life: between(LIFE_MIN, LIFE_MAX),
        color: pick(colors),
        alpha: between(0.75, 1),
      });
    }

    // Later bursts join the running loop instead of starting another.
    if (!frame.current) {
      last.current = performance.now();
      frame.current = requestAnimationFrame(tick);
    }
  };

  const celebrate = () => {
    onCelebrate?.();
    if (reduceMotion) {
      setChecked(true);
      clearTimeout(checkTimer.current);
      checkTimer.current = setTimeout(() => setChecked(false), CHECK_FOR);
    } else {
      burst();
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        // Softens the region's edges, so paper leaving it fades instead of
        // being cut off by a hard line.
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent), linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          maskComposite: "intersect",
        }}
      />
      <button
        ref={buttonRef}
        type="button"
        onClick={celebrate}
        className="relative h-10 touch-manipulation rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-raised outline-hidden transition-[scale] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-none"
      >
        {/* Both states share one grid cell, so the swap never resizes it. */}
        <span className="grid">
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[opacity] duration-200 ease-out",
              checked && "opacity-0",
            )}
          >
            {children}
          </span>
          <span
            aria-hidden
            className="col-start-1 row-start-1 flex items-center justify-center"
          >
            <motion.svg
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ opacity: checked ? 1 : 0 }}
              transition={ICON_SWAP}
            >
              <path d="m3.5 8.5 3 3 6-7" />
            </motion.svg>
          </span>
        </span>
      </button>
      <span className="sr-only" aria-live="polite">
        {checked ? "Celebrated" : ""}
      </span>
    </div>
  );
}

export default function ConfettiButtonDemo() {
  return <ConfettiButton className="h-72 w-[360px] max-w-full" />;
}
