"use client";

import { useId, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string; content: React.ReactNode };
type Custom = { dir: number; reduce: boolean };
type Hover = {
  tab: string | null;
  visible: boolean;
  // Every time the pointer comes back into the list the pill gets a fresh
  // layoutId, so it fades in where you are instead of sliding over from
  // wherever it was when you left.
  session: number;
  entering: boolean;
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// The underline answers "where am I", so it travels at UI speed with no
// bounce. The hover pill only echoes the pointer, so it is quicker still.
const UNDERLINE = { type: "spring", visualDuration: 0.25, bounce: 0 } as const;
const HOVER = { type: "spring", visualDuration: 0.15, bounce: 0 } as const;
const INSTANT = { duration: 0 } as const;

// Enters 8px from the side you moved toward and leaves 6px the other way,
// so the panels read as a strip sliding along with the underline.
const panel = {
  enter: ({ dir, reduce }: Custom) => ({
    opacity: 0,
    x: reduce ? 0 : dir * 8,
    filter: reduce ? "blur(0px)" : "blur(4px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.25, ease: EASE_OUT },
  },
  // Softer and faster than the entrance, so the old panel is gone before
  // the new one draws the eye.
  exit: ({ dir, reduce }: Custom) => ({
    opacity: 0,
    x: reduce ? 0 : dir * -6,
    filter: "blur(0px)",
    transition: { duration: 0.15, ease: EASE_OUT },
  }),
};

/*
 * The lab's segmented control clips an inverted copy of the whole row, so
 * each label recolors exactly as the pill's edge crosses it. An underline is
 * too thin to cover any text, so there is nothing to recolor here, and a
 * shared layoutId is simpler: Motion measures both tabs and morphs between
 * them, so tabs of any width work without offset math.
 */
export function SlidingTabs({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: readonly Tab[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const base = useId();
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [dir, setDir] = useState(1);
  const [hover, setHover] = useState<Hover>({
    tab: null,
    visible: false,
    session: 0,
    entering: false,
  });

  const index = Math.max(
    tabs.findIndex((t) => t.id === value),
    0,
  );
  const active = tabs[index];

  const select = (next: string) => {
    const nextIndex = tabs.findIndex((t) => t.id === next);
    if (nextIndex === index) return;
    setDir(nextIndex > index ? 1 : -1);
    onChange(next);
  };

  const enter = (id: string) =>
    setHover((h) =>
      h.visible
        ? h.tab === id
          ? h
          : { ...h, tab: id, entering: false }
        : { tab: id, visible: true, session: h.session + 1, entering: true },
    );

  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = (id: string) => `${base}-panel-${id}`;
  const custom: Custom = { dir, reduce };

  return (
    <LayoutGroup id={base}>
      <div className={cn("flex flex-col", className)}>
        <div
          role="tablist"
          aria-label={label}
          className="flex gap-0.5 border-b border-border px-0.5"
          onPointerLeave={() =>
            setHover((h) => (h.visible ? { ...h, visible: false } : h))
          }
          onKeyDown={(e) => {
            const target = {
              ArrowRight: index + 1,
              ArrowLeft: index - 1,
              Home: 0,
              End: tabs.length - 1,
            }[e.key];
            if (target === undefined) return;
            e.preventDefault();
            // Automatic activation: arrows select as well as focus, and the
            // underline slides exactly as it does for a click.
            const next = tabs[(target + tabs.length) % tabs.length].id;
            select(next);
            tabRefs.current.get(next)?.focus();
          }}
        >
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                }}
                type="button"
                role="tab"
                id={tabId(tab.id)}
                aria-selected={selected}
                aria-controls={selected ? panelId(tab.id) : undefined}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(tab.id)}
                onPointerEnter={(e) => {
                  if (e.pointerType !== "touch") enter(tab.id);
                }}
                className={cn(
                  "group relative flex h-11 touch-manipulation items-center rounded-lg px-2.5 text-sm font-medium sm:px-4 sm:text-[15px] text-muted outline-hidden transition-[color] duration-150 ease-out select-none hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-foreground",
                  selected && "text-foreground",
                )}
              >
                {hover.tab === tab.id && (
                  <motion.span
                    key={hover.session}
                    layoutId={`hover-${hover.session}`}
                    aria-hidden
                    // 6px in from top and bottom so the pill floats inside the
                    // 44px tab without touching the underline.
                    className="absolute inset-x-0 inset-y-1.5 rounded-md bg-surface"
                    initial={hover.entering ? { opacity: 0 } : false}
                    animate={{ opacity: hover.visible ? 1 : 0 }}
                    transition={{
                      layout: reduce ? INSTANT : HOVER,
                      opacity: {
                        duration: hover.visible ? 0.15 : 0.1,
                        ease: EASE_OUT,
                      },
                    }}
                  />
                )}
                {/* Only the label presses in. Scaling the whole button would
                    skew the box Motion measures for the underline mid-press. */}
                <span className="relative transition-[scale] duration-150 ease-out group-active:scale-[0.96] motion-reduce:transition-none">
                  {tab.label}
                </span>
                {selected && (
                  <motion.span
                    layoutId="underline"
                    aria-hidden
                    // Overlaps the list's 1px border so the two read as one line.
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground"
                    transition={reduce ? INSTANT : UNDERLINE}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Both panels share one grid cell while they cross, so the old one
            never pushes the new one down. */}
        <div className="grid">
          <AnimatePresence initial={false} custom={custom}>
            <motion.div
              key={active.id}
              role="tabpanel"
              id={panelId(active.id)}
              aria-labelledby={tabId(active.id)}
              tabIndex={0}
              custom={custom}
              variants={panel}
              initial="enter"
              animate="center"
              exit="exit"
              className="col-start-1 row-start-1 rounded-lg px-4 pt-5 pb-1 text-[15px] leading-relaxed text-pretty text-muted outline-hidden focus-visible:outline-2 focus-visible:outline-foreground"
            >
              {active.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}

const TABS: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    content: (
      <>
        <span className="text-foreground">3 projects</span> are live. Build
        times are down 12% since last week.
      </>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    content: (
      <>
        <span className="text-foreground">Mira</span> deployed main 4 minutes
        ago. Two previews are still building.
      </>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    content: (
      <>
        Deploys run on every push to{" "}
        <span className="text-foreground">main</span>. Previews expire after 30
        days.
      </>
    ),
  },
  {
    id: "billing",
    label: "Billing",
    content: (
      <>
        You are on the <span className="text-foreground">Pro</span> plan. The
        next invoice lands on October 1.
      </>
    ),
  },
];

export default function SlidingTabsDemo() {
  const [tab, setTab] = useState("overview");
  return (
    // A fixed height keeps the card still when panels of different lengths
    // swap in. 20px radius = the tabs' 8px plus the 12px padding.
    <div className="h-55 w-[min(480px,100%)] rounded-[20px] bg-background p-3 shadow-raised">
      <SlidingTabs label="Project" tabs={TABS} value={tab} onChange={setTab} />
    </div>
  );
}
