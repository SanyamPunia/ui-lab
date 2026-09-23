// Metadata only. Component code lives in demos.ts, so pages that need just
// a name or description never pull in every demo.
export type LabEntry = {
  slug: string;
  name: string;
  description: string;
  // Searched but never shown: the gestures and synonyms people type, like
  // "drag" or "wizard", that a description doesn't always mention.
  keywords?: string;
  // Resizes the demo on the index cards only: below 1 for demos bigger than
  // a preview, above 1 for small controls that would otherwise float in an
  // empty box.
  previewScale?: number;
  // For demos far taller than a preview: fill the card's width and show the
  // top of the demo, fading out at the bottom, instead of shrinking the whole
  // thing until it is unreadable.
  previewCrop?: boolean;
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
    keywords: "counter number digits rolling increment",
  },
  {
    slug: "hold-to-delete",
    name: "Hold to delete",
    description:
      "Fills slowly while you commit to it, snaps back the moment you let go.",
    keywords: "button long press confirm destructive clip-path",
    previewScale: 1.4,
  },
  {
    slug: "segmented-control",
    name: "Segmented control",
    description: "Each label changes color exactly as the pill slides over it.",
    keywords: "tabs toggle switcher radio",
  },
  {
    slug: "tilt-card",
    name: "Tilt card",
    description:
      "Leans toward your cursor with a glare that follows the light.",
    keywords: "3d hover parallax glare reflection",
    previewScale: 0.95,
  },
  {
    slug: "dock",
    name: "Dock",
    description: "Icons swell as your cursor nears them, like the macOS dock.",
    keywords: "macos magnify icons hover spring toolbar",
  },
  {
    slug: "sheet",
    name: "Sheet",
    description:
      "Drag it down or flick it away; pull it up and it pushes back.",
    keywords: "drawer bottom sheet modal drag swipe dismiss gesture",
    previewScale: 1.4,
  },
  {
    slug: "toast-stack",
    name: "Toast stack",
    description: "Stacks with depth, fans out on hover, swipes away.",
    keywords: "notification toast sonner swipe drag stack",
    previewScale: 1.4,
  },
  {
    slug: "elastic-slider",
    name: "Elastic slider",
    description:
      "Stretches like rubber when you drag past the end, then springs back.",
    keywords: "volume slider rubber band drag mute range",
    previewScale: 0.95,
  },
  {
    slug: "magnetic-button",
    name: "Magnetic button",
    description: "Leans toward your cursor before you even reach it.",
    keywords: "button hover cursor pull spring",
    previewScale: 0.8,
  },
  {
    slug: "text-scramble",
    name: "Text scramble",
    description: "Hover a word and it decodes itself, one letter at a time.",
    keywords: "text hover decode glitch letters",
  },
  {
    slug: "swipe-deck",
    name: "Swipe deck",
    description: "Fling a card away and the rest of the deck steps forward.",
    keywords: "cards drag swipe fling tinder gesture stack",
    previewScale: 0.5,
  },
  {
    slug: "scroll-reveal",
    name: "Scroll reveal",
    description: "Words light up one by one as you scroll through them.",
    keywords: "scroll text words reveal scroll-driven",
    previewScale: 0.55,
  },
  {
    slug: "copy-button",
    name: "Copy button",
    description: "Confirms the copy before the clipboard even answers.",
    keywords: "clipboard copy button icon feedback",
    previewScale: 1.4,
  },
  {
    slug: "expanding-search",
    name: "Expanding search",
    description:
      "Opens from a circle into a search field, and closes faster than it opens.",
    keywords: "search input morph expand shortcut",
  },
  {
    slug: "accordion",
    name: "Accordion",
    description:
      "Opens without moving the row you clicked, so it closes right where you are.",
    keywords: "disclosure faq collapse expand",
    previewScale: 0.65,
    anchor: "top",
  },
  {
    slug: "expanding-card",
    name: "Expanding card",
    description:
      "Grows from its slot into a detail view and folds back when you are done.",
    keywords: "shared layout morph modal dialog layoutid",
    previewScale: 0.75,
  },
  {
    slug: "otp-input",
    name: "OTP input",
    description:
      "Six slots mirror one real input, so paste and SMS autofill just work.",
    keywords: "code one-time password input verification pin",
  },
  {
    slug: "toggle-switch",
    name: "Toggle switch",
    description:
      "Leans into the move when pressed, then springs across and squashes on landing.",
    keywords: "switch toggle checkbox squash stretch drag",
    previewScale: 0.8,
  },
  {
    slug: "command-palette",
    name: "Command palette",
    description: "Opens on ⌘K and filters commands as you type.",
    keywords: "cmdk command menu search keyboard shortcut",
  },
  {
    slug: "marquee",
    name: "Marquee",
    description: "Drifts endlessly, and brakes gently when you hover.",
    keywords: "ticker scroll loop infinite",
    previewScale: 0.6,
  },
  {
    slug: "reorder-list",
    name: "Reorder list",
    description:
      "Picks rows up by the handle and slides the rest out of the way.",
    keywords: "drag reorder sortable list",
    previewScale: 0.6,
  },
  {
    slug: "compare-slider",
    name: "Compare slider",
    description: "Drag the line to see what polish actually changes.",
    keywords: "before after compare drag clip-path",
    previewScale: 0.6,
  },
  {
    slug: "multi-step-form",
    name: "Multi-step form",
    description: "Slides between steps while the card grows around each one.",
    keywords: "wizard steps form onboarding",
    previewScale: 0.4,
  },
  {
    slug: "upload-button",
    name: "Upload button",
    description: "Shrinks into a progress ring, fills, then checks off.",
    keywords: "upload progress ring button loading",
    previewScale: 1.4,
  },
  {
    slug: "tooltip-group",
    name: "Tooltip group",
    description:
      "Waits before the first tooltip, then shows each neighbor instantly as you scan.",
    keywords: "tooltip toolbar delay hover",
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown menu",
    description:
      "Grows out of its trigger, and press, drag, release picks an item like a native menu.",
    keywords: "menu popover dropdown options",
    previewScale: 1.4,
  },
  {
    slug: "dynamic-island",
    name: "Dynamic island",
    description:
      "Morphs between live states with a springy, Apple-style bounce.",
    keywords: "iphone island morph pill notification music",
    previewScale: 0.75,
  },
  {
    slug: "scrub-input",
    name: "Scrub input",
    description: "Drag the label to scrub the value, or just type.",
    keywords: "number input drag scrub figma",
    previewScale: 0.8,
  },
  {
    slug: "star-rating",
    name: "Star rating",
    description: "Hover to preview, click to commit with a little pop.",
    keywords: "rating stars review",
  },
  {
    slug: "like-button",
    name: "Like button",
    description: "Pops, bursts and rolls the count when you like.",
    keywords: "heart like particles burst",
    previewScale: 1.4,
  },
  {
    slug: "sliding-tabs",
    name: "Sliding tabs",
    description:
      "An underline glides to the tab you pick while a soft pill follows your pointer.",
    keywords: "tabs underline navigation layoutid",
    previewScale: 0.65,
  },
  {
    slug: "page-dots",
    name: "Page dots",
    description:
      "A pill that inches between pages like a worm and counts down to the next.",
    keywords: "pagination carousel dots autoplay indicator",
    previewScale: 0.7,
  },
  {
    slug: "collapsible-sidebar",
    name: "Collapsible sidebar",
    description:
      "Folds down to an icon rail, with labels that step aside before it closes.",
    keywords: "sidebar navigation collapse nav rail",
    previewScale: 0.55,
  },
  {
    slug: "snap-carousel",
    name: "Snap carousel",
    description:
      "Snaps cards to center, grows them as they arrive, and drags with the mouse.",
    keywords: "carousel slider scroll snap drag gallery",
    previewScale: 0.6,
  },
  {
    slug: "skeleton-loader",
    name: "Skeleton loader",
    description: "Holds the exact shape of what is coming, so nothing jumps.",
    keywords: "loading placeholder shimmer skeleton",
    previewScale: 0.65,
  },
  {
    slug: "context-menu",
    name: "Context menu",
    description: "Opens at your cursor and grows from it.",
    keywords: "right click menu contextmenu long press",
    previewScale: 0.6,
  },
  {
    slug: "notification-bell",
    name: "Notification bell",
    description:
      "Rings when something new arrives, and the badge rolls up with each one.",
    keywords: "notifications badge bell alert inbox",
    anchor: "top",
  },
  {
    slug: "avatar-stack",
    name: "Avatar stack",
    description:
      "Fans open when you reach for it, with a name above each face.",
    keywords: "avatars people users team faces",
  },
  {
    slug: "morphing-button",
    name: "Morphing button",
    description:
      "Shrinks into a spinner while it saves, then answers with a check or a shake.",
    keywords: "button loading success error submit save",
    previewScale: 1.4,
  },
  {
    slug: "kanban-board",
    name: "Kanban board",
    description: "Lift a card and the others slide aside to make room for it.",
    keywords: "kanban drag board columns tasks trello",
    previewScale: 0.5,
  },
  {
    slug: "color-swatches",
    name: "Color swatches",
    description:
      "The ring glides to the color you pick and the preview follows it.",
    keywords: "color picker palette swatch theme",
  },
  {
    slug: "mini-calendar",
    name: "Mini calendar",
    description: "Months slide past in the direction you travel.",
    keywords: "calendar date picker month",
    previewScale: 0.5,
  },
  {
    slug: "floating-label",
    name: "Floating label",
    description:
      "Rises into the corner as you type, and never covers what you wrote.",
    keywords: "input label form field validation",
    previewScale: 0.8,
    anchor: "top",
  },
  {
    slug: "password-field",
    name: "Password field",
    description: "Fills its meter as the password gets stronger.",
    keywords: "password strength meter input form",
    previewScale: 0.8,
  },
  {
    slug: "filter-list",
    name: "Filter list",
    description:
      "Rows fade out of the way while the rest slide up to close the gap.",
    keywords: "search filter list chips",
    previewScale: 0.5,
  },
  {
    slug: "gauge",
    name: "Gauge",
    description: "Fills its arc and counts up to the value on the same spring.",
    keywords: "meter dial chart progress",
    previewScale: 0.7,
  },
  {
    slug: "sparkline",
    name: "Sparkline",
    description:
      "Draws itself in, then scrubs to the nearest point under your cursor.",
    keywords: "line chart graph data",
    previewScale: 0.6,
  },
  {
    slug: "bar-chart",
    name: "Bar chart",
    description:
      "Grows its bars from the baseline and springs them between two weeks.",
    keywords: "bar chart graph data",
    previewScale: 0.6,
  },
  {
    slug: "stacked-drawer",
    name: "Stacked drawer",
    description:
      "Stacks iOS sheets that push the page back and drag down to dismiss.",
    keywords: "ios sheet modal stack drawer drag",
    previewScale: 0.35,
  },
  {
    slug: "confetti-button",
    name: "Confetti button",
    description: "Bursts theme-colored confetti from the button.",
    keywords: "celebrate confetti particles canvas",
    previewScale: 0.65,
  },
  {
    slug: "typewriter",
    name: "Typewriter",
    description:
      "Types, pauses and rewrites the last word with a human rhythm.",
    keywords: "typing text animation cursor",
  },
  {
    slug: "tag-input",
    name: "Tag input",
    description:
      "Turns what you type into chips that pop in and slide aside as they leave.",
    keywords: "tags chips input multi",
    previewScale: 0.7,
    anchor: "top",
  },
  {
    slug: "range-slider",
    name: "Range slider",
    description:
      "Two thumbs that glide, stop at each other, and show their value as you drag.",
    keywords: "range slider dual price filter drag",
    previewScale: 0.7,
  },
  {
    slug: "number-stepper",
    name: "Number stepper",
    description:
      "Rolls each digit the way the count moves, and speeds up the longer you hold.",
    keywords: "quantity stepper counter cart increment",
    previewScale: 0.75,
  },
  {
    slug: "select-menu",
    name: "Select menu",
    description:
      "Opens with your current choice sitting exactly on the button, macOS style.",
    keywords: "select dropdown listbox picker",
    previewScale: 0.7,
  },
  {
    slug: "undo-toast",
    name: "Undo toast",
    description:
      "Deletes instantly and gives you five seconds to change your mind.",
    keywords: "undo snackbar delete countdown",
    previewScale: 0.65,
  },
  {
    slug: "file-dropzone",
    name: "File dropzone",
    description:
      "Brightens when a file enters the window and reaches up when it is overhead.",
    keywords: "upload drag drop files",
    previewScale: 0.6,
    anchor: "top",
  },
  {
    slug: "chat-thread",
    name: "Chat thread",
    description:
      "Replies arrive after a beat of typing, and the thread follows only if you are.",
    keywords: "chat messages bubbles typing",
    previewScale: 0.45,
  },
  {
    slug: "loader-set",
    name: "Loader set",
    description: "Four ways to say still working, each timed to how it moves.",
    keywords: "loading spinner progress indicator",
    previewScale: 0.55,
  },
  {
    slug: "wheel-picker",
    name: "Wheel picker",
    description: "Spins through the hours on a curved drum, just like iOS.",
    keywords: "time picker ios wheel drum scroll",
    previewScale: 0.6,
  },
  {
    slug: "slide-to-confirm",
    name: "Slide to confirm",
    description: "Drag the knob all the way across to confirm.",
    keywords: "slide unlock drag confirm",
    previewScale: 0.85,
  },
  {
    slug: "pull-to-refresh",
    name: "Pull to refresh",
    description: "Pull the feed down and new posts slide in at the top.",
    keywords: "refresh feed drag mobile",
    previewScale: 0.4,
  },
  {
    slug: "hover-card",
    name: "Hover card",
    description: "Hover a name to preview their profile.",
    keywords: "profile preview popover hover",
    previewScale: 0.7,
  },
  {
    slug: "tree-view",
    name: "Tree view",
    description:
      "Folders unfold in place while the selection glides to the file you pick.",
    keywords: "file tree folders explorer",
    previewScale: 0.6,
    anchor: "top",
  },
  {
    slug: "pricing-toggle",
    name: "Pricing toggle",
    description:
      "Each digit rolls to its new price on its own, and new digits grow in.",
    keywords: "pricing plans billing numbers",
    previewScale: 0.5,
  },
  {
    slug: "reading-progress",
    name: "Reading progress",
    description:
      "A progress bar fills as you read while the time left counts down.",
    keywords: "scroll progress article reading",
    previewScale: 0.55,
  },
  {
    slug: "code-block",
    name: "Code block",
    description:
      "Switch files with a sliding underline and copy with one click.",
    keywords: "code syntax copy tabs",
    previewScale: 0.6,
  },
  {
    slug: "wave-text",
    name: "Wave text",
    description: "Letters rise in a wave that follows your cursor.",
    keywords: "text hover wave letters",
  },
  {
    slug: "dot-grid",
    name: "Dot grid",
    description:
      "Dots swell and part around your cursor, and a click sends a shockwave.",
    keywords: "canvas dots grid cursor interactive",
    previewScale: 0.6,
  },
  {
    slug: "spotlight-card",
    name: "Spotlight card",
    description:
      "A soft light follows your cursor across the grid and catches the card edges.",
    keywords: "spotlight glow hover cards",
    previewScale: 0.6,
  },
  {
    slug: "story-progress",
    name: "Story progress",
    description: "Tap through stories, hold to pause.",
    keywords: "stories instagram progress autoplay",
    previewScale: 0.4,
  },
  {
    slug: "data-table",
    name: "Data table",
    description: "Sorts, selects and bulk-acts on rows without losing its place.",
    keywords: "grid sort checkbox bulk rows spreadsheet list select",
    previewScale: 0.5,
  },
  {
    slug: "combobox",
    name: "Combobox",
    description: "Finds a teammate as you type and fills the field in one keystroke.",
    keywords: "autocomplete typeahead search assign people dropdown select mention",
    previewScale: 0.85,
  },
  {
    slug: "date-range-picker",
    name: "Date range picker",
    description: "Paints the range as you hover, then commits it on the second click.",
    keywords: "calendar dates range booking hover filter period schedule",
    previewScale: 0.4,
  },
  {
    slug: "inline-edit",
    name: "Inline edit",
    description: "Edits your name and bio in place without moving a pixel.",
    keywords: "editable text profile rename click form field input",
    previewScale: 0.75,
    anchor: "top",
  },
  {
    slug: "dialog",
    name: "Dialog",
    description: "Opens a modal over the page, with a confirmation that stacks on top of it.",
    keywords: "modal popup overlay confirm nested alertdialog focus trap",
    previewScale: 0.75,
  },
  {
    slug: "pagination",
    name: "Pagination",
    description: "Pages through a list while the current-page marker glides to each number.",
    keywords: "pager pages next previous ellipsis table navigation",
    previewScale: 0.55,
  },
  {
    slug: "announcement-banner",
    name: "Announcement banner",
    description: "Dismissing folds the bar away and the page slides up to fill the gap.",
    keywords: "alert bar notice top bar dismiss close collapse notification",
    previewScale: 0.6,
  },
  {
    slug: "shortcut-sheet",
    name: "Shortcut sheet",
    description: "Press ? anywhere to see every shortcut, then press one to watch it light up.",
    keywords: "hotkeys keybindings cheatsheet help kbd keyboard search",
    previewScale: 1.4,
  },
  {
    slug: "spring-playground",
    name: "Spring playground",
    description: "Tune a spring and watch its overshoot and settle, plotted live.",
    keywords: "physics stiffness damping bounce drag throw chart",
    previewScale: 0.5,
    previewCrop: true,
    anchor: "top",
  },
  {
    slug: "easing-editor",
    name: "Easing editor",
    description: "Drag a cubic-bezier into shape and see it move.",
    keywords: "curve bezier timing function drag handles preview css",
    previewScale: 0.55,
    previewCrop: true,
  },
  {
    slug: "stagger-visualizer",
    name: "Stagger visualizer",
    description: "Shows what per-item delay actually does to a list entrance.",
    keywords: "cascade sequence ripple entrance grid timeline delay",
    previewScale: 0.6,
    previewCrop: true,
    anchor: "top",
  },
  {
    slug: "onboarding-checklist",
    name: "Onboarding checklist",
    description: "A setup checklist that counts up as you go and celebrates the finish.",
    keywords: "todo tasks progress ring checkbox getting started",
    previewScale: 0.45,
    anchor: "top",
  },
  {
    slug: "flip-card",
    name: "Flip card",
    description: "Turns over in 3D to show what is on the back.",
    keywords: "rotate 3d membership reveal tilt hover card flip",
    previewScale: 0.45,
  },
  {
    slug: "icon-morph",
    name: "Icon morph",
    description: "Icons reshape themselves between states instead of swapping.",
    keywords: "toggle svg path hamburger play pause animated icon",
    previewScale: 0.85,
  },
  {
    slug: "sticky-stack",
    name: "Sticky stack",
    description: "Cards pile up and sink back as you scroll.",
    keywords: "scroll sticky stacking cards parallax progress",
    previewScale: 0.4,
  },
  {
    slug: "infinite-canvas",
    name: "Infinite canvas",
    description: "Pan, pinch and zoom around a board of notes.",
    keywords: "pan zoom pinch drag whiteboard figma momentum",
    previewScale: 0.5,
  },
  {
    slug: "drag-select",
    name: "Drag select",
    description: "Draw a box across files to select them, like the desktop.",
    keywords: "marquee lasso multi-select rubber band finder files grid drag",
    previewScale: 0.55,
  },
  {
    slug: "sortable-grid",
    name: "Sortable grid",
    description: "Drag an app tile and the others slide out of its way.",
    keywords: "reorder drag and drop sortable rearrange home screen icons long-press",
    previewScale: 0.45,
  },
  {
    slug: "magnet-lines",
    name: "Magnet lines",
    description: "Lines turn toward your cursor like iron filings near a magnet.",
    keywords: "canvas field compass hover follow pointer background interactive",
    previewScale: 0.55,
  },
  {
    slug: "morphing-nav",
    name: "Morphing nav",
    description: "One dropdown panel reshapes and slides as you move between menu items.",
    keywords: "mega menu dropdown navigation navbar hover header stripe",
    previewScale: 0.5,
  },
  {
    slug: "color-picker",
    name: "Color picker",
    description: "Drag a color out of the square, then fine-tune hue and opacity.",
    keywords: "swatch eyedropper hex hsv palette alpha drag",
    previewScale: 0.5,
  },
  {
    slug: "card-input",
    name: "Card input",
    description: "Formats as you type, spots the card brand, and flips to show the CVC.",
    keywords: "credit payment checkout luhn 3d flip form validation",
    previewScale: 0.75,
    previewCrop: true,
  },
  {
    slug: "radio-cards",
    name: "Radio cards",
    description: "The selection ring glides to the plan you pick.",
    keywords: "plan pricing tier radio select option subscription",
    previewScale: 0.65,
  },
  {
    slug: "checkbox-group",
    name: "Checkbox group",
    description: "Check marks draw themselves in, and Shift-click fills a range.",
    keywords: "checkbox select all indeterminate bulk settings notifications toggle",
    previewScale: 0.45,
  },
  {
    slug: "progress-stepper",
    name: "Progress stepper",
    description: "Fills the line toward the next step and unfills it in reverse.",
    keywords: "steps wizard checkout progress breadcrumb onboarding",
    previewScale: 0.6,
  },
  {
    slug: "promise-toast",
    name: "Promise toast",
    description: "One toast that morphs from saving to saved, or to an error with retry.",
    keywords: "toast notification loading spinner async snackbar sonner",
    previewScale: 1.4,
  },
  {
    slug: "confirm-popover",
    name: "Confirm popover",
    description: "Asks before deleting, from a popover that grows out of the button.",
    keywords: "confirm delete destructive dialog popconfirm danger alert",
    previewScale: 0.7,
  },
  {
    slug: "activity-timeline",
    name: "Activity timeline",
    description: "New events slide in at the top as the line grows to meet them.",
    keywords: "feed log history events notifications changelog list",
    previewScale: 0.4,
  },
  {
    slug: "breadcrumbs",
    name: "Breadcrumbs",
    description: "Folds the middle of a deep path into a menu when space runs out.",
    keywords: "path overflow collapse ellipsis resize navigation trail",
    previewScale: 0.6,
  },
  {
    slug: "overflow-tabs",
    name: "Overflow tabs",
    description: "Scrolls a long row of tabs, fading whichever edge still hides more.",
    keywords: "scroll horizontal arrows fade tablist navigation overflow",
    previewScale: 0.65,
  },
  {
    slug: "tab-bar",
    name: "Tab bar",
    description: "A phone tab bar whose pill slides over and fills in the icon it lands on.",
    keywords: "mobile bottom navigation ios pill icons tap",
    previewScale: 0.35,
  },
  {
    slug: "selection-toolbar",
    name: "Selection toolbar",
    description: "A formatting toolbar that grows out of whatever text you select.",
    keywords: "highlight bold editor popover floating format text select",
    previewScale: 0.65,
  },
  {
    slug: "carousel-3d",
    name: "Carousel 3d",
    description: "Spin a ring of cards and flick it to land on the one you were aiming for.",
    keywords: "3d rotate drag flick coverflow gallery slider momentum",
    previewScale: 0.6,
  },
  {
    slug: "lens-reveal",
    name: "Lens reveal",
    description: "A lens follows your cursor and shows the specs hidden under a card.",
    keywords: "magnifier spotlight x-ray hover inspect reveal mask blueprint",
    previewScale: 0.65,
  },
  {
    slug: "elastic-string",
    name: "Elastic string",
    description: "Pull a string and let go to watch it ring back to rest.",
    keywords: "guitar pluck spring drag pull rubber band svg physics",
    previewScale: 0.65,
  },
  {
    slug: "particle-text",
    name: "Particle text",
    description: "A word made of dots that part around your cursor and burst when clicked.",
    keywords: "canvas particles scatter explode hover typography interactive physics",
    previewScale: 0.6,
  },
  {
    slug: "theme-toggle",
    name: "Theme toggle",
    description: "A sun that folds its rays away and turns into a crescent moon.",
    keywords: "dark mode light mode night switch icon morph sun moon",
    previewScale: 0.85,
  },
  {
    slug: "bookmark-button",
    name: "Bookmark button",
    description: "Fills from the bottom up and lands with a small squash.",
    keywords: "save favorite bookmark toggle counter read later",
    previewScale: 0.7,
  },
  {
    slug: "send-button",
    name: "Send button",
    description: "The plane takes off along a curve, and a check lands in its place.",
    keywords: "submit message paper plane chat success confirm",
    previewScale: 0.75,
  },
  {
    slug: "download-button",
    name: "Download button",
    description: "The arrow drops into the tray while the button fills with progress.",
    keywords: "progress file save loading export cancel",
    previewScale: 0.65,
  },
  {
    slug: "contribution-heatmap",
    name: "Contribution heatmap",
    description: "A year of activity at a glance, sweeping in week by week.",
    keywords: "github graph calendar activity grid hover streak",
    previewScale: 0.4,
  },
  {
    slug: "donut-chart",
    name: "Donut chart",
    description: "Draws itself in, then lifts whichever slice you point at.",
    keywords: "pie chart ring hover legend breakdown percent",
    previewScale: 0.65,
  },
  {
    slug: "stat-counter",
    name: "Stat counter",
    description: "Numbers count up to their value and roll on to the next.",
    keywords: "kpi metrics dashboard cards sparkline trend refresh",
    previewScale: 0.5,
  },
  {
    slug: "leaderboard",
    name: "Leaderboard",
    description: "Players glide past each other to their new ranks.",
    keywords: "ranking scores list reorder sort game standings",
    previewScale: 0.4,
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
