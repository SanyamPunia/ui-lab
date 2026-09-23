"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

// A chip is a small physical thing, so it lands with the faintest settle.
const POP = { type: "spring", visualDuration: 0.25, bounce: 0.15 } as const;
// Exits are quicker than the pop, so removing never holds the eye.
const LEAVE = { duration: 0.15, ease: [0.23, 1, 0.32, 1] } as const;
// No bounce on the slide: the row closing up should read as settled.
const SLIDE = { type: "spring", visualDuration: 0.25, bounce: 0 } as const;

const key = (tag: string) => tag.toLowerCase();

export function TagInput({
  label,
  tags,
  onTagsChange,
  placeholder = "Add a tag",
  className,
}: {
  label: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const id = useId();
  const [draft, setDraft] = useState("");
  // Index of the chip the first Backspace armed; the second one removes it.
  const [armed, setArmed] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chipRefs = useRef(new Map<string, HTMLSpanElement>());
  const shakes = useRef(new Map<string, Animation>());

  useEffect(() => {
    const running = shakes.current;
    return () => running.forEach((a) => a.cancel());
  }, []);

  const nudge = (tag: string) => {
    const el = chipRefs.current.get(key(tag));
    if (!el) return;
    shakes.current.get(key(tag))?.cancel();
    // Motion owns the chip's transform for layout, so the shake runs on an
    // inner span through `translate`, which never fights it. Decaying 4px
    // swings say "already here" without reading as an error.
    const animation = reduceMotion
      ? el.animate({ opacity: [1, 0.4, 1] }, { duration: 300 })
      : el.animate(
          { translate: ["0", "-4px", "4px", "-3px", "2px", "0"] },
          { duration: 300, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        );
    shakes.current.set(key(tag), animation);
  };

  const add = (raw: string[]) => {
    const next = [...tags];
    const added: string[] = [];
    for (const part of raw) {
      const tag = part.trim();
      if (!tag) continue;
      const existing = next.find((t) => key(t) === key(tag));
      if (existing) {
        nudge(existing);
        setAnnouncement(`${existing} is already added`);
        continue;
      }
      next.push(tag);
      added.push(tag);
    }
    if (added.length) {
      onTagsChange(next);
      setAnnouncement(`Added ${added.join(", ")}`);
    }
    setDraft("");
    setArmed(-1);
  };

  const remove = (index: number) => {
    const tag = tags[index];
    onTagsChange(tags.filter((_, i) => i !== index));
    setAnnouncement(`Removed ${tag}`);
    setArmed(-1);
  };

  return (
    <div className={cn("flex w-[min(440px,100%)] flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {/* Clicking the field's empty space types into it, like a real input.
          The field grows downward as chips wrap. */}
      <div
        className="rounded-[14px] bg-surface p-1.5 shadow-raised outline-offset-2 outline-foreground has-[input:focus-visible]:outline-2"
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target !== e.currentTarget && !target.dataset.fill) return;
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <ul
          aria-label={`${label}, ${tags.length} added`}
          data-fill="true"
          className="relative flex flex-wrap gap-1.5"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {tags.map((tag, i) => (
              <motion.li
                key={key(tag)}
                layout="position"
                initial={
                  reduceMotion
                    ? { opacity: 0, scale: 1, filter: "blur(0px)" }
                    : { opacity: 0, scale: 0.9, filter: "blur(4px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  scale: reduceMotion ? 1 : 0.9,
                  filter: reduceMotion ? "blur(0px)" : "blur(2px)",
                  transition: LEAVE,
                }}
                transition={{ ...POP, layout: SLIDE }}
                className="max-w-full"
              >
                <span
                  ref={(el) => {
                    if (el) chipRefs.current.set(key(tag), el);
                    else chipRefs.current.delete(key(tag));
                  }}
                  className={cn(
                    // 8px radius inside 6px padding keeps the 14px field concentric.
                    "flex h-8 max-w-full items-center gap-0.5 rounded-lg pr-1 pl-2.5 text-sm transition-[background-color,color] duration-150 ease-out",
                    armed === i
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground shadow-raised",
                  )}
                >
                  <span className="truncate">{tag}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    // Keeps focus in the input, so typing carries straight on.
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => {
                      remove(i);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      "relative flex size-6 shrink-0 items-center justify-center rounded-md outline-hidden transition-[scale,color,background-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-foreground active:scale-[0.96]",
                      // Grows the hit area to 32px without growing the icon.
                      "after:absolute after:-inset-1",
                      armed === i
                        ? "text-background/70 hover:text-background"
                        : "text-muted hover:bg-foreground/[0.06] hover:text-foreground",
                    )}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    >
                      <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
                    </svg>
                  </button>
                </span>
              </motion.li>
            ))}
            <motion.li
              key="input"
              role="none"
              layout="position"
              transition={{ layout: SLIDE }}
              className="flex min-w-[120px] flex-1"
            >
              <input
                ref={inputRef}
                id={id}
                value={draft}
                placeholder={placeholder}
                autoComplete="off"
                enterKeyHint="enter"
                onChange={(e) => {
                  const value = e.target.value;
                  // Mobile keyboards often never fire a comma keydown.
                  if (value.includes(",")) add(value.split(","));
                  else {
                    setDraft(value);
                    setArmed(-1);
                  }
                }}
                onBlur={() => setArmed(-1)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (!/[,\n]/.test(text)) return;
                  e.preventDefault();
                  add((draft + text).split(/[,\n]/));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    add([draft]);
                  } else if (
                    e.key === "Backspace" &&
                    draft === "" &&
                    tags.length
                  ) {
                    e.preventDefault();
                    const last = tags.length - 1;
                    if (armed === last) remove(last);
                    else setArmed(last);
                  } else if (e.key === "Escape") {
                    setArmed(-1);
                  }
                }}
                className="h-8 w-full min-w-0 bg-transparent px-2 text-sm text-foreground outline-hidden placeholder:text-muted"
              />
            </motion.li>
          </AnimatePresence>
        </ul>
      </div>
      <p className="text-xs text-muted">
        Press Enter or comma to add. Backspace twice removes the last tag.
      </p>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

export default function TagInputDemo() {
  const [tags, setTags] = useState(["motion", "design", "react"]);
  return <TagInput label="Topics" tags={tags} onTagsChange={setTags} />;
}
