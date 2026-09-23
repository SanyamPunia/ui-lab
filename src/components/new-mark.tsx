"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

// One observer for every mark on the page, instead of one each.
let observer: IntersectionObserver | undefined;

function watch(el: Element) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.drawn = "true";
        observer?.unobserve(entry.target);
      }
    },
    // Waits until the mark is properly on screen, so the stroke is seen
    // being drawn rather than finishing just below the fold.
    { rootMargin: "0px 0px -15% 0px" },
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

// A quick pen loop around the word: it starts at the top right, runs the
// wrong way round like a right-handed circle does, and overshoots its own
// start instead of closing neatly.
const LOOP =
  "M40 5.2C32 1.6 12 1.8 5 7.4C0.8 11 2.2 20.5 14.5 23C27 25.4 44 22 45.6 14.2C46.8 8.2 38.5 3.4 26.5 2.6C22 2.3 18.5 2.9 16 3.6";

export function NewMark({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) return watch(el);
  }, []);

  return (
    <span
      ref={ref}
      data-drawn="false"
      className={cn(
        "group/new relative inline-flex items-center px-2 align-middle text-xs leading-5 font-medium text-marker",
        className,
      )}
    >
      new
      <svg
        viewBox="0 0 48 26"
        fill="none"
        aria-hidden
        // Tilted a few degrees, the way a quick circle never sits level.
        className="pointer-events-none absolute -top-1 -left-1 h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-3 overflow-visible"
        preserveAspectRatio="none"
      >
        <path
          d={LOOP}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          // A pen accelerates into the stroke and eases off at the end, so
          // ease-in-out rather than the usual ease-out. 600ms is slow for UI
          // on purpose: the drawing is the point, and it plays only once.
          className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] delay-150 duration-600 ease-[cubic-bezier(0.65,0,0.35,1)] group-data-[drawn=true]/new:[stroke-dashoffset:0] motion-reduce:[stroke-dashoffset:0] motion-reduce:transition-none"
        />
      </svg>
    </span>
  );
}
