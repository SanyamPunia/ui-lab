"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789#%&*+=/<>";
// Head start before the first character settles, so the noise registers.
const LEAD = 180;
// Each character settles this long after the one before it.
const STAGGER = 45;
// New noise roughly 25 times a second. Changing it every frame reads as
// flicker rather than decoding.
const TICK = 40;

function noise(original: string) {
  const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  return original === original.toUpperCase() ? glyph.toUpperCase() : glyph;
}

// Writes straight to the node every frame, so decoding never re-renders React.
export function useScramble<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const frame = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const scramble = useCallback(() => {
    const node = ref.current;
    if (!node || reduceMotion) return;
    cancelAnimationFrame(frame.current);

    const chars = [...text];
    const current = chars.map(noise);
    const start = performance.now();
    let lastTick = start;

    const step = (now: number) => {
      const elapsed = now - start;
      const refresh = now - lastTick >= TICK;
      if (refresh) lastTick = now;

      let settled = true;
      node.textContent = chars
        .map((char, i) => {
          if (char === " " || elapsed >= LEAD + i * STAGGER) return char;
          settled = false;
          if (refresh) current[i] = noise(char);
          return current[i];
        })
        .join("");

      if (!settled) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [text, reduceMotion]);

  return { ref, scramble };
}

function ScrambleItem({ index, label }: { index: number; label: string }) {
  const { ref, scramble } = useScramble<HTMLSpanElement>(label);

  return (
    <li>
      <button
        type="button"
        onPointerEnter={scramble}
        onFocus={scramble}
        className="group flex items-baseline gap-4 font-mono text-3xl tracking-tight text-muted uppercase transition-[color] duration-150 ease-out outline-hidden hover:text-foreground focus-visible:text-foreground"
      >
        <span className="text-xs tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        {/* Mono is load-bearing here: every glyph is the same width, so the
            word doesn't jitter sideways while it decodes. */}
        <span className="sr-only">{label}</span>
        <span ref={ref} aria-hidden>
          {label}
        </span>
      </button>
    </li>
  );
}

const ITEMS = ["Work", "Lab", "Writing", "Contact"];

export default function TextScrambleDemo() {
  return (
    <ul className="flex flex-col gap-2">
      {ITEMS.map((label, i) => (
        <ScrambleItem key={label} index={i} label={label} />
      ))}
    </ul>
  );
}
