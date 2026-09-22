"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

type State = "idle" | "holding" | "done";

export function HoldToDelete({
  onDelete,
  className,
}: {
  onDelete?: () => void;
  className?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(reset.current), []);

  const press = () => setState((s) => (s === "idle" ? "holding" : s));
  const release = () => setState((s) => (s === "holding" ? "idle" : s));

  return (
    <button
      type="button"
      className={cn(
        "relative h-10 touch-manipulation rounded-full bg-surface px-4 text-sm font-medium text-foreground shadow-raised transition-[scale] duration-150 ease-out select-none active:scale-[0.96] motion-reduce:transition-none",
        className,
      )}
      onPointerDown={(e) => {
        if (e.button === 0) press();
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          press();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") release();
      }}
    >
      <Label done={state === "done"} />
      {/* Fills over 2s while held but snaps back in 200ms on release: slow
          where the user is deciding, fast where the interface responds. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full bg-danger px-4 text-white",
          state === "idle" &&
            "[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-200 ease-out",
          state === "holding" &&
            "[clip-path:inset(0)] transition-[clip-path] duration-[2000ms] ease-linear",
          state === "done" && "[clip-path:inset(0)]",
        )}
        onTransitionEnd={(e) => {
          if (e.propertyName !== "clip-path" || state !== "holding") return;
          setState("done");
          onDelete?.();
          navigator.vibrate?.(10);
          reset.current = setTimeout(() => setState("idle"), 2000);
        }}
      >
        <Label done={state === "done"} />
      </span>
      <span className="sr-only" aria-live="polite">
        {state === "done" ? "Deleted" : ""}
      </span>
    </button>
  );
}

// Both labels share one grid cell, so the button keeps the width of the
// longer one and never jumps when they swap.
function Label({ done }: { done: boolean }) {
  return (
    <span className="grid">
      <Variant
        visible={!done}
        icon={
          <path d="M2.75 4.25h10.5M6.25 4.25v-1.5h3.5v1.5M4 4.25l.6 8.1a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.1M6.75 7v3.75M9.25 7v3.75" />
        }
      >
        Hold to delete
      </Variant>
      <Variant visible={done} icon={<path d="m3.5 8.5 3 3 6-7" />}>
        Deleted
      </Variant>
    </span>
  );
}

function Variant({
  visible,
  icon,
  children,
}: {
  visible: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="col-start-1 row-start-1 flex items-center justify-center gap-2">
      <Icon visible={visible}>{icon}</Icon>
      <span
        className={cn(
          "transition-[opacity,filter] duration-200 ease-out",
          !visible && "opacity-0 blur-[4px]",
        )}
      >
        {children}
      </span>
    </span>
  );
}

function Icon({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={
        visible
          ? { scale: 1, opacity: 1, filter: "blur(0px)" }
          : { scale: 0.25, opacity: 0, filter: "blur(4px)" }
      }
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
    >
      {children}
    </motion.svg>
  );
}

export default function HoldToDeleteDemo() {
  return <HoldToDelete />;
}
