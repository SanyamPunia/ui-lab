"use client";

import { useEffect, useRef, useState } from "react";
import { SIGNATURE, SIGNATURE_VIEWBOX } from "@/lib/signature";

// Signs itself once, the first time it scrolls into view, then stays put.
export function SignatureMark() {
  const ref = useRef<SVGSVGElement>(null);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSigned(true);
        io.disconnect();
      },
      // Mostly in view first, so the stroke is seen being written.
      { threshold: 0.8 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={SIGNATURE_VIEWBOX}
      role="img"
      aria-label="xevrion"
      className="h-9 w-auto overflow-visible text-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={SIGNATURE}
        pathLength={1}
        // A quick practised signature, easing through the loops.
        className="[stroke-dasharray:1] transition-[stroke-dashoffset] duration-[900ms] ease-[cubic-bezier(0.45,0,0.25,1)] motion-reduce:transition-none"
        style={{ strokeDashoffset: signed ? 0 : 1 }}
      />
    </svg>
  );
}
