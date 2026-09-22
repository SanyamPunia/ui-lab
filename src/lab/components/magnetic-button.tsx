"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

// How far past its edges the button starts to feel the cursor, in px.
const FIELD = 96;
// Share of the cursor's offset the button follows at full strength.
const STRENGTH = 0.5;
// Light and a little loose, so it follows like it's on a short elastic.
const FOLLOW = { stiffness: 180, damping: 14, mass: 0.2 };
// The label travels further than the button, so it reads as a layer above it.
const LABEL_DEPTH = 0.5;

export function MagneticButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const x = useSpring(pullX, FOLLOW);
  const y = useSpring(pullY, FOLLOW);
  const transform = useMotionTemplate`translate(${x}px, ${y}px)`;
  const labelX = useTransform(x, (v) => v * LABEL_DEPTH);
  const labelY = useTransform(y, (v) => v * LABEL_DEPTH);
  const labelTransform = useMotionTemplate`translate(${labelX}px, ${labelY}px)`;

  const release = () => {
    pullX.set(0);
    pullY.set(0);
  };

  return (
    // The padding is the magnetic field: it catches the cursor before it
    // reaches the button. The matching negative margin keeps it out of the
    // layout, so the page only makes room for the button itself.
    <div
      style={{ padding: FIELD, margin: -FIELD }}
      onPointerMove={(e) => {
        if (reduceMotion || e.pointerType === "touch") return;
        const box = buttonRef.current?.getBoundingClientRect();
        if (!box) return;
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height / 2);
        const reach = Math.max(box.width, box.height) / 2 + FIELD;
        const t = Math.min(Math.hypot(dx, dy) / reach, 1);
        // Weakens with distance like a real magnet, reaching zero at the edge
        // of the field so entering or leaving it never jolts the button.
        const strength = STRENGTH * (1 - t) ** 2;
        pullX.set(dx * strength);
        pullY.set(dy * strength);
      }}
      onPointerLeave={release}
    >
      <motion.div style={{ transform }}>
        <button
          ref={buttonRef}
          className={cn(
            "h-12 rounded-full bg-foreground px-6 text-sm font-medium whitespace-nowrap text-background transition-[scale] duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none",
            className,
          )}
          {...props}
        >
          <motion.span
            className="flex items-center gap-2"
            style={{ transform: labelTransform }}
          >
            {children}
          </motion.span>
        </button>
      </motion.div>
    </div>
  );
}

export default function MagneticButtonDemo() {
  return (
    <MagneticButton type="button">
      Get in touch
      <svg
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </MagneticButton>
  );
}
