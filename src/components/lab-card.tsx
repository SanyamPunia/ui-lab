"use client";

import { useState } from "react";
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

  return (
    <li
      className={className}
      // Touch has no hover, and a tap opens the component anyway.
      onPointerEnter={(e) => e.pointerType !== "touch" && setPlay(true)}
      onPointerLeave={() => setPlay(false)}
      onFocus={() => setPlay(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPlay(false);
      }}
    >
      <PreviewPlayContext value={play}>{children}</PreviewPlayContext>
    </li>
  );
}
