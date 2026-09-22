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
import ScrubInputDemo from "./components/scrub-input";
import StarRatingDemo from "./components/star-rating";
import LikeButtonDemo from "./components/like-button";
import SlidingTabsDemo from "./components/sliding-tabs";
import PageDotsDemo from "./components/page-dots";
import CollapsibleSidebarDemo from "./components/collapsible-sidebar";
import SnapCarouselDemo from "./components/snap-carousel";
import SkeletonLoaderDemo from "./components/skeleton-loader";
import ContextMenuDemo from "./components/context-menu";
import NotificationBellDemo from "./components/notification-bell";
import AvatarStackDemo from "./components/avatar-stack";
import MorphingButtonDemo from "./components/morphing-button";
import KanbanBoardDemo from "./components/kanban-board";
import ColorSwatchesDemo from "./components/color-swatches";
import MiniCalendarDemo from "./components/mini-calendar";
import FloatingLabelDemo from "./components/floating-label";
import PasswordFieldDemo from "./components/password-field";
import FilterListDemo from "./components/filter-list";
import GaugeDemo from "./components/gauge";
import SparklineDemo from "./components/sparkline";
import BarChartDemo from "./components/bar-chart";
import StackedDrawerDemo from "./components/stacked-drawer";
import ConfettiButtonDemo from "./components/confetti-button";
import TypewriterDemo from "./components/typewriter";
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
  "scrub-input": ScrubInputDemo,
  "star-rating": StarRatingDemo,
  "like-button": LikeButtonDemo,
  "sliding-tabs": SlidingTabsDemo,
  "page-dots": PageDotsDemo,
  "collapsible-sidebar": CollapsibleSidebarDemo,
  "snap-carousel": SnapCarouselDemo,
  "skeleton-loader": SkeletonLoaderDemo,
  "context-menu": ContextMenuDemo,
  "notification-bell": NotificationBellDemo,
  "avatar-stack": AvatarStackDemo,
  "morphing-button": MorphingButtonDemo,
  "kanban-board": KanbanBoardDemo,
  "color-swatches": ColorSwatchesDemo,
  "mini-calendar": MiniCalendarDemo,
  "floating-label": FloatingLabelDemo,
  "password-field": PasswordFieldDemo,
  "filter-list": FilterListDemo,
  "gauge": GaugeDemo,
  "sparkline": SparklineDemo,
  "bar-chart": BarChartDemo,
  "stacked-drawer": StackedDrawerDemo,
  "confetti-button": ConfettiButtonDemo,
  "typewriter": TypewriterDemo,
  // new-component:entries
};
