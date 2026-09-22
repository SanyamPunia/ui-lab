import type { ComponentType } from "react";
import OdometerDemo from "./components/odometer";
import HoldToDeleteDemo from "./components/hold-to-delete";
import SegmentedControlDemo from "./components/segmented-control";
import TiltCardDemo from "./components/tilt-card";
// new-component:imports

export type LabEntry = {
  slug: string;
  name: string;
  description: string;
  Demo: ComponentType;
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
  // new-component:entries
];

export function getEntry(slug: string) {
  return lab.find((entry) => entry.slug === slug);
}
