// Metadata only. Component code lives in demos.ts, so pages that need just
// a name or description never pull in every demo.
export type LabEntry = {
  slug: string;
  name: string;
  description: string;
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
  },
  {
    slug: "hold-to-delete",
    name: "Hold to delete",
    description:
      "Fills slowly while you commit to it, snaps back the moment you let go.",
  },
  {
    slug: "segmented-control",
    name: "Segmented control",
    description:
      "Each label changes color exactly as the pill slides over it.",
  },
  {
    slug: "tilt-card",
    name: "Tilt card",
    description: "Leans toward your cursor with a glare that follows the light.",
  },
  {
    slug: "dock",
    name: "Dock",
    description: "Icons swell as your cursor nears them, like the macOS dock.",
  },
  {
    slug: "sheet",
    name: "Sheet",
    description: "Drag it down or flick it away; pull it up and it pushes back.",
  },
  {
    slug: "toast-stack",
    name: "Toast stack",
    description: "Stacks with depth, fans out on hover, swipes away.",
  },
  {
    slug: "elastic-slider",
    name: "Elastic slider",
    description: "Stretches like rubber when you drag past the end, then springs back.",
  },
  {
    slug: "magnetic-button",
    name: "Magnetic button",
    description: "Leans toward your cursor before you even reach it.",
  },
  {
    slug: "text-scramble",
    name: "Text scramble",
    description: "Hover a word and it decodes itself, one letter at a time.",
  },
  {
    slug: "swipe-deck",
    name: "Swipe deck",
    description: "Fling a card away and the rest of the deck steps forward.",
    previewScale: 0.55,
  },
  {
    slug: "scroll-reveal",
    name: "Scroll reveal",
    description: "Words light up one by one as you scroll through them.",
    previewScale: 0.8,
  },
  {
    slug: "copy-button",
    name: "Copy button",
    description: "Confirms the copy before the clipboard even answers.",
  },
  {
    slug: "expanding-search",
    name: "Expanding search",
    description: "Opens from a circle into a search field, and closes faster than it opens.",
  },
  {
    slug: "accordion",
    name: "Accordion",
    description: "Opens without moving the row you clicked, so it closes right where you are.",
    anchor: "top",
  },
  {
    slug: "expanding-card",
    name: "Expanding card",
    description: "Grows from its slot into a detail view and folds back when you are done.",
  },
  {
    slug: "otp-input",
    name: "OTP input",
    description: "Six slots mirror one real input, so paste and SMS autofill just work.",
  },
  {
    slug: "toggle-switch",
    name: "Toggle switch",
    description: "Leans into the move when pressed, then springs across and squashes on landing.",
  },
  {
    slug: "command-palette",
    name: "Command palette",
    description: "Opens on ⌘K and filters commands as you type.",
  },
  {
    slug: "marquee",
    name: "Marquee",
    description: "Drifts endlessly, and brakes gently when you hover.",
  },
  {
    slug: "reorder-list",
    name: "Reorder list",
    description: "Picks rows up by the handle and slides the rest out of the way.",
    previewScale: 0.9,
  },
  {
    slug: "compare-slider",
    name: "Compare slider",
    description: "Drag the line to see what polish actually changes.",
  },
  {
    slug: "multi-step-form",
    name: "Multi-step form",
    description: "Slides between steps while the card grows around each one.",
    previewScale: 0.6,
  },
  {
    slug: "upload-button",
    name: "Upload button",
    description: "Shrinks into a progress ring, fills, then checks off.",
  },
  {
    slug: "tooltip-group",
    name: "Tooltip group",
    description: "Waits before the first tooltip, then shows each neighbor instantly as you scan.",
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown menu",
    description: "Grows out of its trigger, and press, drag, release picks an item like a native menu.",
  },
  {
    slug: "dynamic-island",
    name: "Dynamic island",
    description: "Morphs between live states with a springy, Apple-style bounce.",
  },
  {
    slug: "scrub-input",
    name: "Scrub input",
    description: "Drag the label to scrub the value, or just type.",
  },
  {
    slug: "star-rating",
    name: "Star rating",
    description: "Hover to preview, click to commit with a little pop.",
  },
  {
    slug: "like-button",
    name: "Like button",
    description: "Pops, bursts and rolls the count when you like.",
  },
  {
    slug: "sliding-tabs",
    name: "Sliding tabs",
    description: "An underline glides to the tab you pick while a soft pill follows your pointer.",
  },
  {
    slug: "page-dots",
    name: "Page dots",
    description: "A pill that inches between pages like a worm and counts down to the next.",
  },
  {
    slug: "collapsible-sidebar",
    name: "Collapsible sidebar",
    description: "Folds down to an icon rail, with labels that step aside before it closes.",
  },
  {
    slug: "snap-carousel",
    name: "Snap carousel",
    description: "Snaps cards to center, grows them as they arrive, and drags with the mouse.",
  },
  {
    slug: "skeleton-loader",
    name: "Skeleton loader",
    description: "Holds the exact shape of what is coming, so nothing jumps.",
    previewScale: 0.9,
  },
  {
    slug: "context-menu",
    name: "Context menu",
    description: "Opens at your cursor and grows from it.",
  },
  {
    slug: "notification-bell",
    name: "Notification bell",
    description: "Rings when something new arrives, and the badge rolls up with each one.",
    anchor: "top",
  },
  {
    slug: "avatar-stack",
    name: "Avatar stack",
    description: "Fans open when you reach for it, with a name above each face.",
  },
  {
    slug: "morphing-button",
    name: "Morphing button",
    description: "Shrinks into a spinner while it saves, then answers with a check or a shake.",
  },
  {
    slug: "kanban-board",
    name: "Kanban board",
    description: "Lift a card and the others slide aside to make room for it.",
    previewScale: 0.95,
  },
  {
    slug: "color-swatches",
    name: "Color swatches",
    description: "The ring glides to the color you pick and the preview follows it.",
  },
  {
    slug: "mini-calendar",
    name: "Mini calendar",
    description: "Months slide past in the direction you travel.",
    previewScale: 0.75,
  },
  {
    slug: "floating-label",
    name: "Floating label",
    description: "Rises into the corner as you type, and never covers what you wrote.",
    anchor: "top",
  },
  {
    slug: "password-field",
    name: "Password field",
    description: "Fills its meter as the password gets stronger.",
  },
  {
    slug: "filter-list",
    name: "Filter list",
    description: "Rows fade out of the way while the rest slide up to close the gap.",
    previewScale: 0.8,
  },
  {
    slug: "gauge",
    name: "Gauge",
    description: "Fills its arc and counts up to the value on the same spring.",
  },
  {
    slug: "sparkline",
    name: "Sparkline",
    description: "Draws itself in, then scrubs to the nearest point under your cursor.",
  },
  {
    slug: "bar-chart",
    name: "Bar chart",
    description: "Grows its bars from the baseline and springs them between two weeks.",
  },
  {
    slug: "stacked-drawer",
    name: "Stacked drawer",
    description: "Stacks iOS sheets that push the page back and drag down to dismiss.",
    previewScale: 0.6,
  },
  {
    slug: "confetti-button",
    name: "Confetti button",
    description: "Bursts theme-colored confetti from the button.",
  },
  {
    slug: "typewriter",
    name: "Typewriter",
    description: "Types, pauses and rewrites the last word with a human rhythm.",
    previewScale: 0.9,
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
