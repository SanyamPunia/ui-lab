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
import TagInputDemo from "./components/tag-input";
import RangeSliderDemo from "./components/range-slider";
import NumberStepperDemo from "./components/number-stepper";
import SelectMenuDemo from "./components/select-menu";
import UndoToastDemo from "./components/undo-toast";
import FileDropzoneDemo from "./components/file-dropzone";
import ChatThreadDemo from "./components/chat-thread";
import LoaderSetDemo from "./components/loader-set";
import WheelPickerDemo from "./components/wheel-picker";
import SlideToConfirmDemo from "./components/slide-to-confirm";
import PullToRefreshDemo from "./components/pull-to-refresh";
import HoverCardDemo from "./components/hover-card";
import TreeViewDemo from "./components/tree-view";
import PricingToggleDemo from "./components/pricing-toggle";
import ReadingProgressDemo from "./components/reading-progress";
import CodeBlockDemo from "./components/code-block";
import WaveTextDemo from "./components/wave-text";
import DotGridDemo from "./components/dot-grid";
import SpotlightCardDemo from "./components/spotlight-card";
import StoryProgressDemo from "./components/story-progress";
import DataTableDemo from "./components/data-table";
import ComboboxDemo from "./components/combobox";
import DateRangePickerDemo from "./components/date-range-picker";
import InlineEditDemo from "./components/inline-edit";
import DialogDemo from "./components/dialog";
import PaginationDemo from "./components/pagination";
import AnnouncementBannerDemo from "./components/announcement-banner";
import ShortcutSheetDemo from "./components/shortcut-sheet";
import SpringPlaygroundDemo from "./components/spring-playground";
import EasingEditorDemo from "./components/easing-editor";
import StaggerVisualizerDemo from "./components/stagger-visualizer";
import OnboardingChecklistDemo from "./components/onboarding-checklist";
import FlipCardDemo from "./components/flip-card";
import IconMorphDemo from "./components/icon-morph";
import StickyStackDemo from "./components/sticky-stack";
import InfiniteCanvasDemo from "./components/infinite-canvas";
import DragSelectDemo from "./components/drag-select";
import SortableGridDemo from "./components/sortable-grid";
import MagnetLinesDemo from "./components/magnet-lines";
import MorphingNavDemo from "./components/morphing-nav";
import ColorPickerDemo from "./components/color-picker";
import CardInputDemo from "./components/card-input";
import RadioCardsDemo from "./components/radio-cards";
import CheckboxGroupDemo from "./components/checkbox-group";
import ProgressStepperDemo from "./components/progress-stepper";
import PromiseToastDemo from "./components/promise-toast";
import ConfirmPopoverDemo from "./components/confirm-popover";
import ActivityTimelineDemo from "./components/activity-timeline";
import BreadcrumbsDemo from "./components/breadcrumbs";
import OverflowTabsDemo from "./components/overflow-tabs";
import TabBarDemo from "./components/tab-bar";
import SelectionToolbarDemo from "./components/selection-toolbar";
import Carousel3dDemo from "./components/carousel-3d";
import LensRevealDemo from "./components/lens-reveal";
import ElasticStringDemo from "./components/elastic-string";
import ParticleTextDemo from "./components/particle-text";
import ThemeToggleDemo from "./components/theme-toggle";
import BookmarkButtonDemo from "./components/bookmark-button";
import SendButtonDemo from "./components/send-button";
import DownloadButtonDemo from "./components/download-button";
import ContributionHeatmapDemo from "./components/contribution-heatmap";
import DonutChartDemo from "./components/donut-chart";
import StatCounterDemo from "./components/stat-counter";
import LeaderboardDemo from "./components/leaderboard";
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
  "tag-input": TagInputDemo,
  "range-slider": RangeSliderDemo,
  "number-stepper": NumberStepperDemo,
  "select-menu": SelectMenuDemo,
  "undo-toast": UndoToastDemo,
  "file-dropzone": FileDropzoneDemo,
  "chat-thread": ChatThreadDemo,
  "loader-set": LoaderSetDemo,
  "wheel-picker": WheelPickerDemo,
  "slide-to-confirm": SlideToConfirmDemo,
  "pull-to-refresh": PullToRefreshDemo,
  "hover-card": HoverCardDemo,
  "tree-view": TreeViewDemo,
  "pricing-toggle": PricingToggleDemo,
  "reading-progress": ReadingProgressDemo,
  "code-block": CodeBlockDemo,
  "wave-text": WaveTextDemo,
  "dot-grid": DotGridDemo,
  "spotlight-card": SpotlightCardDemo,
  "story-progress": StoryProgressDemo,
  "data-table": DataTableDemo,
  "combobox": ComboboxDemo,
  "date-range-picker": DateRangePickerDemo,
  "inline-edit": InlineEditDemo,
  "dialog": DialogDemo,
  "pagination": PaginationDemo,
  "announcement-banner": AnnouncementBannerDemo,
  "shortcut-sheet": ShortcutSheetDemo,
  "spring-playground": SpringPlaygroundDemo,
  "easing-editor": EasingEditorDemo,
  "stagger-visualizer": StaggerVisualizerDemo,
  "onboarding-checklist": OnboardingChecklistDemo,
  "flip-card": FlipCardDemo,
  "icon-morph": IconMorphDemo,
  "sticky-stack": StickyStackDemo,
  "infinite-canvas": InfiniteCanvasDemo,
  "drag-select": DragSelectDemo,
  "sortable-grid": SortableGridDemo,
  "magnet-lines": MagnetLinesDemo,
  "morphing-nav": MorphingNavDemo,
  "color-picker": ColorPickerDemo,
  "card-input": CardInputDemo,
  "radio-cards": RadioCardsDemo,
  "checkbox-group": CheckboxGroupDemo,
  "progress-stepper": ProgressStepperDemo,
  "promise-toast": PromiseToastDemo,
  "confirm-popover": ConfirmPopoverDemo,
  "activity-timeline": ActivityTimelineDemo,
  "breadcrumbs": BreadcrumbsDemo,
  "overflow-tabs": OverflowTabsDemo,
  "tab-bar": TabBarDemo,
  "selection-toolbar": SelectionToolbarDemo,
  "carousel-3d": Carousel3dDemo,
  "lens-reveal": LensRevealDemo,
  "elastic-string": ElasticStringDemo,
  "particle-text": ParticleTextDemo,
  "theme-toggle": ThemeToggleDemo,
  "bookmark-button": BookmarkButtonDemo,
  "send-button": SendButtonDemo,
  "download-button": DownloadButtonDemo,
  "contribution-heatmap": ContributionHeatmapDemo,
  "donut-chart": DonutChartDemo,
  "stat-counter": StatCounterDemo,
  "leaderboard": LeaderboardDemo,
  // new-component:entries
};
