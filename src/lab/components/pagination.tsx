"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/cn";

// Movement across the row: critically damped, so nothing overshoots its slot.
const SLIDE = { type: "spring", duration: 0.3, bounce: 0 } as const;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type Slot = number | "start-gap" | "end-gap";

// Always seven slots once there are more than seven pages, so the control
// keeps one width and the arrows never move while you page through.
function slots(page: number, total: number): Slot[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "end-gap", total];
  if (page >= total - 3)
    return [1, "start-gap", ...Array.from({ length: 5 }, (_, i) => total - 4 + i)];
  return [1, "start-gap", page - 1, page, page + 1, "end-gap", total];
}

// The number you click never moves: the window rebuilds around its slot.
// Null when no valid seven-slot layout puts it there (near the ends).
function slotsAt(page: number, total: number, index: number): Slot[] | null {
  if (total <= 7) return null;
  const head: Slot[] = [1, 2, 3, 4, 5, "end-gap", total];
  if (head[index] === page) return head;
  const tail: Slot[] = [1, "start-gap", ...Array.from({ length: 5 }, (_, i) => total - 4 + i)];
  if (tail[index] === page) return tail;
  // A middle window starts at 4 or later and ends by total - 3, so each gap
  // hides at least two pages.
  const start = page - (index - 2);
  if (index >= 2 && index <= 4 && start >= 4 && start <= total - 5)
    return [1, "start-gap", start, start + 1, start + 2, "end-gap", total];
  return null;
}

const control =
  "relative flex size-9 touch-manipulation items-center justify-center rounded-full text-sm font-medium tabular-nums outline-none transition-[scale,color,background-color] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:size-10 motion-reduce:transition-[color,background-color]";

