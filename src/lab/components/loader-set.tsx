"use client";

import { cn } from "@/lib/cn";

// Every loop is plain CSS on transform or opacity, so it runs on the
// compositor and keeps moving even while the main thread is busy loading
// whatever the user is waiting for.
const CSS = `
.loader-spin {
  /* Linear because a spinner has no start or end; any easing would read as
     a stutter once per turn. 700ms a turn is deliberately fast: a quicker
     spinner makes the same wait feel shorter. */
  animation: loader-spin 700ms linear infinite;
}
@keyframes loader-spin { to { rotate: 360deg; } }

.loader-dot {
  /* ease-in-out so each dot swells and settles like breathing. The 160ms
     stagger over a 1s cycle keeps exactly one dot at its peak at a time,
     which reads as a wave moving left to right. */
  animation: loader-dot 1s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.loader-dot:nth-child(2) { animation-delay: 160ms; }
.loader-dot:nth-child(3) { animation-delay: 320ms; }
@keyframes loader-dot {
  0%, 80%, 100% { scale: 0.6; opacity: 0.3; }
  40% { scale: 1; opacity: 1; }
}

.loader-bar {
  /* A segment travelling across the track, so ease-in-out: it gathers
     speed, crosses, and slows into the far edge like a moving object.
     1.4s gives the eye time to follow one full pass. */
  animation: loader-bar 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
/* The segment is 40% of the track, so 250% of itself is the far edge. */
@keyframes loader-bar {
  from { translate: -100% 0; }
  to { translate: 250% 0; }
}

.loader-bone { position: relative; overflow: hidden; }
.loader-bone::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--foreground) 8%, transparent), transparent);
  translate: -100% 0;
  /* Slow and eased, since a skeleton stands in for content and should sit
     quietly behind it. The sweep ends at 70% and rests for the remaining
     30%, so it reads as a gentle pass rather than a constant blur. */
  animation: loader-shimmer 1.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes loader-shimmer { 70%, 100% { translate: 100% 0; } }

/* Reduced motion: nothing travels or turns, but everything still pulses in
   opacity so the tile never looks finished or frozen. */
@keyframes loader-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes loader-dot-fade {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .loader-spin { animation: loader-pulse 1.6s ease-in-out infinite; }
  .loader-dot { animation-name: loader-dot-fade; }
  .loader-bar { animation: loader-pulse 1.6s ease-in-out infinite; translate: none; width: 100%; }
  .loader-bone::after { display: none; }
  .loader-bone { animation: loader-pulse 1.6s ease-in-out infinite; }
}
`;

function Styles() {
  return (
    <style href="loader-set" precedence="default">
      {CSS}
    </style>
  );
}

type LoaderProps = { label?: string; className?: string };

function Status({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={className}>
      <Styles />
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading", className }: LoaderProps) {
  return (
    <Status label={label} className={cn("text-foreground", className)}>
      <svg
        viewBox="0 0 24 24"
        className="loader-spin size-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" className="opacity-15" />
        {/* A quarter of the 56.5px circumference, rounded at both ends. */}
        <circle
          cx="12"
          cy="12"
          r="9"
          strokeLinecap="round"
          strokeDasharray="14 56.5"
        />
      </svg>
    </Status>
  );
}

export function PulseDots({ label = "Loading", className }: LoaderProps) {
  return (
    <Status label={label} className={cn("flex items-center gap-1.5", className)}>
      <span aria-hidden className="loader-dot size-2.5 rounded-full bg-foreground" />
      <span aria-hidden className="loader-dot size-2.5 rounded-full bg-foreground" />
      <span aria-hidden className="loader-dot size-2.5 rounded-full bg-foreground" />
    </Status>
  );
}

export function IndeterminateBar({ label = "Loading", className }: LoaderProps) {
  return (
    <Status
      label={label}
      className={cn("h-1 w-24 overflow-hidden rounded-full bg-foreground/10", className)}
    >
      <span aria-hidden className="loader-bar block h-full w-2/5 rounded-full bg-foreground" />
    </Status>
  );
}

export function SkeletonLines({ label = "Loading", className }: LoaderProps) {
  return (
    <Status label={label} className={cn("flex w-24 flex-col gap-2", className)}>
      <span aria-hidden className="loader-bone h-2.5 w-full rounded-full bg-foreground/10" />
      <span aria-hidden className="loader-bone h-2.5 w-2/3 rounded-full bg-foreground/10" />
    </Status>
  );
}

const TILES = [
  { name: "Spinner", Loader: Spinner, label: "Loading, spinner" },
  { name: "Dots", Loader: PulseDots, label: "Loading, dots" },
  { name: "Progress", Loader: IndeterminateBar, label: "Loading, progress bar" },
  { name: "Skeleton", Loader: SkeletonLines, label: "Loading, skeleton" },
];

export function LoaderSet({ className }: { className?: string }) {
  return (
    // Two by two on a phone, one row once there's room for four tiles.
    <div className={cn("@container w-[min(560px,100%)]", className)}>
      <ul className="grid grid-cols-2 gap-3 @md:grid-cols-4">
        {TILES.map(({ name, Loader, label }) => (
          <li
            key={name}
            className="flex h-36 flex-col items-center rounded-2xl bg-surface"
          >
            <div className="flex flex-1 items-center justify-center">
              <Loader label={label} />
            </div>
            <span className="pb-4 text-sm text-muted">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LoaderSetDemo() {
  return <LoaderSet />;
}
