"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

// Per-character typing delay: a base plus up to this much jitter, which lands
// around 8 to 14 keys a second, the pace of someone who knows the word.
const TYPE_BASE = 62;
const TYPE_JITTER = 64;
// Held backspace repeats evenly and quickly, so deletion barely varies.
const DELETE_BASE = 30;
const DELETE_JITTER = 14;
// The first letter comes after a beat, as if choosing the next word.
const FIRST_KEY = 140;
// Long enough to read the finished sentence once.
const HOLD = 1800;
// A short breath between clearing one word and starting the next.
const GAP = 320;
// Reduced motion swaps whole words on this interval instead of typing.
const SWAP_EVERY = 2800;

// A macOS-length blink with short fades, rather than a hard on/off flash.
const CSS = `
@keyframes typewriter-caret {
  0%, 45% { opacity: 1; }
  55%, 95% { opacity: 0; }
  100% { opacity: 1; }
}
.typewriter-caret { animation: typewriter-caret 1.06s linear infinite; }
[data-typing="true"] .typewriter-caret { animation: none; }
`;

// Deterministic, and smooth from key to key: a slow wave carries a rhythm
// through the word and a small hash roughens it, so delays vary the way a
// hand does instead of jumping between extremes.
function jitter(word: number, char: number) {
  const wave = Math.sin(char * 1.9 + word * 2.7) * 0.5 + 0.5;
  const n = Math.sin(char * 12.9898 + word * 78.233) * 43758.5453;
  return wave * 0.7 + (n - Math.floor(n)) * 0.3;
}

export function Typewriter({
  prefix,
  words,
  className,
}: {
  prefix: string;
  words: string[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [swapIndex, setSwapIndex] = useState(0);

  // Typing writes straight to the DOM, so a keystroke never re-renders React.
  useEffect(() => {
    if (reduceMotion) return;
    const root = rootRef.current;
    const text = textRef.current;
    if (!root || !text || words.length === 0) return;

    let word = 0;
    let length = words[0].length;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      let delay: number;
      if (deleting) {
        if (length > 0) {
          length--;
          delay = DELETE_BASE + jitter(word, length) * DELETE_JITTER;
        } else {
          deleting = false;
          word = (word + 1) % words.length;
          delay = GAP;
        }
      } else if (length < words[word].length) {
        length++;
        delay =
          length === words[word].length
            ? HOLD
            : TYPE_BASE + jitter(word, length) * TYPE_JITTER;
      } else {
        deleting = true;
        delay = 0;
      }
      if (!deleting && length === 0) delay = GAP + FIRST_KEY;
      text.textContent = words[word].slice(0, length);
      // Solid while keys are moving, blinking while it waits.
      const idle = !deleting && length === words[word].length;
      root.dataset.typing = String(!idle);
      timer = setTimeout(step, delay);
    };

    // Starts on the finished first word, which is also what the server
    // rendered, so nothing flashes empty before hydration.
    root.dataset.typing = "false";
    timer = setTimeout(step, HOLD);
    return () => clearTimeout(timer);
  }, [reduceMotion, words]);

  useEffect(() => {
    if (!reduceMotion || words.length < 2) return;
    const id = setInterval(
      () => setSwapIndex((i) => (i + 1) % words.length),
      SWAP_EVERY,
    );
    return () => clearInterval(id);
  }, [reduceMotion, words.length]);

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  const sentence = `${prefix} ${new Intl.ListFormat("en", {
    type: "disjunction",
  }).format(words)}.`;

  return (
    <span className={cn("inline-grid whitespace-pre", className)}>
      <style href="typewriter" precedence="default">
        {CSS}
      </style>
      <span className="sr-only">{sentence}</span>
      {/* Reserves the widest state, so the line is laid out once and the
          prefix never moves as the word grows to the right. */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {prefix} {longest}
        <Caret />
      </span>
      <span
        ref={rootRef}
        aria-hidden
        data-typing="false"
        className="col-start-1 row-start-1 text-left"
      >
        {prefix}{" "}
        {reduceMotion ? (
          <span className="inline-grid">
            {words.map((w, i) => (
              <span
                key={w}
                // Slower than UI feedback on purpose: nothing was clicked,
                // so a gentle crossfade reads as ambient, not as a response.
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity] duration-500 ease-in-out",
                  i !== swapIndex && "opacity-0",
                )}
              >
                {w}
              </span>
            ))}
          </span>
        ) : (
          <>
            <span ref={textRef}>{words[0]}</span>
            <Caret />
          </>
        )}
      </span>
    </span>
  );
}

function Caret() {
  return (
    <span className="typewriter-caret ml-0.5 inline-block h-[1.1em] w-[2px] rounded-full bg-foreground align-[-0.18em]" />
  );
}

const WORDS = ["right", "fast", "alive", "effortless"];

export default function TypewriterDemo() {
  return (
    <p className="text-xl font-medium tracking-tight text-foreground">
      <Typewriter prefix="Build interfaces that feel" words={WORDS} />
    </p>
  );
}
