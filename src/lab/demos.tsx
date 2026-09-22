"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Each demo is its own chunk. /lab/[slug] is one route for every component,
// so a static import would bundle all of them into every page; dynamic()
// splits them and the page only loads the demo it renders.
const demos: Record<string, ComponentType> = {
  odometer: dynamic(() => import("./components/odometer")),
  "hold-to-delete": dynamic(() => import("./components/hold-to-delete")),
  "segmented-control": dynamic(() => import("./components/segmented-control")),
  "tilt-card": dynamic(() => import("./components/tilt-card")),
  dock: dynamic(() => import("./components/dock")),
  sheet: dynamic(() => import("./components/sheet")),
  "toast-stack": dynamic(() => import("./components/toast-stack")),
  "elastic-slider": dynamic(() => import("./components/elastic-slider")),
  "magnetic-button": dynamic(() => import("./components/magnetic-button")),
  "text-scramble": dynamic(() => import("./components/text-scramble")),
  "swipe-deck": dynamic(() => import("./components/swipe-deck")),
  "scroll-reveal": dynamic(() => import("./components/scroll-reveal")),
  "copy-button": dynamic(() => import("./components/copy-button")),
  "expanding-search": dynamic(() => import("./components/expanding-search")),
  accordion: dynamic(() => import("./components/accordion")),
  "expanding-card": dynamic(() => import("./components/expanding-card")),
  "otp-input": dynamic(() => import("./components/otp-input")),
  "toggle-switch": dynamic(() => import("./components/toggle-switch")),
  "command-palette": dynamic(() => import("./components/command-palette")),
  marquee: dynamic(() => import("./components/marquee")),
  "reorder-list": dynamic(() => import("./components/reorder-list")),
  "compare-slider": dynamic(() => import("./components/compare-slider")),
  "multi-step-form": dynamic(() => import("./components/multi-step-form")),
  "upload-button": dynamic(() => import("./components/upload-button")),
  "tooltip-group": dynamic(() => import("./components/tooltip-group")),
  "dropdown-menu": dynamic(() => import("./components/dropdown-menu")),
  "dynamic-island": dynamic(() => import("./components/dynamic-island")),
  // new-component:entries
};

export function LabDemo({ slug }: { slug: string }) {
  const Demo = demos[slug];
  return Demo ? <Demo /> : null;
}
