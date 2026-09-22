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
import ScrollRevealDemo from "./components/scroll-reveal";
import CopyButtonDemo from "./components/copy-button";
import ExpandingSearchDemo from "./components/expanding-search";
import AccordionDemo from "./components/accordion";
import ExpandingCardDemo from "./components/expanding-card";
import OtpInputDemo from "./components/otp-input";
import ToggleSwitchDemo from "./components/toggle-switch";
import CommandPaletteDemo from "./components/command-palette";
import MarqueeDemo from "./components/marquee";
import ReorderListDemo from "./components/reorder-list";
import CompareSliderDemo from "./components/compare-slider";
import MultiStepFormDemo from "./components/multi-step-form";
import UploadButtonDemo from "./components/upload-button";
import TooltipGroupDemo from "./components/tooltip-group";
import DropdownMenuDemo from "./components/dropdown-menu";
import DynamicIslandDemo from "./components/dynamic-island";
// new-component:imports

export type LabEntry = {
  slug: string;
  name: string;
  description: string;
  Demo: ComponentType;
  // Shrinks the demo on the index cards only, for ones taller than a preview.
  previewScale?: number;
  // Pins the demo to the top of its page instead of centring it, for demos
  // that change height, so growing never shifts what is under the cursor.
  anchor?: "top";
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
  {
    slug: "scroll-reveal",
    name: "Scroll reveal",
    description: "Words light up one by one as you scroll through them.",
    previewScale: 0.8,
    Demo: ScrollRevealDemo,
  },
  {
    slug: "copy-button",
    name: "Copy button",
    description: "Confirms the copy before the clipboard even answers.",
    Demo: CopyButtonDemo,
  },
  {
    slug: "expanding-search",
    name: "Expanding search",
    description: "Opens from a circle into a search field, and closes faster than it opens.",
    Demo: ExpandingSearchDemo,
  },
  {
    slug: "accordion",
    name: "Accordion",
    description: "Opens without moving the row you clicked, so it closes right where you are.",
    anchor: "top",
    Demo: AccordionDemo,
  },
  {
    slug: "expanding-card",
    name: "Expanding card",
    description: "Grows from its slot into a detail view and folds back when you are done.",
    Demo: ExpandingCardDemo,
  },
  {
    slug: "otp-input",
    name: "OTP input",
    description: "Six slots mirror one real input, so paste and SMS autofill just work.",
    Demo: OtpInputDemo,
  },
  {
    slug: "toggle-switch",
    name: "Toggle switch",
    description: "Leans into the move when pressed, then springs across and squashes on landing.",
    Demo: ToggleSwitchDemo,
  },
  {
    slug: "command-palette",
    name: "Command palette",
    description: "Opens on ⌘K and filters commands as you type.",
    Demo: CommandPaletteDemo,
  },
  {
    slug: "marquee",
    name: "Marquee",
    description: "Drifts endlessly, and brakes gently when you hover.",
    Demo: MarqueeDemo,
  },
  {
    slug: "reorder-list",
    name: "Reorder list",
    description: "Picks rows up by the handle and slides the rest out of the way.",
    previewScale: 0.9,
    Demo: ReorderListDemo,
  },
  {
    slug: "compare-slider",
    name: "Compare slider",
    description: "Drag the line to see what polish actually changes.",
    Demo: CompareSliderDemo,
  },
  {
    slug: "multi-step-form",
    name: "Multi-step form",
    description: "Slides between steps while the card grows around each one.",
    previewScale: 0.6,
    Demo: MultiStepFormDemo,
  },
  {
    slug: "upload-button",
    name: "Upload button",
    description: "Shrinks into a progress ring, fills, then checks off.",
    Demo: UploadButtonDemo,
  },
  {
    slug: "tooltip-group",
    name: "Tooltip group",
    description: "Waits before the first tooltip, then shows each neighbor instantly as you scan.",
    Demo: TooltipGroupDemo,
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown menu",
    description: "Grows out of its trigger, and press, drag, release picks an item like a native menu.",
    Demo: DropdownMenuDemo,
  },
  {
    slug: "dynamic-island",
    name: "Dynamic island",
    description: "Morphs between live states with a springy, Apple-style bounce.",
    Demo: DynamicIslandDemo,
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
