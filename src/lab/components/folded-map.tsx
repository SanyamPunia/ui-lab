"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  motion,
  motionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControlsWithThen,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/cn";

// Panel size when the map unfolds sideways.
const PANEL_W = 128;
const PANEL_H = 320;
// Panel height when it unfolds downward on narrow screens.
const ROW_H = 168;
// Not quite flat: folded panels keep a hair of air between them, like real
// paper, which also stops coplanar faces from z-fighting.
const FOLDED = 178;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
// Unfolding is a staged reveal of large paper panels, so it runs longer than
// UI motion: each panel takes 480ms and starts when the one before it is
// just past halfway, reading as one continuous pull. Folding is the system
// tidying up, so it runs faster and overlaps more.
const UNFOLD = { duration: 0.48, stagger: 0.28 };
const FOLD = { duration: 0.3, stagger: 0.14 };
const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;

type Stop = { time: string; place: string; x: number; y: number };
type Day = { title: string; stops: Stop[] };

// Stops sit on one route drawn across the whole unfolded sheet (512 wide),
// so the line runs unbroken over every crease.
function routePath(points: { x: number; y: number }[]) {
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    // Catmull-Rom to cubic Bezier, so the road bends through each stop.
    d += `C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
  }
  return d;
}

const CONTOURS = [
  "M0 104C60 92 110 118 170 108S290 84 350 100 460 122 512 110",
  "M0 212C70 200 120 226 190 214S300 190 370 206 470 228 512 216",
  "M0 236C50 230 130 250 200 240S330 222 400 236 480 250 512 244",
  "M-10 132C40 150 90 150 120 140",
];

export function FoldedMap({
  title,
  summary,
  days,
  className,
}: {
  title: string;
  summary: string;
  /** Three days fill the sheet: one panel each beside the cover. */
  days: Day[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  // Stays true until the last fold lands, so a narrow layout only gives
  // back its height once the paper is closed.
  const [expanded, setExpanded] = useState(false);
  const [vertical, setVertical] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // 0 is flat, 1 is folded, one per hinge.
  const [hinges] = useState(() => days.map(() => motionValue(1)));
  const running = useRef<AnimationPlaybackControlsWithThen[]>([]);
  const listId = useId();
  const openRef = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      // Squeezed below the full sheet width by max-w-full: unfold downward.
      setVertical(entry.contentRect.width < PANEL_W * (days.length + 1) - 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [days.length]);

  useEffect(() => () => running.current.forEach((c) => c.stop()), []);

  const toggle = () => {
    const next = !open;
    openRef.current = next;
    setOpen(next);
    running.current.forEach((c) => c.stop());
    if (next) setExpanded(true);
    if (reduceMotion) {
      hinges.forEach((h) => h.jump(next ? 0 : 1));
      if (!next) setExpanded(false);
      return;
    }
    const n = hinges.length;
    running.current = hinges.map((h, i) =>
      animate(h, next ? 0 : 1, {
        duration: next ? UNFOLD.duration : FOLD.duration,
        ease: EASE_IN_OUT,
        // Out from the cover in order; back in from the far end.
        delay: next ? i * UNFOLD.stagger : (n - 1 - i) * FOLD.stagger,
      }),
    );
    if (!next) {
      running.current[0]?.then(() => {
        if (!openRef.current) setExpanded(false);
      });
    }
  };

  const panelW = vertical ? undefined : PANEL_W;
  const panelH = vertical ? ROW_H : PANEL_H;

  return (
    <div
      ref={root}
      className={cn(
        "relative w-[512px] max-w-full select-none",
        // Panels tipping toward the viewer grow a little in perspective;
        // on a phone-width column that must not widen the page. The margin
        // keeps the paper's edge shadow.
        vertical && "overflow-x-clip [overflow-clip-margin:6px]",
        className,
      )}
      style={{
        perspective: 1400,
        height: vertical
          ? expanded
            ? ROW_H * (days.length + 1)
            : ROW_H
          : PANEL_H,
      }}
    >
      {/* Edges of the folded panels peeking out behind the cover. */}
      <FoldedEdges
        progress={hinges[0]}
        width={panelW}
        height={panelH}
        vertical={vertical}
      />
      <div
        className="relative"
        style={{
          width: panelW ?? "100%",
          height: panelH,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-0 flex flex-col rounded-[3px] bg-background p-4 shadow-raised dark:bg-surface">
          <MapLines index={0} vertical={vertical} />
          <p className="relative text-xs text-muted">Road trip</p>
          <h3 className="relative mt-1 text-[17px] leading-tight font-semibold text-balance text-foreground">
            {title}
          </h3>
          <p className="relative mt-1 text-[13px] text-muted">{summary}</p>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={toggle}
            className="relative mt-auto flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-medium text-background outline-hidden transition-[scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-none"
          >
            <span className="grid">
              <Label visible={!open}>Unfold</Label>
              <Label visible={open}>Fold</Label>
            </span>
            <span className="relative size-4">
              <SwapIcon visible={!open}>
                <path d={vertical ? "M4 6.5l4 4 4-4" : "M6.5 4l4 4-4 4"} />
              </SwapIcon>
              <SwapIcon visible={open}>
                <path d={vertical ? "M4 9.5l4-4 4 4" : "M9.5 4l-4 4 4 4"} />
              </SwapIcon>
            </span>
          </button>
        </div>
        {/* Folded panels stay out of the tab order and reading order. */}
        <Hinge
          id={listId}
          inert={!open}
          depth={0}
          days={days}
          hinges={hinges}
          parentWorld={null}
          vertical={vertical}
          height={panelH}
        />
      </div>
    </div>
  );
}

function FoldedEdges({
  progress,
  width,
  height,
  vertical,
}: {
  progress: MotionValue<number>;
  width?: number;
  height: number;
  vertical: boolean;
}) {
  // Gone by the time the first panel has swung a quarter of the way.
  const opacity = useTransform(progress, [0.75, 1], [0, 1]);
  return (
    <>
      {[2, 4].map((offset) => (
        <motion.div
          key={offset}
          aria-hidden
          className="absolute top-0 left-0 rounded-[3px] bg-surface inset-ring inset-ring-foreground/10 dark:bg-background"
          style={{
            width: width ?? "100%",
            height,
            opacity,
            x: vertical ? 0 : offset,
            y: vertical ? offset : offset / 2,
          }}
        />
      ))}
    </>
  );
}

function Hinge({
  id,
  inert,
  depth,
  days,
  hinges,
  parentWorld,
  vertical,
  height,
}: {
  id?: string;
  inert?: boolean;
  depth: number;
  days: Day[];
  hinges: MotionValue<number>[];
  parentWorld: MotionValue<number> | null;
  vertical: boolean;
  height: number;
}) {
  const progress = hinges[depth];
  const zero = useMotionValue(0);
  // Accordion folds alternate direction. The first panel tucks behind the
  // cover, so the cover and its button stay on top when folded.
  const sign = depth % 2 === 0 ? 1 : -1;
  const aroundY = useTransform(progress, (p) => p * FOLDED * sign);
  const aroundX = useTransform(progress, (p) => -p * FOLDED * sign);
  // Only |cos| of this is used, so the horizontal angles serve both layouts.
  const world = useTransform(
    [parentWorld ?? zero, aroundY],
    ([a, b]: number[]) => a + b,
  );
  // Lit from the front: a panel turned edge-on catches the least light.
  const shade = useTransform(
    world,
    (a) => (1 - Math.abs(Math.cos((a * Math.PI) / 180))) * 0.35,
  );
  const day = days[depth];
  const last = depth === days.length - 1;

  return (
    <motion.div
      id={id}
      inert={inert}
      role="group"
      aria-label={`Day ${depth + 1}, ${day.title}`}
      className={cn(
        "absolute",
        vertical ? "top-full left-0 w-full" : "top-0 left-full",
      )}
      style={{
        width: vertical ? undefined : PANEL_W,
        height,
        transformStyle: "preserve-3d",
        transformOrigin: vertical ? "50% 0" : "0 50%",
        rotateY: vertical ? zero : aroundY,
        rotateX: vertical ? aroundX : zero,
      }}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[3px] bg-background shadow-raised dark:bg-surface",
        )}
        style={{ backfaceVisibility: "hidden" }}
      >
        <MapLines index={depth + 1} vertical={vertical} stops={day.stops} />
        <DayContent index={depth} day={day} vertical={vertical} />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-foreground dark:bg-background"
          style={{ opacity: shade }}
        />
      </div>
      {/* The blank back of the paper, seen while a panel is past edge-on. */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden rounded-[3px] bg-surface inset-ring inset-ring-foreground/10 dark:bg-background"
        style={{
          backfaceVisibility: "hidden",
          transform: vertical ? "rotateX(180deg)" : "rotateY(180deg)",
        }}
      >
        <motion.div
          className="absolute inset-0 bg-foreground dark:bg-background"
          style={{ opacity: shade }}
        />
      </div>
      {!last && (
        <Hinge
          depth={depth + 1}
          days={days}
          hinges={hinges}
          parentWorld={world}
          vertical={vertical}
          height={height}
        />
      )}
    </motion.div>
  );
}

function DayContent({
  index,
  day,
  vertical,
}: {
  index: number;
  day: Day;
  vertical: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full p-4",
        vertical ? "flex-row gap-4" : "flex-col",
      )}
    >
      <div className={cn(vertical && "w-[38%] shrink-0")}>
        <p className="text-xs text-muted">Day {index + 1}</p>
        <h4 className="mt-1 text-[15px] leading-snug font-medium text-balance text-foreground">
          {day.title}
        </h4>
      </div>
      <ul
        className={cn(
          "flex flex-col gap-2",
          vertical ? "justify-center" : "mt-auto",
        )}
      >
        {day.stops.map((s) => (
          <li key={s.place} className="flex flex-col">
            <span className="font-mono text-xs text-muted tabular-nums">
              {s.time}
            </span>
            <span className="text-sm leading-tight text-foreground">
              {s.place}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Each panel shows its own slice of one continuous sheet of map, so
// contours and the route line up across the creases once unfolded.
function MapLines({
  index,
  vertical,
  stops,
}: {
  index: number;
  vertical: boolean;
  stops?: Stop[];
}) {
  if (vertical) return null;
  return (
    <svg
      aria-hidden
      viewBox={`${index * PANEL_W} 0 ${PANEL_W} ${PANEL_H}`}
      className="pointer-events-none absolute inset-0 size-full"
      fill="none"
    >
      {CONTOURS.map((d) => (
        <path key={d} d={d} className="stroke-foreground/[0.07]" />
      ))}
      {index > 0 && (
        <>
          <path
            d={ROUTE}
            className="stroke-foreground/60"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          {stops?.map((s) => (
            <circle
              key={s.place}
              cx={s.x}
              cy={s.y}
              r={3.5}
              strokeWidth={1.5}
              className="fill-background stroke-foreground dark:fill-surface"
            />
          ))}
        </>
      )}
    </svg>
  );
}

function Label({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden={!visible}
      className={cn(
        "col-start-1 row-start-1 text-center transition-[opacity,filter] duration-200 ease-out",
        !visible && "opacity-0 blur-[4px]",
      )}
    >
      {children}
    </span>
  );
}

function SwapIcon({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      className="absolute inset-0 size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      initial={false}
      animate={
        visible
          ? { scale: 1, opacity: 1, filter: "blur(0px)" }
          : { scale: 0.25, opacity: 0, filter: "blur(4px)" }
      }
      transition={ICON_SWAP}
    >
      {children}
    </motion.svg>
  );
}

const DAYS: Day[] = [
  {
    title: "Porto to Costa Nova",
    stops: [
      { time: "09:00", place: "Ribeira", x: 150, y: 104 },
      { time: "13:30", place: "Aveiro", x: 196, y: 150 },
      { time: "18:00", place: "Costa Nova", x: 238, y: 118 },
    ],
  },
  {
    title: "Coimbra and the coast",
    stops: [
      { time: "10:00", place: "Coimbra", x: 278, y: 156 },
      { time: "15:00", place: "Nazaré", x: 320, y: 106 },
      { time: "19:30", place: "Óbidos", x: 364, y: 142 },
    ],
  },
  {
    title: "Sintra to Lisbon",
    stops: [
      { time: "09:30", place: "Sintra", x: 406, y: 110 },
      { time: "14:00", place: "Cascais", x: 448, y: 158 },
      { time: "18:30", place: "Lisbon", x: 490, y: 126 },
    ],
  },
];

const ROUTE = routePath(DAYS.flatMap((d) => d.stops));

export default function FoldedMapDemo() {
  return (
    <FoldedMap title="Porto to Lisbon" summary="3 days, 412 km" days={DAYS} />
  );
}
