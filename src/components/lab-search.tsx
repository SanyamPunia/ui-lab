"use client";

import { Children, useEffect, useRef, useState } from "react";

type Entry = { name: string; description: string; keywords?: string };

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

// Filters the server-rendered cards it's given rather than rendering its own,
// so the index keeps its static HTML and search only decides what to show.
// Results change instantly: typing is constant, and animating dozens of live
// previews in and out on every keystroke would only slow it down.
export function LabSearch({
  entries,
  children,
}: {
  entries: Entry[];
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cards = Children.toArray(children);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Every word has to appear somewhere, in any order, so "drag card" finds
  // the swipe deck without the exact phrase.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = entries.map(({ name, description, keywords = "" }) => {
    const haystack = `${name} ${description} ${keywords}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  const count = visible.filter(Boolean).length;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p
          className="shrink-0 text-sm text-muted tabular-nums"
          aria-live="polite"
        >
          {words.length
            ? `${count} of ${entries.length}`
            : `${entries.length} components`}
        </p>
        <div className="relative w-full max-w-64">
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.25" />
            <path d="m10.25 10.25 3 3" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              if (query) setQuery("");
              else e.currentTarget.blur();
            }}
            placeholder="Search components"
            aria-label="Search components"
            aria-keyshortcuts="/"
            spellCheck={false}
            autoComplete="off"
            className="h-9 w-full rounded-full bg-surface pr-9 pl-9 text-sm text-foreground shadow-raised outline-hidden placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground [&::-webkit-search-cancel-button]:appearance-none"
          />
          {/* Hidden once typing starts, so it never sits under the text. */}
          {!query && (
            <kbd
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-2.5 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded border border-border px-1 font-mono text-[11px] text-muted"
            >
              /
            </kbd>
          )}
        </div>
      </div>

      {/* grid-cols-1 rather than no template: its minmax(0, 1fr) caps the
          column at the screen, where an implicit column grows to fit the
          widest demo and scrolls the whole page sideways on phones. */}
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.filter((_, i) => visible[i])}
      </ul>

      {count === 0 && (
        <p className="py-16 text-center text-sm text-muted">
          Nothing matches &ldquo;{query.trim()}&rdquo;.
        </p>
      )}
    </>
  );
}
