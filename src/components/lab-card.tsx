"use client";

import { useEffect, useRef, useState } from "react";
import { PreviewPlayContext } from "@/lab/preview-play";

// An index card that tells its preview when it's hovered or focused, so the
// demo inside can act itself out. The cards' contents still render on the
// server; only this wrapper and the demos that listen re-render.
export function LabCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [play, setPlay] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  // Phones have no hover, so there a card plays whenever it's mostly on
  // screen: scrolling the index brings each one to life as it arrives. A
  // phone screen fits two or three cards, so only those few ever run.
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => setPlay(entry.isIntersecting),
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={className}
      // Touch is handled by the observer above; a tap opens the piece.
      onPointerEnter={(e) => e.pointerType !== "touch" && setPlay(true)}
      onPointerLeave={(e) => e.pointerType !== "touch" && setPlay(false)}
      onFocus={() => setPlay(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPlay(false);
      }}
    >
      <PreviewPlayContext value={play}>{children}</PreviewPlayContext>
    </li>
  );
}
