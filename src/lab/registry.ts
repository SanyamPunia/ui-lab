import type { ComponentType } from "react";
import OdometerDemo from "./components/odometer";
import HoldToDeleteDemo from "./components/hold-to-delete";
import SegmentedControlDemo from "./components/segmented-control";
import TiltCardDemo from "./components/tilt-card";
import DockDemo from "./components/dock";
import SheetDemo from "./components/sheet";
import ToastStackDemo from "./components/toast-stack";
import ElasticSliderDemo from "./components/elastic-slider";
import MagneticButtonDemo from "./components/magnetic-button";
import TextScrambleDemo from "./components/text-scramble";
import SwipeDeckDemo from "./components/swipe-deck";
// new-component:imports

export type LabEntry = {
  slug: string;
  name: string;
  description: string;
  Demo: ComponentType;
  // Shrinks the demo on the index cards only, for ones taller than a preview.
  previewScale?: number;
};

export const lab: LabEntry[] = [
  {
    slug: "odometer",
    name: "Odometer",
    description:
      "Rolls forward like a mechanical counter and wraps from 999 back to 000.",
    Demo: OdometerDemo,
  },
  {
    slug: "hold-to-delete",
    name: "Hold to delete",
    description:
      "Fills slowly while you commit to it, snaps back the moment you let go.",
    Demo: HoldToDeleteDemo,
  },
  {
    slug: "segmented-control",
    name: "Segmented control",
    description:
      "Each label changes color exactly as the pill slides over it.",
    Demo: SegmentedControlDemo,
  },
  {
    slug: "tilt-card",
    name: "Tilt card",
    description: "Leans toward your cursor with a glare that follows the light.",
    Demo: TiltCardDemo,
  },
  {
    slug: "dock",
    name: "Dock",
    description: "Icons swell as your cursor nears them, like the macOS dock.",
    Demo: DockDemo,
  },
  {
    slug: "sheet",
    name: "Sheet",
    description: "Drag it down or flick it away; pull it up and it pushes back.",
    Demo: SheetDemo,
  },
  {
    slug: "toast-stack",
    name: "Toast stack",
    description: "Stacks with depth, fans out on hover, swipes away.",
    Demo: ToastStackDemo,
  },
  {
    slug: "elastic-slider",
    name: "Elastic slider",
    description: "Stretches like rubber when you drag past the end, then springs back.",
    Demo: ElasticSliderDemo,
  },
  {
    slug: "magnetic-button",
    name: "Magnetic button",
    description: "Leans toward your cursor before you even reach it.",
    Demo: MagneticButtonDemo,
  },
  {
    slug: "text-scramble",
    name: "Text scramble",
    description: "Hover a word and it decodes itself, one letter at a time.",
    Demo: TextScrambleDemo,
  },
  {
    slug: "swipe-deck",
    name: "Swipe deck",
    description: "Fling a card away and the rest of the deck steps forward.",
    Demo: SwipeDeckDemo,
    previewScale: 0.55,
  },
  // new-component:entries
];

export function getEntry(slug: string) {
  return lab.find((entry) => entry.slug === slug);
}

const REPO = "https://github.com/xevrion/ui-lab";

// `bun run new` names every file after its slug, so the path follows from it.
export function sourceUrl(slug: string) {
  return `${REPO}/blob/main/src/lab/components/${slug}.tsx`;
}
