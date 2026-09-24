"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

// The index's search box answers to "#search": on the index this focuses it
// in place, anywhere else it goes home first.
export const SEARCH_HASH = "#search";
export const SEARCH_EVENT = "lab-search-focus";

const noop = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

export function HeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  // The server can't know the platform, so it says Ctrl until hydrated.
  const mac = useSyncExternalStore(noop, isMac, () => false);

  const open = () => {
    if (pathname === "/") {
      window.dispatchEvent(new Event(SEARCH_EVENT));
    } else {
      router.push(`/${SEARCH_HASH}`);
    }
  };

  // ⌘K / Ctrl K from any page, the shortcut people already try.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      open();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search the lab"
      aria-keyshortcuts="Meta+K Control+K"
      className="group/search flex h-9 items-center gap-2 rounded-full text-[13px] text-muted outline-hidden transition-[scale,color,background-color,box-shadow] duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] max-sm:w-9 max-sm:justify-center max-sm:hover:bg-surface sm:bg-surface sm:pr-1.5 sm:pl-3 sm:shadow-[inset_0_0_0_1px_var(--border)] sm:hover:bg-background"
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      >
        <circle cx="7" cy="7" r="4.25" />
        <path d="m10.25 10.25 3 3" />
      </svg>
      <span className="hidden pr-6 sm:inline">Search</span>
      <kbd className="hidden h-6 items-center rounded-full bg-background px-2 font-sans text-[11px] font-medium text-muted shadow-[inset_0_0_0_1px_var(--border)] sm:flex">
        {mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
