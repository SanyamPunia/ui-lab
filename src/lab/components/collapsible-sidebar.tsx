"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type Item = { id: string; label: string; icon: React.ReactNode };

const EXPANDED = 240;
// 40px items plus 8px padding each side, so a collapsed icon sits dead
// center in the rail.
const COLLAPSED = 56;
// Item row height plus the 2px gap between rows, for placing the tooltip.
const ROW = 34;
// No bounce: an overshooting sidebar would shove the content back and
// forth. 0.3s is the most a panel this size can take and still feel direct.
const WIDTH = { type: "spring", visualDuration: 0.3, bounce: 0 } as const;
const HIGHLIGHT = { type: "spring", visualDuration: 0.25, bounce: 0 } as const;
const INSTANT = { duration: 0 } as const;
// Long enough that sweeping the pointer across the rail doesn't flash
// tooltips, short enough to feel like the rail is answering.
const TOOLTIP_DELAY = 400;

export function CollapsibleSidebar({
  items,
  value,
  onChange,
  expanded,
  onExpandedChange,
  children,
  className,
}: {
  items: readonly Item[];
  value: string;
  onChange: (id: string) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const base = useId();
  const navId = `${base}-nav`;
  const [tip, setTip] = useState<{ index: number; open: boolean }>({
    index: 0,
    open: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const hideTip = () => {
    clearTimeout(timer.current);
    setTip((t) => (t.open ? { ...t, open: false } : t));
  };

  // The first tooltip waits; once one is open, moving to a neighbour
  // swaps it instantly, so scanning the rail stays fast.
  const showTip = (index: number, immediate: boolean) => {
    if (expanded) return;
    clearTimeout(timer.current);
    if (immediate || tip.open) setTip({ index, open: true });
    else
      timer.current = setTimeout(
        () => setTip({ index, open: true }),
        TOOLTIP_DELAY,
      );
  };

  const toggle = () => {
    hideTip();
    onExpandedChange(!expanded);
  };

  return (
    <LayoutGroup id={base}>
      <div
        className={cn(
          "relative flex overflow-hidden rounded-2xl bg-background shadow-raised",
          className,
        )}
      >
        {/* Width, not scale: scaling the rail would squash every icon and
            label inside it, and this is what pushes the content along. */}
        <motion.nav
          id={navId}
          aria-label="Main"
          initial={false}
          animate={{ width: expanded ? EXPANDED : COLLAPSED }}
          transition={reduce ? INSTANT : WIDTH}
          className="shrink-0 overflow-hidden border-r border-border"
          onPointerLeave={hideTip}
        >
          <ul className="flex flex-col gap-0.5 p-2">
            {items.map((item, i) => {
              const current = item.id === value;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={current ? "page" : undefined}
                    onClick={() => onChange(item.id)}
                    onPointerEnter={(e) => {
                      if (e.pointerType !== "touch") showTip(i, false);
                    }}
                    onFocus={(e) => {
                      if (e.currentTarget.matches(":focus-visible"))
                        showTip(i, true);
                    }}
                    onBlur={hideTip}
                    className={cn(
                      "group relative flex h-8 w-full touch-manipulation items-center gap-3 rounded-lg pl-3 text-sm font-medium whitespace-nowrap text-muted outline-none transition-[color] duration-150 ease-out select-none hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground",
                      current && "text-foreground",
                    )}
                  >
                    {current && (
                      <motion.span
                        layoutId="active"
                        // Only a change of item moves it. Without this, the
                        // re-render that starts a collapse would try to
                        // morph it too, fighting the width spring.
                        layoutDependency={value}
                        aria-hidden
                        className="absolute inset-0 rounded-lg bg-surface"
                        transition={reduce ? INSTANT : HIGHLIGHT}
                      />
                    )}
                    {/* Presses in on its own, so the 16px icon never moves
                        relative to the rail it is centered in. */}
                    <span className="relative size-4 shrink-0 transition-[scale] duration-150 ease-out group-active:scale-[0.96] motion-reduce:transition-none">
                      {item.icon}
                    </span>
                    {/* Collapsing, the label is gone in 100ms, well before
                        the shrinking edge reaches it, so it is never seen
                        being clipped. Expanding, it waits 120ms for the rail
                        to open most of the way, then sharpens in. The
                        timing follows whether the label is showing. */}
                    <span
                      className={cn(
                        "relative transition-[opacity,filter] ease-out",
                        expanded
                          ? "opacity-100 blur-[0px] delay-120 duration-200"
                          : "opacity-0 blur-[4px] duration-100",
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.nav>

        {/* Sits outside the nav so its overflow can't clip it. Enters in
            125ms and leaves in 100ms; moving between items only moves it. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-10 flex h-7 origin-left items-center rounded-md bg-foreground px-2 text-xs font-medium whitespace-nowrap text-background",
            "transition-[opacity,scale,translate] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[opacity]",
            tip.open && !expanded
              ? "translate-x-0 scale-100 opacity-100 duration-125"
              : "-translate-x-1 scale-[0.97] opacity-0 duration-100 motion-reduce:translate-x-0 motion-reduce:scale-100",
          )}
          // 8px of breathing room right of the rail, and 2px down so the
          // 28px tip centers on the 32px row below the 8px padding.
          style={{ left: COLLAPSED + 8, top: 8 + 2 + tip.index * ROW }}
        >
          {items[tip.index]?.label}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center gap-2 px-2">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={navId}
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
              onClick={toggle}
              className="relative flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-lg text-muted outline-none transition-[scale,color,background-color] duration-150 ease-out hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-[color,background-color]"
            >
              <svg className="size-4" {...STROKE} aria-hidden>
                <rect x="2.25" y="2.75" width="11.5" height="10.5" rx="2" />
                <path d="M6.25 2.75v10.5" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </LayoutGroup>
  );
}

const STROKE = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ITEMS: Item[] = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg className="size-4" {...STROKE} aria-hidden>
        <path d="M2.75 7 8 2.75 13.25 7v5.25a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1Z" />
        <path d="M6.25 13.25V9.75h3.5v3.5" />
      </svg>
    ),
  },
  {
    id: "inbox",
    label: "Inbox",
    icon: (
      <svg className="size-4" {...STROKE} aria-hidden>
        <path d="M2.75 9.25 4.5 3.5a1 1 0 0 1 1-.75h5a1 1 0 0 1 1 .75l1.75 5.75v3a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1Z" />
        <path d="M2.75 9.25h3l.75 1.5h3l.75-1.5h3" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: (
      <svg className="size-4" {...STROKE} aria-hidden>
        <path d="M2.75 4.25a1 1 0 0 1 1-1h2.5l1.5 1.5h4.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1Z" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg className="size-4" {...STROKE} aria-hidden>
        <path d="M3.25 13.25V8.75M8 13.25v-10.5M12.75 13.25v-6.5" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="size-4" {...STROKE} aria-hidden>
        <circle cx="8" cy="8" r="2" />
        <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05" />
      </svg>
    ),
  },
];

export default function CollapsibleSidebarDemo() {
  const [value, setValue] = useState("home");
  const [expanded, setExpanded] = useState(true);
  const current = ITEMS.find((item) => item.id === value) ?? ITEMS[0];

  return (
    <CollapsibleSidebar
      items={ITEMS}
      value={value}
      onChange={setValue}
      expanded={expanded}
      onExpandedChange={setExpanded}
      // 184px fits the five rows and their padding with no scroll.
      className="h-46 w-80"
    >
      {/* Fixed-width content, left aligned, so it slides with the rail's
          edge instead of rewrapping on every frame. */}
      <div className="flex flex-col gap-2 px-3 pt-1">
        <p className="text-sm font-medium whitespace-nowrap text-foreground">
          {current.label}
        </p>
        <div className="h-2 w-40 shrink-0 rounded-full bg-foreground/10" />
        <div className="h-2 w-32 shrink-0 rounded-full bg-foreground/10" />
        <div className="h-2 w-36 shrink-0 rounded-full bg-foreground/10" />
        <div className="mt-2 h-10 w-44 shrink-0 rounded-lg bg-surface" />
      </div>
    </CollapsibleSidebar>
  );
}
