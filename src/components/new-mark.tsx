import { cn } from "@/lib/cn";

// A quiet tag in the same pill shape as the filter chips, with the sidebar's
// red dot as the one signal for "new", so a grid full of them stays calm.
// It's static on purpose: a dozen marks drawing themselves at once pulled
// the eye away from the demos.
export function NewMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full bg-surface px-1.5 align-middle text-[11px] leading-none font-medium text-muted shadow-[inset_0_0_0_1px_var(--border)]",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-marker" />
      New
    </span>
  );
}
