"use client";

import { useLayoutEffect } from "react";

const KEY = "lab:index-scroll";

// Coming back to the index from a component lands where you left the list,
// whether by the back button or the header link. Per tab, so a fresh visit
// still starts at the top.
export function ScrollMemory() {
  useLayoutEffect(() => {
    try {
      const saved = Number(sessionStorage.getItem(KEY));
      if (saved > 0) window.scrollTo(0, saved);
    } catch {}

    // Saved straight away rather than in an animation frame: browsers already
    // fire scroll at most once a frame, and a deferred write can be lost if a
    // card is clicked before the frame runs.
    const save = () => {
      try {
        sessionStorage.setItem(KEY, String(window.scrollY));
      } catch {}
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  return null;
}
