"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

const STRIP_H = 96;
// The pen sits near the right edge so most of the strip is history.
const PEN_INSET = 44;
// Paper speed, px per second: a word's worth of keys spans a thumb's width.
const PAPER_SPEED = 64;
// Grid pitch on the paper, px.
const GRID = 16;
// Needle spring: stiff and underdamped so each kick rings for a few cycles,
// the way a real stylus chatters (about 5Hz, gone in under a second).
const NEEDLE_K = 900;
const NEEDLE_C = 11;
// Base kick velocity in px/s; scaled by typing tempo below.
const KICK = 420;
// Paper keeps rolling this long after the last key, then stops.
const IDLE_MS = 1400;
// WPM is keystrokes over the last few seconds, 5 characters per word.
const WPM_WINDOW = 5000;

type Colors = { ink: string; grid: string; axis: string; arm: string };

// Soft clip so a hard kick flattens against the edge instead of leaving the
// paper. Applied only when drawing, so the physics stays linear.
function clip(y: number) {
  const limit = STRIP_H / 2 - 6;
  return limit * Math.tanh(y / limit);
}

export function TypingSeismograph({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wpmRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  // Everything the loop touches lives here, so typing never re-renders
  // more than the textarea itself.
  const sim = useRef({
    y: 0,
    v: 0,
    samples: new Float32Array(0),
    head: 0,
    scroll: 0,
    consumed: 0,
    width: 0,
    lastKey: 0,
    keys: [] as number[],
    burstStart: 0,
    frame: 0,
    last: 0,
    colors: null as Colors | null,
  });

  const readColors = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const probe = (cls: string) => {
      const el = wrap.querySelector<HTMLElement>(`[data-probe="${cls}"]`);
      return el ? getComputedStyle(el).color : "#888";
    };
    sim.current.colors = {
      ink: probe("ink"),
      grid: probe("grid"),
      axis: probe("axis"),
      arm: probe("arm"),
    };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const s = sim.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !s.colors || !s.width) return;
    const dpr = window.devicePixelRatio || 1;
    const w = s.width;
    const mid = STRIP_H / 2;
    const pen = w - PEN_INSET;
    const tip = clip(s.y);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, STRIP_H);

    // Grid scrolls with the paper: offset by how far it has travelled.
    ctx.lineWidth = 1;
    ctx.strokeStyle = s.colors.grid;
    ctx.beginPath();
    const shift = s.scroll % GRID;
    for (let x = pen - shift; x > 0; x -= GRID) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, STRIP_H);
    }
    for (let y = mid - GRID * 2; y <= mid + GRID * 2; y += GRID) {
      if (y === mid) continue;
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = s.colors.axis;
    ctx.beginPath();
    ctx.moveTo(0, mid + 0.5);
    ctx.lineTo(w, mid + 0.5);
    ctx.stroke();

    // Trace: newest sample at the pen, older ones to the left. The
    // sub-pixel part of the scroll keeps motion smooth between samples.
    const n = s.samples.length;
    const frac = s.scroll - s.consumed;
    ctx.strokeStyle = s.colors.ink;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pen, mid - tip);
    for (let i = 0; i < n; i++) {
      const x = pen - frac - i;
      if (x < -2) break;
      const sample = s.samples[(s.head - 1 - i + n * 2) % n];
      ctx.lineTo(x, mid - sample);
    }
    ctx.stroke();

    // Needle arm from the right edge to the pen tip.
    ctx.strokeStyle = s.colors.arm;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w + 2, mid - tip * 0.35);
    ctx.lineTo(pen, mid - tip);
    ctx.stroke();
    ctx.fillStyle = s.colors.ink;
    ctx.beginPath();
    ctx.arc(pen, mid - tip, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const updateWpm = (now: number) => {
    const s = sim.current;
    while (s.keys.length && now - s.keys[0] > WPM_WINDOW) s.keys.shift();
    // Over a short burst, divide by the burst's real length (at least 2s,
    // so three quick keys don't read as 200 WPM).
    const span = Math.min(WPM_WINDOW, Math.max(2000, now - s.burstStart));
    const wpm = Math.round(s.keys.length / 5 / (span / 60000));
    if (wpmRef.current) wpmRef.current.textContent = String(wpm);
  };

  const push = (y: number) => {
    const s = sim.current;
    if (!s.samples.length) return;
    s.samples[s.head] = y;
    s.head = (s.head + 1) % s.samples.length;
  };

  const run = () => {
    const s = sim.current;
    if (s.frame) return;
    s.last = performance.now();
    setActive(true);
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      // Substeps keep the stiff spring stable on slow frames.
      const steps = 4;
      const h = dt / steps;
      const prevY = s.y;
      for (let i = 0; i < steps; i++) {
        s.v += (-NEEDLE_K * s.y - NEEDLE_C * s.v) * h;
        s.y += s.v * h;
      }
      s.scroll += PAPER_SPEED * dt;
      const whole = Math.floor(s.scroll) - s.consumed;
      for (let i = 1; i <= whole; i++) {
        push(clip(prevY + ((s.y - prevY) * i) / whole));
      }
      s.consumed += whole;
      draw();
      updateWpm(now);
      const resting =
        now - s.lastKey > IDLE_MS && Math.abs(s.y) < 0.1 && Math.abs(s.v) < 1;
      if (resting) {
        s.frame = 0;
        s.y = 0;
        s.v = 0;
        draw();
        setActive(false);
        return;
      }
      s.frame = requestAnimationFrame(tick);
    };
    s.frame = requestAnimationFrame(tick);
  };

  const kick = (direction: 1 | -1, size = 1) => {
    const s = sim.current;
    const now = performance.now();
    const gap = s.lastKey ? now - s.lastKey : Infinity;
    if (gap > IDLE_MS) s.burstStart = now;
    s.lastKey = now;
    s.keys.push(now);
    // Fast typing hits harder; a key after a long pause is a light tap.
    const tempo = Math.min(1.6, Math.max(0.45, 180 / gap));
    const jitter = 0.85 + Math.random() * 0.3;
    if (reduceMotion) {
      // No rolling paper: each key steps the paper and leaves one tick.
      const amp = clip(direction * tempo * size * 18);
      for (let i = 0; i < 3; i++) push(amp * (1 - i / 3));
      for (let i = 0; i < 5; i++) push(0);
      s.scroll += 8;
      s.consumed += 8;
      updateWpm(now);
      draw();
      return;
    }
    s.v += direction * KICK * tempo * size * jitter;
    run();
  };

  // Size the canvas to its box at device resolution, keeping the most
  // recent history when the width changes.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const s = sim.current;
    readColors();
    const resize = () => {
      const w = Math.round(canvas.clientWidth);
      if (!w || w === s.width) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(STRIP_H * dpr);
      const next = new Float32Array(w);
      const old = s.samples;
      for (let i = 0; i < Math.min(old.length, w); i++) {
        next[w - 1 - i] = old[(s.head - 1 - i + old.length * 2) % old.length];
      }
      s.samples = next;
      s.head = 0;
      s.width = w;
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Canvas pixels don't follow CSS, so repaint when the theme flips.
    const repaint = () => {
      readColors();
      draw();
    };
    const mo = new MutationObserver(repaint);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", repaint);

    return () => {
      ro.disconnect();
      mo.disconnect();
      media.removeEventListener("change", repaint);
      cancelAnimationFrame(s.frame);
      s.frame = 0;
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn("w-[min(460px,100%)]", className)}>
      <label
        htmlFor={`${id}-field`}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="overflow-hidden rounded-xl bg-background shadow-raised transition-[box-shadow] duration-150 ease-out focus-within:shadow-[0_0_0_1.5px_var(--foreground)]">
        <textarea
          id={`${id}-field`}
          value={value}
          placeholder={placeholder}
          aria-describedby={`${id}-wpm`}
          rows={4}
          onChange={(e) => {
            const type = (e.nativeEvent as InputEvent).inputType ?? "";
            const delta = e.target.value.length - value.length;
            onChange(e.target.value);
            if (type.startsWith("delete") || delta < 0) {
              kick(-1);
            } else {
              // A paste is one big jolt, not a burst of keys.
              kick(1, delta > 1 ? Math.min(2, 1 + delta / 40) : 1);
            }
          }}
          className="block h-28 w-full resize-none bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-foreground outline-hidden placeholder:text-muted"
        />
        <div className="relative border-t border-border bg-surface">
          <canvas
            ref={canvasRef}
            aria-hidden
            className="block w-full"
            style={{ height: STRIP_H }}
          />
          {/* Hidden swatches: canvas can't use tokens, so it reads their
              resolved colors from these. */}
          <span data-probe="ink" className="hidden text-foreground" />
          <span data-probe="grid" className="hidden text-foreground/[0.06]" />
          <span data-probe="axis" className="hidden text-foreground/15" />
          <span data-probe="arm" className="hidden text-muted" />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full transition-[background-color] duration-200 ease-out",
              active ? "bg-danger" : "bg-foreground/20",
            )}
          />
          {active ? "Recording" : "At rest"}
        </span>
        <span id={`${id}-wpm`} className="text-muted">
          <span
            ref={wpmRef}
            className={cn(
              "font-semibold text-foreground tabular-nums transition-[opacity] duration-200 ease-out",
              !active && "opacity-60",
            )}
          >
            0
          </span>{" "}
          words per minute
        </span>
      </div>
    </div>
  );
}

export default function TypingSeismographDemo() {
  const [text, setText] = useState("");
  return (
    <TypingSeismograph
      label="Message"
      placeholder="Type something and watch the needle"
      value={text}
      onChange={setText}
    />
  );
}
