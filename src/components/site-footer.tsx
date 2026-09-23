import { site } from "@/lib/site";
import { Arrow } from "./arrow";
import { SignatureMark } from "./signature-mark";

const LINKS = [
  { label: "xevrion.dev", href: "https://xevrion.dev" },
  { label: "github", href: "https://github.com/xevrion" },
  { label: "x", href: "https://x.com/xevrion_the1" },
  { label: "source", href: site.repo },
];

// Signed, not stamped: the handwritten mark is the footer's one flourish,
// written once when you first reach it.
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 pt-6 pb-10 sm:px-6">
      <div className="flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SignatureMark />
          <p className="mt-3 max-w-xs text-sm text-pretty text-muted">
            Small things I made because I liked how they felt.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group/out inline-flex items-center gap-0.5 rounded-sm text-muted outline-hidden transition-[color] duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {label}
                <Arrow
                  direction="up-right"
                  className="size-3 transition-[translate] duration-150 ease-out group-hover/out:translate-x-0.5 group-hover/out:-translate-y-0.5 motion-reduce:transition-none"
                />
              </a>
            ))}
          </nav>
          <p className="text-xs text-muted tabular-nums">
            © 2026 {site.author.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
