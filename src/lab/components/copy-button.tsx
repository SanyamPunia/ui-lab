"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type Status = "idle" | "copied" | "failed";

const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;

export function CopyButton({
  value,
  label = "Copy to clipboard",
  // Long enough to read the tooltip, short enough that a second copy
  // rarely lands while the first is still confirming.
  resetAfter = 1600,
  onCopy,
  className,
}: {
  value: string;
  label?: string;
  resetAfter?: number;
  onCopy?: (value: string) => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");
  // Holds the last message while the tooltip fades out, so it never
  // empties mid-exit.
  const [message, setMessage] = useState("Copied");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attempt = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = (next: Exclude<Status, "idle">) => {
    setStatus(next);
    setMessage(next === "copied" ? "Copied" : "Couldn't copy");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), resetAfter);
  };

  const copy = async () => {
    const id = ++attempt.current;
    // Confirm on press rather than after the write resolves; the write is
    // near instant, and waiting for it makes the click feel ignored.
    show("copied");
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      if (id === attempt.current) onCopy?.(value);
    } catch {
      // Ignore failures from a click that a newer one has superseded.
      if (id === attempt.current) show("failed");
    }
  };

  const visible = status !== "idle";

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        onClick={copy}
        className={cn(
          "relative flex size-8 touch-manipulation items-center justify-center rounded-full text-muted outline-hidden transition-[scale,color,background-color] duration-150 ease-out select-none hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-[color,background-color]",
          // Grows the hit area to 40px without growing the visible circle.
          "after:absolute after:-inset-1 after:rounded-full",
          visible && "text-foreground",
        )}
      >
        {/* Both icons share one grid cell so the swap never shifts layout. */}
        <span className="grid" aria-hidden>
          <Icon visible={status !== "copied"} reduceMotion={reduceMotion}>
            <rect x="5.25" y="5.25" width="8" height="8" rx="1.75" />
            <path d="M10.75 5.25V4.5a1.75 1.75 0 0 0-1.75-1.75H4.5A1.75 1.75 0 0 0 2.75 4.5V9a1.75 1.75 0 0 0 1.75 1.75h.75" />
          </Icon>
          <Icon visible={status === "copied"} reduceMotion={reduceMotion}>
            <path d="m3.5 8.5 3 3 6-7" />
          </Icon>
        </span>
      </button>

      {/* Out of flow, so appearing never nudges the row. Enters in 150ms,
          leaves in 100ms: the exit should never hold the eye. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom rounded-full bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background",
          "transition-[opacity,translate,scale] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[opacity]",
          visible
            ? "translate-y-0 scale-100 opacity-100 duration-150"
            : "translate-y-1 scale-[0.97] opacity-0 duration-100 motion-reduce:translate-y-0 motion-reduce:scale-100",
        )}
      >
        {message}
      </span>

      <span className="sr-only" aria-live="polite">
        {visible ? message : ""}
      </span>
    </span>
  );
}

function Icon({
  visible,
  reduceMotion,
  children,
}: {
  visible: boolean;
  reduceMotion: boolean | null;
  children: React.ReactNode;
}) {
  // Reduced motion keeps the cross-fade but drops the scale and blur.
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { scale: 0.25, opacity: 0, filter: "blur(4px)" };
  return (
    <motion.svg
      viewBox="0 0 16 16"
      className="col-start-1 row-start-1 size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={visible ? { scale: 1, opacity: 1, filter: "blur(0px)" } : hidden}
      transition={ICON_SWAP}
    >
      {children}
    </motion.svg>
  );
}

export default function CopyButtonDemo() {
  const command = "bun add motion";
  return (
    // A 44px pill with 6px padding around the 32px button keeps the radii
    // concentric: 22 = 16 + 6.
    <div className="flex h-11 items-center gap-3 rounded-full bg-surface pr-1.5 pl-4 shadow-raised">
      <code className="font-mono text-sm text-foreground">
        <span className="text-muted select-none">$ </span>
        {command}
      </code>
      <CopyButton value={command} label="Copy command" />
    </div>
  );
}
