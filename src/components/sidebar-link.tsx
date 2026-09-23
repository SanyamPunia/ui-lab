"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function SidebarLink({
  slug,
  name,
  isNew,
}: {
  slug: string;
  name: string;
  isNew?: boolean;
}) {
  const href = `/lab/${slug}`;
  const active = usePathname() === href;
  const ref = useRef<HTMLAnchorElement>(null);

  // Arriving on a component brings its row to the middle of the list, clear
  // of the fades at either end. Only the list scrolls, never the page.
  useEffect(() => {
    const el = ref.current;
    const list = el?.closest("nav");
    if (!active || !el || !list) return;
    const top = el.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2;
    if (el.offsetTop < list.scrollTop + 40 || el.offsetTop > list.scrollTop + list.clientHeight - 80)
      list.scrollTo({ top });
  }, [active]);

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] outline-hidden transition-[color,background-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-foreground",
        active
          ? "bg-surface font-medium text-foreground"
          : "text-muted hover:bg-surface/60 hover:text-foreground",
      )}
    >
      {/* A short bar marks where you are, like a finger on the page. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-foreground transition-[opacity,scale] duration-200 ease-out",
          active ? "scale-y-100 opacity-100" : "scale-y-50 opacity-0",
        )}
      />
      <span className="truncate">{name}</span>
      {/* The red-pen ink of the "new" mark, shrunk to a dot. */}
      {isNew && (
        <span aria-label="new" className="size-1.5 shrink-0 rounded-full bg-marker" />
      )}
    </Link>
  );
}
