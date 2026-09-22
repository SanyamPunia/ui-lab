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

// The index shows every demo at once, so one static bundle beats 27 separate
// chunks there. Single lab pages use the split loader in demos.tsx instead.
export const previews: Record<string, ComponentType> = {
  odometer: OdometerDemo,
  "hold-to-delete": HoldToDeleteDemo,
  "segmented-control": SegmentedControlDemo,
  "tilt-card": TiltCardDemo,
  dock: DockDemo,
  sheet: SheetDemo,
  "toast-stack": ToastStackDemo,
  "elastic-slider": ElasticSliderDemo,
  "magnetic-button": MagneticButtonDemo,
  "text-scramble": TextScrambleDemo,
  "swipe-deck": SwipeDeckDemo,
  "scroll-reveal": ScrollRevealDemo,
  "copy-button": CopyButtonDemo,
  "expanding-search": ExpandingSearchDemo,
  accordion: AccordionDemo,
  "expanding-card": ExpandingCardDemo,
  "otp-input": OtpInputDemo,
  "toggle-switch": ToggleSwitchDemo,
  "command-palette": CommandPaletteDemo,
  marquee: MarqueeDemo,
  "reorder-list": ReorderListDemo,
  "compare-slider": CompareSliderDemo,
  "multi-step-form": MultiStepFormDemo,
  "upload-button": UploadButtonDemo,
  "tooltip-group": TooltipGroupDemo,
  "dropdown-menu": DropdownMenuDemo,
  "dynamic-island": DynamicIslandDemo,
  // new-component:entries
};
