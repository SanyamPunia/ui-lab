"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Slide = { title: string; text: string };

type Drag = {
  id: number;
  startX: number;
  startScroll: number;
  samples: { t: number; x: number }[];
};

const CARD_WIDTH = 280;
const GAP = 16;
// How long a release coasts at its own speed before picking a card. Scaled
// with the card step (296px now, 212px when this was tuned at 200ms) so the
// same flick still travels the same number of cards.
const COAST = 280;

// The scrollLeft that centers each slide, read from layout so it holds for
// any card size or padding. The scroller is positioned, so offsetLeft is
// measured from its own content edge.
function snapTargets(el: HTMLElement) {
  const max = el.scrollWidth - el.clientWidth;
  return Array.from(el.children as HTMLCollectionOf<HTMLElement>, (c) =>
    Math.min(
      max,
      Math.max(0, c.offsetLeft + c.offsetWidth / 2 - el.clientWidth / 2),
    ),
  );
}

// Cards fade and shrink as they leave the center, driven by their own
// position in the scroller rather than JS. The timeline is 'cover', so 50%
// is the moment a card sits dead center. Browsers without scroll-driven
// animations skip the whole block and show every card at full size, which
// is still perfectly readable. Reduced motion keeps the fade, drops the scale.
const CSS = `
@supports (animation-timeline: view()) {
  .snap-carousel-card {
    animation: snap-carousel-focus linear both;
    animation-timeline: view(inline);
  }
  @keyframes snap-carousel-focus {
    0%, 100% { scale: 0.9; opacity: 0.5; }
    50% { scale: 1; opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    @keyframes snap-carousel-focus {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  }
}
`;

