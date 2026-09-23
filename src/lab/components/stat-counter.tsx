"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

export type Stat = {
  label: string;
  value: number;
  format: Intl.NumberFormat;
  /** Change against the previous period, as a fraction: 0.12 is +12%. */
  trend: number;
  /** Which direction is good news. Latency going up is not. */
  goodWhen?: "up" | "down";
  series: number[];
};

// Long enough to read as counting, which is the point of the component;
// shorter and the number just blinks to its value. No bounce, so a figure
// never overshoots to a value that isn't true.
const COUNT = { visualDuration: 0.7, bounce: 0 };
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const SPARK_W = 120;
const SPARK_H = 32;
// Cards wipe their sparklines in one after another, 50ms apart.
const STAGGER_MS = 50;

const trendFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export function StatCounter({
  stats,
  className,
}: {
  stats: Stat[];
  className?: string;
}) {
  const ref = useRef<HTMLDListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    // Four across when there's room, two by two on a phone.
    <div className={cn("@container w-[600px] max-w-full", className)}>
      <dl ref={ref} className="grid grid-cols-2 gap-3 @min-[560px]:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} started={inView} index={i} />
        ))}
      </dl>
    </div>
  );
}

function StatCard({ stat, started, index }: { stat: Stat; started: boolean; index: number }) {
  const reduceMotion = useReducedMotion();
  const value = useSpring(0, COUNT);
  // Written straight to the DOM each frame; the card never re-renders
  // while counting.
  const text = useTransform(value, (v) => stat.format.format(v));

  useEffect(() => {
    if (!started) return;
    // Setting the spring again retargets it from wherever it is, so a
    // refresh mid-count carries on smoothly from the old number.
    if (reduceMotion) value.jump(stat.value);
    else value.set(stat.value);
  }, [started, stat.value, reduceMotion, value]);

  const up = stat.trend >= 0;
  const good = up === ((stat.goodWhen ?? "up") === "up");
  const trendText = trendFormat.format(stat.trend);

  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4">
      <dt className="text-sm text-muted">{stat.label}</dt>
      <dd className="flex flex-col gap-3">
        <span className="sr-only">
          {stat.format.format(stat.value)}, {trendText}
        </span>
        <motion.span
          aria-hidden
          className="truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums"
        >
          {text}
        </motion.span>
        <span
          aria-hidden
          className={cn(
            "inline-flex h-6 items-center gap-1 self-start rounded-full bg-background px-2 text-xs font-medium tabular-nums",
            good ? "text-foreground" : "text-danger",
          )}
        >
          <svg
            viewBox="0 0 12 12"
            className={cn(
              "size-3 transition-transform duration-200 motion-reduce:transition-none",
              "ease-[cubic-bezier(0.23,1,0.32,1)]",
              !up && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9.5v-7M3 5.5l3-3 3 3" />
          </svg>
          {/* Remounts when the figure changes, so it fades in from a soft
              blur rather than snapping. */}
          <span
            key={trendText}
            className="transition-[opacity,filter] duration-200 ease-out starting:opacity-0 starting:blur-[4px]"
          >
            {trendText}
          </span>
        </span>
        <Sparkline series={stat.series} started={started} delay={index * STAGGER_MS} />
      </dd>
    </div>
  );
}

function pathFor(series: number[]) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  // 2px inset so the 1.5px line is never clipped at the extremes.
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * SPARK_W;
      const y = 2 + (1 - (v - min) / span) * (SPARK_H - 4);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function Sparkline({
  series,
  started,
  delay,
}: {
  series: number[];
  started: boolean;
  delay: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      className={cn(
        "h-8 w-full overflow-visible text-foreground/60",
        // Wipes in left to right, the direction time runs along the line.
        // 500ms because it plays once, on arrival, alongside the count.
        "transition-[clip-path] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        started ? "[clip-path:inset(-2px)]" : "[clip-path:inset(-2px_100%_-2px_-2px)]",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Same point count every time, so the new line morphs out of the
          old one point by point instead of being redrawn. */}
      <motion.path
        initial={false}
        animate={{ d: pathFor(series) }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const rate = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const ms = new Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "millisecond",
  unitDisplay: "short",
  maximumFractionDigits: 0,
});

// Seeded, so the server and the browser agree on the first render.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const METRICS = [
  { label: "Revenue", format: currency, base: 48210, swing: 0.08, goodWhen: "up" },
  { label: "Users", format: count, base: 12480, swing: 0.06, goodWhen: "up" },
  { label: "Conversion", format: rate, base: 0.0342, swing: 0.07, goodWhen: "up" },
  { label: "Latency", format: ms, base: 184, swing: 0.1, goodWhen: "down" },
] as const;
const POINTS = 12;

// A random walk per metric. Each refresh drops the oldest point and adds a
// new one, so the line reads as time moving on rather than a new chart.
function initialSeries() {
  const random = mulberry32(7);
  return METRICS.map((m) => {
    const out: number[] = [m.base];
    for (let i = 1; i < POINTS; i++) out.unshift(out[0] * (1 + (random() - 0.5) * m.swing));
    return out;
  });
}

function toStats(series: number[][]): Stat[] {
  return METRICS.map((m, i) => {
    const s = series[i];
    const value = s[s.length - 1];
    return {
      label: m.label,
      value,
      format: m.format,
      trend: value / s[s.length - 2] - 1,
      goodWhen: m.goodWhen,
      series: s,
    };
  });
}

export default function StatCounterDemo() {
  const [series, setSeries] = useState(initialSeries);
  const [turns, setTurns] = useState(0);
  const random = useRef(mulberry32(99));

  const refresh = () => {
    setTurns((t) => t + 1);
    setSeries((all) =>
      all.map((s, i) => {
        const last = s[s.length - 1];
        return [...s.slice(1), last * (1 + (random.current() - 0.45) * METRICS[i].swing * 2)];
      }),
    );
  };

  return (
    <div className="flex w-[600px] max-w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-medium text-foreground">Overview</p>
          <p className="text-sm text-muted">Compared with the previous day</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex h-9 touch-manipulation items-center gap-2 rounded-full bg-background px-4 text-sm font-medium text-foreground shadow-raised transition-[scale] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transition-none"
        >
          {/* Half a turn per press, so repeated presses keep spinning the
              same way instead of snapping back. */}
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{ transform: `rotate(${turns * 180}deg)` }}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13.25 8a5.25 5.25 0 0 1-9.4 3.2M2.75 8a5.25 5.25 0 0 1 9.4-3.2" />
            <path d="M12.5 1.75v3h-3M3.5 14.25v-3h3" />
          </svg>
          Refresh
        </button>
      </div>
      <StatCounter stats={toStats(series)} />
      <p className="sr-only" aria-live="polite">
        {turns > 0 ? `Updated ${turns} ${turns === 1 ? "time" : "times"}` : ""}
      </p>
    </div>
  );
}