export function Pagination({
  page,
  total,
  onPageChange,
  label = "Pagination",
  className,
}: {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const listRef = useRef<HTMLUListElement>(null);
  // Set by arrow keys, so focus follows the page only when the keyboard moved it.
  const focusCurrent = useRef(false);
  // Where the last clicked number sat. Arrows and keys clear it, so they get
  // the standard centred window.
  const [anchor, setAnchor] = useState<{ page: number; index: number } | null>(
    null,
  );
  const visible =
    (anchor?.page === page && slotsAt(page, total, anchor.index)) ||
    slots(page, total);

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), total);
    if (clamped !== page) onPageChange(clamped);
  };

  useEffect(() => {
    if (!focusCurrent.current) return;
    focusCurrent.current = false;
    listRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.focus();
  }, [page]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = {
      ArrowLeft: page - 1,
      ArrowRight: page + 1,
      Home: 1,
      End: total,
    }[e.key];
    if (target === undefined) return;
    e.preventDefault();
    focusCurrent.current = true;
    setAnchor(null);
    go(target);
  };

  const atStart = page <= 1;
  const atEnd = page >= total;

  return (
    <nav aria-label={label} className={cn("flex justify-center", className)}>
      <ul
        ref={listRef}
        onKeyDown={onKeyDown}
        className="relative flex items-center gap-0.5 sm:gap-1"
      >
        <li>
          {/* aria-disabled rather than disabled, so a focused arrow keeps
              focus when it reaches the end instead of dropping it to the page. */}
          <button
            type="button"
            aria-label="Previous page"
            aria-disabled={atStart}
            onClick={() => {
              setAnchor(null);
              go(page - 1);
            }}
            className={cn(
              control,
              atStart
                ? "cursor-not-allowed text-muted opacity-40"
                : "text-foreground hover:bg-surface active:scale-[0.96]",
            )}
          >
            <Chevron direction="left" />
          </button>
        </li>

        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((slot, index) => (
            <motion.li
              key={slot}
              layout="position"
              transition={SLIDE}
              initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              // Quicker than the entrance: the leaving number shouldn't hold
              // the eye while the row settles.
              exit={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
                transition: { duration: 0.15, ease: EASE_OUT },
              }}
              className="flex"
            >
              {typeof slot === "number" ? (
                <button
                  type="button"
                  aria-label={`Page ${slot}`}
                  aria-current={slot === page ? "page" : undefined}
                  onClick={() => {
                    setAnchor({ page: slot, index });
                    go(slot);
                  }}
                  className={cn(
                    control,
                    slot === page
                      ? "text-background"
                      : "text-muted hover:bg-surface hover:text-foreground active:scale-[0.96]",
                  )}
                >
                  {slot === page && (
                    <motion.span
                      layoutId={`${id}-pill`}
                      transition={SLIDE}
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-foreground"
                    />
                  )}
                  <span className="relative">{slot}</span>
                </button>
              ) : (
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center text-sm text-muted select-none sm:size-10"
                >
                  …
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>

        <li>
          <button
            type="button"
            aria-label="Next page"
            aria-disabled={atEnd}
            onClick={() => {
              setAnchor(null);
              go(page + 1);
            }}
            className={cn(
              control,
              atEnd
                ? "cursor-not-allowed text-muted opacity-40"
                : "text-foreground hover:bg-surface active:scale-[0.96]",
            )}
          >
            <Chevron direction="right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      // 1.5 matches the medium-weight numbers beside it.
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={direction === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "m6 3.5 4.5 4.5L6 12.5"} />
    </svg>
  );
}

const PER_PAGE = 5;
const TOTAL_ITEMS = 100;
const CUSTOMERS = [
  "Acme Studio",
  "Birchwood Labs",
  "Cobalt & Co",
  "Driftline",
  "Evergreen Health",
  "Fieldnote",
  "Granite Works",
  "Harbor Supply",
  "Ironbark",
  "Juniper Books",
  "Kestrel Air",
];

function invoice(n: number) {
  // Deterministic pseudo-random amounts, so the server and client agree.
  const cents = ((n * 7919) % 90000) + 4000;
  return {
    id: `INV-${1000 + n}`,
    customer: CUSTOMERS[(n * 7) % CUSTOMERS.length],
    amount: `$${(cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`,
  };
}

export default function PaginationDemo() {
  const reduceMotion = useReducedMotion();
  const pages = TOTAL_ITEMS / PER_PAGE;
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(1);

  const first = (page - 1) * PER_PAGE + 1;
  const last = Math.min(page * PER_PAGE, TOTAL_ITEMS);
  // Pages slide a hair in the direction of travel; reduced motion keeps
  // only the fade.
  const shift = reduceMotion ? 0 : 8;

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-[min(480px,100%)]">
        <div className="rounded-2xl bg-background p-2 shadow-raised">
          <p
            aria-live="polite"
            className="px-3 pt-1.5 pb-2 text-sm text-muted tabular-nums"
          >
            Showing {first}-{last} of {TOTAL_ITEMS}
          </p>
          {/* Every page stacks in one grid cell, so the outgoing rows fade
              out in place while the new ones fade in over them. */}
          <div className="grid">
            <AnimatePresence initial={false} custom={direction}>
              <motion.ul
                key={page}
                custom={direction}
                variants={{
                  enter: (d: number) => ({
                    opacity: 0,
                    x: d * shift,
                    filter: reduceMotion ? "blur(0px)" : "blur(4px)",
                  }),
                  center: {
                    opacity: 1,
                    x: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.2, ease: EASE_OUT },
                  },
                  // Half the travel and quicker, so the old page gets out of
                  // the way rather than competing with the new one.
                  exit: (d: number) => ({
                    opacity: 0,
                    x: (-d * shift) / 2,
                    transition: { duration: 0.12, ease: EASE_OUT },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                className="col-start-1 row-start-1"
              >
                {Array.from({ length: last - first + 1 }, (_, i) => {
                  const item = invoice(first + i);
                  return (
                    <li
                      key={item.id}
                      className="flex h-12 items-center gap-3 rounded-xl px-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
                        {item.customer}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {item.id}
                      </span>
                      <span className="w-20 text-right text-[15px] text-foreground tabular-nums">
                        {item.amount}
                      </span>
                    </li>
                  );
                })}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>

        <Pagination
          page={page}
          total={pages}
          onPageChange={(next) => {
            setDirection(next > page ? 1 : -1);
            setPage(next);
          }}
          label="Invoices pages"
          className="mt-4"
        />
      </div>
    </MotionConfig>
  );
}