export function SnapCarousel({
  slides,
  label = "Carousel",
  className,
}: {
  slides: Slide[];
  label?: string;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // React skips the render when neither edge flag changes, so scrolling
  // costs a couple of reads per frame, not a re-render.
  const sync = () => {
    const el = scrollerRef.current;
    if (!el) return;
    // 1px of slack absorbs fractional scroll positions on scaled displays.
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
  };

  const drag = useRef<Drag | null>(null);
  // Set when a drag moved far enough that the click after it is not a click.
  const suppressClick = useRef(false);
  // Undoes the post-drag state (snap off, pending timers, listeners).
  const settle = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      settle.current?.();
    };
  }, []);

  // Mouse only: touch, pen and trackpads already scroll natively, and
  // handling them here would fight the platform's own momentum.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = e.currentTarget;
    settle.current?.();
    el.setPointerCapture(e.pointerId);
    // Snap would yank the content to the nearest card on every scrollLeft
    // write, so it stays off until the release has picked its own card.
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
    el.dataset.dragging = "";
    suppressClick.current = false;
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      samples: [{ t: e.timeStamp, x: e.clientX }],
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    // Past 4px it is a drag, not a wobbly click.
    if (Math.abs(dx) > 4) suppressClick.current = true;
    e.currentTarget.scrollLeft = d.startScroll - dx;
    d.samples.push({ t: e.timeStamp, x: e.clientX });
    // Only the last 80ms say how fast the hand was moving at release.
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 80) {
      d.samples.shift();
    }
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const el = e.currentTarget;
    delete el.dataset.dragging;

    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const recent = e.timeStamp - last.t < 80;
    // Pixels per ms of content travel. A hand that stopped before letting
    // go has no momentum left to carry.
    const velocity =
      e.type === "pointerup" && recent && last.t > first.t
        ? -(last.x - first.x) / (last.t - first.t)
        : 0;

    const targets = snapTargets(el);
    const nearest = (pos: number) =>
      targets.reduce(
        (best, t, i) =>
          Math.abs(t - pos) < Math.abs(targets[best] - pos) ? i : best,
        0,
      );
    // Coasts at the release speed for a short decay that turns a long fast
    // drag into a card or two of travel, not a runaway spin.
    let index = nearest(el.scrollLeft + velocity * COAST);
    const from = nearest(d.startScroll);
    // A flick faster than 300px/s always moves at least one card, however
    // short it was.
    if (index === from && Math.abs(velocity) > 0.3) {
      index = Math.min(
        targets.length - 1,
        Math.max(0, from + Math.sign(velocity)),
      );
    }

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollTo({
      left: targets[index],
      behavior: reduce ? "instant" : "smooth",
    });

    // Snap comes back only once the smooth scroll has arrived; turning it on
    // mid-flight makes the browser jump straight to the nearest card.
    const restore = () => {
      settle.current = null;
      clearTimeout(fallback);
      el.removeEventListener("scrollend", restore);
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";
    };
    // For browsers without scrollend; a smooth scroll is done well within it.
    const fallback = setTimeout(restore, 700);
    el.addEventListener("scrollend", restore);
    settle.current = restore;
  };

  const step = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Mandatory snapping lands this on the neighbouring card's center, even
    // when a previous smooth scroll is still in flight.
    el.scrollBy({
      left: direction * (CARD_WIDTH + GAP),
      behavior: reduce ? "instant" : "smooth",
    });
  };

  return (
    <div
      className={cn(
        "flex w-[min(520px,100%)] flex-col items-center gap-3",
        className,
      )}
    >
      <style href="snap-carousel" precedence="default">
        {CSS}
      </style>
      {/* The focus ring lives on the wrapper so the edge mask below fades
          only the cards, not the outline. */}
      <div className="w-full rounded-3xl has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground">
        {/* Native scroll-snap, so touch, trackpad momentum and arrow keys all
            behave like the platform. Inline padding of (container - 280px)
            / 2, 120px at full width, lets the first and last cards reach the
            center at any width; 16px of block padding keeps their shadows
            from being clipped. The 32px mask hints there is more past each
            edge. */}
        <div
          ref={scrollerRef}
          onScroll={sync}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClickCapture={(e) => {
            if (!suppressClick.current) return;
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragStart={(e) => e.preventDefault()}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          className="relative flex cursor-grab snap-x snap-mandatory gap-4 data-dragging:cursor-grabbing data-dragging:select-none overflow-x-auto overscroll-x-contain rounded-3xl px-[calc((100%-280px)/2)] py-4 outline-hidden [mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, i) => (
            // Snaps on the outer box and animates the inner one, so the
            // scale never changes what the snap points measure.
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              className="shrink-0 snap-center"
            >
              <div className="snap-carousel-card flex h-[200px] w-[280px] flex-col justify-end gap-1.5 rounded-3xl bg-surface p-6 shadow-raised">
                <p className="text-[15px] font-medium text-foreground">
                  {slide.title}
                </p>
                <p className="text-sm leading-5.5 text-pretty text-muted">
                  {slide.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Arrow
          label="Previous card"
          disabled={atStart}
          onClick={() => step(-1)}
          path="M10 3.5 5.5 8l4.5 4.5"
        />
        <Arrow
          label="Next card"
          disabled={atEnd}
          onClick={() => step(1)}
          path="M6 3.5 10.5 8 6 12.5"
        />
      </div>
    </div>
  );
}

function Arrow({
  label,
  disabled,
  onClick,
  path,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  path: string;
}) {
  return (
    // aria-disabled rather than disabled: a truly disabled button throws
    // focus back to the page the moment the last card arrives.
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={cn(
        "flex size-10 touch-manipulation items-center justify-center rounded-full bg-surface text-foreground shadow-raised outline-hidden transition-[scale,opacity] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-[opacity]",
        disabled ? "cursor-default opacity-40" : "active:scale-[0.96]",
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={path} />
      </svg>
    </button>
  );
}

const SLIDES: Slide[] = [
  { title: "Ease out", text: "Starts fast, settles gently." },
  { title: "Spring", text: "Keeps its velocity when interrupted." },
  { title: "Stagger", text: "Forty milliseconds between each item." },
  { title: "Blur", text: "Bridges two states into one motion." },
  { title: "Origin", text: "Grows from where you pointed." },
  { title: "Restraint", text: "Often the best animation is none." },
];

export default function SnapCarouselDemo() {
  return <SnapCarousel slides={SLIDES} label="Motion principles" />;
}
