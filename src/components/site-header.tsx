import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ title }: { title?: string }) {
  return (
    <header className="flex h-14 items-center justify-between px-4 sm:px-6">
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/"
          // The index restores its own scroll position, so Next shouldn't
          // jump to the top first.
          scroll={false}
          className={
            title
              ? "text-muted transition-[color] duration-150 ease-out hover:text-foreground"
              : "font-medium"
          }
        >
          Lab
        </Link>
        {title && (
          <>
            <span aria-hidden className="text-border">
              /
            </span>
            {/* The page's heading, sized to sit in the breadcrumb. */}
            <h1 className="font-medium">{title}</h1>
          </>
        )}
      </nav>
      <ThemeToggle />
    </header>
  );
}
