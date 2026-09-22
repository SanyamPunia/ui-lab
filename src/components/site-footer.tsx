const LINKS = [
  { label: "xevrion.dev", href: "https://xevrion.dev" },
  { label: "github", href: "https://github.com/xevrion" },
  { label: "x", href: "https://x.com/xevrion_the1" },
];

export function SiteFooter() {
  return (
    <footer className="flex h-14 items-center gap-4 px-4 text-sm sm:px-6">
      {LINKS.map(({ label, href }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-muted transition-[color] duration-150 ease-out hover:text-foreground"
        >
          {label}
          <span aria-hidden className="ml-0.5 text-xs">
            ↗
          </span>
        </a>
      ))}
    </footer>
  );
}
