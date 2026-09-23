import { cn } from "@/lib/cn";

// One drawn arrow for the site's chrome, in place of text glyphs, which
// render at a different weight in every font and sit off the baseline.
const PATHS = {
  "up-right": "M5 11 11 5M6 5h5v5",
  right: "M3.5 8h9M9 4.5 12.5 8 9 11.5",
  left: "M12.5 8h-9M7 4.5 3.5 8 7 11.5",
} as const;

export function Arrow({
  direction,
  className,
}: {
  direction: keyof typeof PATHS;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("inline-block size-3.5 shrink-0", className)}
    >
      <path d={PATHS[direction]} />
    </svg>
  );
}
