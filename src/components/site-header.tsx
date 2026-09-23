import Link from "next/link";
import { SidebarNav } from "./lab-sidebar";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

// Sticks to the top of the page column, with a hairline under it matching
// the sidebar's brand row, so the two read as one frame.
export function SiteHeader({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        <MobileNav>
          <SidebarNav />
        </MobileNav>
        <Link
          href="/"
          // The index restores its own scroll position, so Next shouldn't
          // jump to the top first.
          scroll={false}
          className={
            title
              ? "shrink-0 text-muted transition-[color] duration-150 ease-out hover:text-foreground"
              : "font-medium"
          }
        >
          {/* On wide screens the sidebar already carries the name. */}
          <span className="lg:hidden">ui lab</span>
          <span className="hidden lg:inline">Lab</span>
        </Link>
        {title && (
          <>
            <span aria-hidden className="text-border">
              /
            </span>
            <span className="truncate font-medium">{title}</span>
          </>
        )}
      </nav>
      <ThemeToggle />
    </header>
  );
}
