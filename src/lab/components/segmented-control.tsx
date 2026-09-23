"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  // Starts true so the pill is placed without sliding in on page load.
  const instant = useRef(true);

  useLayoutEffect(() => {
    const list = listRef.current;
    const overlay = overlayRef.current;
    const tab = tabRefs.current.get(value);
    if (!list || !overlay || !tab) return;

    const measure = () => {
      const top = tab.offsetTop;
      const left = tab.offsetLeft;
      const right = list.clientWidth - left - tab.offsetWidth;
      const bottom = list.clientHeight - top - tab.offsetHeight;
      overlay.dataset.instant = String(instant.current);
      overlay.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 9999px)`;
      overlay.style.visibility = "visible";
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [value]);

  const select = (next: string, fromKeyboard: boolean) => {
    // Keyboard moves happen in quick succession, so they jump instead of slide.
    instant.current = fromKeyboard;
    onChange(next);
  };

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "relative inline-flex rounded-full bg-surface p-1 shadow-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground",
        className,
      )}
      onKeyDown={(e) => {
        const index = options.indexOf(value);
        const target = {
          ArrowRight: index + 1,
          ArrowDown: index + 1,
          ArrowLeft: index - 1,
          ArrowUp: index - 1,
          Home: 0,
          End: options.length - 1,
        }[e.key];
        if (target === undefined) return;
        e.preventDefault();
        const next = options[(target + options.length) % options.length];
        select(next, true);
        tabRefs.current.get(next)?.focus();
      }}
    >
      {options.map((option) => (
        <button
          key={option}
          ref={(el) => {
            if (el) tabRefs.current.set(option, el);
            else tabRefs.current.delete(option);
          }}
          type="button"
          role="radio"
          aria-checked={option === value}
          tabIndex={option === value ? 0 : -1}
          onClick={() => select(option, false)}
          className="flex h-8 items-center rounded-full px-4 text-sm font-medium text-muted transition-[color] duration-150 ease-out outline-hidden hover:text-foreground"
        >
          {option}
        </button>
      ))}

      {/* An inverted copy of the row, clipped to the selected option. Moving
          the clip recolors each label exactly as the pill's edge crosses it. */}
      <div
        ref={overlayRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-0 flex rounded-full bg-foreground p-1 text-background transition-[clip-path] duration-250 ease-[cubic-bezier(0.77,0,0.175,1)] data-[instant=true]:transition-none motion-reduce:transition-none"
      >
        {options.map((option) => (
          <span
            key={option}
            className="flex h-8 items-center px-4 text-sm font-medium"
          >
            {option}
          </span>
        ))}
      </div>
    </div>
  );
}

const RANGES = ["Day", "Week", "Month", "Year"] as const;

export default function SegmentedControlDemo() {
  const [range, setRange] = useState<string>("Week");

  return (
    <SegmentedControl
      label="Range"
      options={RANGES}
      value={range}
      onChange={setRange}
    />
  );
}
