"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/cn";

const REST = 40;
const PEAK = 72;
// How far from the cursor, in px, an icon still feels the pull.
const REACH = 140;
// Light mass so the icons keep up with a fast cursor; low damping leaves a
// small settle, which is what makes the dock feel springy rather than scripted.
const SIZE_SPRING = { mass: 0.1, stiffness: 170, damping: 12 };
// The first label waits so a cursor passing through doesn't flash one.
const TOOLTIP_DELAY = 300;

type Item = { label: string; icon: React.ReactNode };
type Tip = { label: string; instant: boolean };

export function Dock({ items }: { items: Item[] }) {
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(Infinity);
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showTip = (label: string) => {
    clearTimeout(timer.current);
    // Once a label is up, moving along the dock swaps it with no delay and no
    // animation, so scanning the icons feels instant.
    if (tip) setTip({ label, instant: true });
    else
      timer.current = setTimeout(
        () => setTip({ label, instant: false }),
        TOOLTIP_DELAY,
      );
  };

  const hideTip = () => {
    clearTimeout(timer.current);
    setTip(null);
  };

  return (
    <nav
      aria-label="Dock"
      className="flex h-16 items-end gap-2 rounded-full bg-surface px-3 pb-3 shadow-raised"
      onPointerMove={(e) => {
        if (reduceMotion || e.pointerType === "touch") return;
        mouseX.set(e.clientX);
      }}
      onPointerLeave={() => {
        mouseX.set(Infinity);
        hideTip();
      }}
    >
      {items.map((item) => (
        <DockItem
          key={item.label}
          item={item}
          mouseX={mouseX}
          tip={tip?.label === item.label ? tip : null}
          onEnter={() => showTip(item.label)}
          onFocus={() => setTip({ label: item.label, instant: false })}
          onBlur={hideTip}
        />
      ))}
    </nav>
  );
}

function DockItem({
  item,
  mouseX,
  tip,
  onEnter,
  onFocus,
  onBlur,
}: {
  item: Item;
  mouseX: MotionValue<number>;
  tip: Tip | null;
  onEnter: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (x) => {
    const box = ref.current?.getBoundingClientRect();
    return box ? x - box.left - box.width / 2 : Infinity;
  });
  const target = useTransform(distance, [-REACH, 0, REACH], [REST, PEAK, REST]);
  const size = useSpring(target, SIZE_SPRING);
  const iconSize = useTransform(size, (s) => s * 0.45);

  // Width and height animate instead of scale on purpose: the neighbours have
  // to move apart, and a transform would let the icons overlap instead.
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={item.label}
      style={{ width: size, height: size }}
      className="relative flex shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-raised outline-none transition-[scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96]"
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") onEnter();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <motion.svg
        viewBox="0 0 24 24"
        style={{ width: iconSize, height: iconSize }}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {item.icon}
      </motion.svg>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background transition-[opacity,translate] duration-150 ease-out",
          tip ? "opacity-100" : "translate-y-1 opacity-0",
          tip?.instant && "transition-none",
        )}
      >
        {item.label}
      </span>
    </motion.button>
  );
}

const ITEMS: Item[] = [
  {
    label: "Home",
    icon: <path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1H15v-5.5H9V20H4.5a1 1 0 0 1-1-1Z" />,
  },
  {
    label: "Search",
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.35-4.35" />
      </>
    ),
  },
  {
    label: "Mail",
    icon: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
  },
  {
    label: "Calendar",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    label: "Music",
    icon: (
      <>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </>
    ),
  },
  {
    label: "Settings",
    icon: (
      <>
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
  },
];

export default function DockDemo() {
  return <Dock items={ITEMS} />;
}
