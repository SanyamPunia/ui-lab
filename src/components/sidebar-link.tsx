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

  // Arriving on a component keeps its row in view in the list, without
  // moving the list if it's already showing.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-[13px] outline-hidden transition-[color,background-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-foreground",
        active
          ? "bg-surface font-medium text-foreground"
          : "text-muted hover:text-foreground",
      )}
    >
      <span className="truncate">{name}</span>
      {/* The red-pen ink of the "new" mark, shrunk to a dot. */}
      {isNew && (
        <span aria-label="new" className="size-1.5 shrink-0 rounded-full bg-marker" />
      )}
    </Link>
  );
}
