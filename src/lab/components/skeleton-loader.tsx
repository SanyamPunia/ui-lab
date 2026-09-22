"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Profile = {
  initials: string;
  name: string;
  handle: string;
  bio: string;
  stat: string;
  statLabel: string;
  // Seven days of activity, 0 to 1.
  week: number[];
};

// Enough gap between blocks to read as a sequence, short enough that the
// last block lands only 80ms after the first.
const STAGGER = 40;

// The highlight is barely lighter than the bone and crawls across it, then
// rests for the last 30% of each loop so it reads as calm, not busy. It only
// runs while the card is busy, so a loaded card costs nothing.
const CSS = `
.skeleton-bone {
  position: relative;
  overflow: hidden;
  background: color-mix(in oklab, var(--foreground) 7%, transparent);
}
[aria-busy="true"] .skeleton-bone::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--foreground) 6%, transparent), transparent);
  translate: -100% 0;
  animation: skeleton-shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes skeleton-shimmer {
  70%, 100% { translate: 100% 0; }
}
@media (prefers-reduced-motion: reduce) {
  [aria-busy="true"] .skeleton-bone::after { animation: none; display: none; }
}
`;

export function ProfileCard({
  profile,
  loading,
  className,
}: {
  profile: Profile;
  loading: boolean;
  className?: string;
}) {
  const loaded = !loading;
  return (
    // 24px radius around 16px padding leaves 8px for the inner stat block.
    <div
      aria-busy={loading}
      className={cn(
        "flex w-72 flex-col gap-3 rounded-3xl bg-surface p-4 shadow-raised",
        className,
      )}
    >
      <style href="skeleton-loader" precedence="default">
        {CSS}
      </style>
      {loading && <span className="sr-only">Loading profile</span>}

      {/* Every skeleton below is sized to the exact box its real content
          fills: a 40px avatar, 20px and 16px line boxes with a shorter bar
          centered in each (like the x-height of text), a 40px two-line
          paragraph and a 56px stat block. Skeleton and content share one grid
          cell, so if the two ever disagreed the card would jump when data
          arrives. Matching them is the whole trick. */}
      <Block
        index={0}
        loaded={loaded}
        skeleton={
          <div className="flex items-center gap-3">
            <div className="skeleton-bone size-10 shrink-0 rounded-full" />
            <div className="flex flex-col">
              <div className="flex h-5 items-center">
                <div className="skeleton-bone h-3 w-24 rounded-full" />
              </div>
              <div className="flex h-4 items-center">
                <div className="skeleton-bone h-2.5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-medium text-foreground">
            {profile.initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm leading-5 font-medium text-foreground">
              {profile.name}
            </p>
            <p className="truncate text-xs leading-4 text-muted">
              {profile.handle}
            </p>
          </div>
        </div>
      </Block>

      <Block
        index={1}
        loaded={loaded}
        skeleton={
          <div className="flex flex-col">
            <div className="flex h-5 items-center">
              <div className="skeleton-bone h-3 w-full rounded-full" />
            </div>
            <div className="flex h-5 items-center">
              <div className="skeleton-bone h-3 w-2/3 rounded-full" />
            </div>
          </div>
        }
      >
        {/* Clamped to the two lines the skeleton promised. */}
        <p className="line-clamp-2 h-10 text-sm leading-5 text-pretty text-foreground">
          {profile.bio}
        </p>
      </Block>

      <Block
        index={2}
        loaded={loaded}
        skeleton={<div className="skeleton-bone h-14 rounded-lg" />}
      >
        <div className="flex h-14 items-center justify-between rounded-lg bg-background px-3">
          <div className="flex flex-col">
            <span className="text-base leading-6 font-medium text-foreground tabular-nums">
              {profile.stat}
            </span>
            <span className="text-xs leading-4 text-muted">
              {profile.statLabel}
            </span>
          </div>
          <div aria-hidden className="flex h-6 items-end gap-1">
            {profile.week.map((v, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 rounded-full",
                  i === profile.week.length - 1
                    ? "bg-foreground"
                    : "bg-foreground/20",
                )}
                style={{ height: `${Math.max(v, 0.15) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </Block>
    </div>
  );
}

function Block({
  index,
  loaded,
  skeleton,
  children,
}: {
  index: number;
  loaded: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  const delay = `${index * STAGGER}ms`;
  return (
    <div className="grid">
      {/* Fades out under the arriving content. Coming back on reload it
          appears at once: the old content is already gone, and a slow fade
          would leave a blank card for a beat. */}
      <div
        aria-hidden
        className={cn(
          "col-start-1 row-start-1 transition-[opacity] ease-out",
          loaded ? "opacity-0 duration-150" : "duration-0",
        )}
        style={{ transitionDelay: loaded ? delay : "0ms" }}
      >
        {skeleton}
      </div>
      {/* Mounts with the data and transitions from its @starting-style, so
          no effect or extra render is needed to trigger the entrance.
          Reduced motion keeps only the opacity. */}
      {loaded && (
        <div
          className="col-start-1 row-start-1 transition-[opacity,filter,translate] duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)] starting:opacity-0 motion-safe:starting:translate-y-0.5 motion-safe:starting:blur-[4px]"
          style={{ transitionDelay: delay }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const PROFILE: Profile = {
  initials: "AL",
  name: "Ada Lindqvist",
  handle: "@ada.builds",
  bio: "Design engineer. Tuning springs and easing curves until the interface stops getting in the way.",
  stat: "2,481",
  statLabel: "Stars this week",
  week: [0.35, 0.5, 0.3, 0.65, 0.55, 0.8, 1],
};

// Long enough for the shimmer to make one full pass, short enough that the
// demo never feels like it is actually waiting on something.
const LOAD_TIME = 1200;

export default function SkeletonLoaderDemo() {
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timer.current = setTimeout(() => setLoading(false), LOAD_TIME);
    return () => clearTimeout(timer.current);
  }, []);

  const reload = () => {
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), LOAD_TIME);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <ProfileCard profile={PROFILE} loading={loading} />
      <button
        type="button"
        onClick={reload}
        className="flex h-8 touch-manipulation items-center gap-1.5 rounded-full bg-surface pr-3.5 pl-3 text-sm font-medium text-foreground shadow-raised outline-none transition-[scale] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-none"
      >
        <svg
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M13.25 8a5.25 5.25 0 1 1-1.54-3.71" />
          <path d="M13.25 2.75v2.5h-2.5" />
        </svg>
        Reload
      </button>
    </div>
  );
}
