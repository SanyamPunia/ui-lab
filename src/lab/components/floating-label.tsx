"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type Status = "idle" | "error" | "valid";

const ICON_SWAP = { type: "spring", duration: 0.3, bounce: 0 } as const;

export function FloatingLabel({
  label,
  type = "text",
  name,
  autoComplete,
  defaultValue,
  validate,
  onValueChange,
  className,
}: {
  label: string;
  type?: "text" | "email" | "tel" | "url";
  name?: string;
  autoComplete?: string;
  defaultValue?: string;
  // Returns an error message, or null when the value is fine.
  validate?: (value: string) => string | null;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");
  // Kept after the error clears so the message never empties while its row
  // is still collapsing.
  const [message, setMessage] = useState("");
  // Validation starts on blur and only follows every keystroke once the
  // user has seen an error, so nobody is scolded for a half-typed address.
  const [live, setLive] = useState(false);

  const check = (value: string) => {
    const error = validate?.(value) ?? null;
    if (error) setMessage(error);
    setStatus(error ? "error" : "valid");
    return error;
  };

  const invalid = status === "error";

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative">
        {/* placeholder=" " lets CSS know when the field is filled, so the
            label floats without a re-render on every keystroke. */}
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          placeholder=" "
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(e) => {
            const value = e.target.value;
            onValueChange?.(value);
            if (!validate) return;
            if (live) check(value);
            // A valid field stops claiming so the moment it isn't, but only
            // turns red again on blur.
            else if (status === "valid" && validate(value)) setStatus("idle");
          }}
          onBlur={(e) => {
            if (!validate) return;
            const value = e.target.value;
            // Tabbing past an untouched field is not a mistake.
            if (value === "" && !live) return;
            if (check(value)) setLive(true);
          }}
          className={cn(
            // 20px of top padding clears the floated label (6px down, 11.2px
            // tall), so typed text and label never share a pixel.
            "peer h-12 w-full rounded-xl border bg-background pt-5 pr-9 pb-1.5 pl-3 text-sm text-foreground outline-none transition-[border-color] duration-150 ease-out",
            "focus-visible:outline-2 focus-visible:-outline-offset-1",
            invalid
              ? "border-danger focus-visible:outline-danger"
              : "border-border focus-visible:outline-foreground",
          )}
        />
        {/* Moves with translate and scale from its top left corner, so the text
            never reflows. Rising takes 200ms, settling back 150ms. */}
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute top-3.5 left-3 origin-top-left text-sm whitespace-nowrap select-none",
            "transition-[translate,scale,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[color]",
            // 14px up to 6px from the top, at 80% (11.2px) of the text size.
            "peer-focus:-translate-y-2 peer-focus:scale-[0.8] peer-focus:duration-200",
            "peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:scale-[0.8] peer-[:not(:placeholder-shown)]:duration-200",
            invalid ? "text-danger" : "text-muted peer-focus:text-foreground",
          )}
        >
          {label}
        </label>
        <motion.svg
          aria-hidden
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute top-4 right-3 size-4 text-foreground"
          initial={false}
          animate={
            status === "valid"
              ? { scale: 1, opacity: 1, filter: "blur(0px)" }
              : reduceMotion
                ? { scale: 1, opacity: 0, filter: "blur(0px)" }
                : { scale: 0.25, opacity: 0, filter: "blur(4px)" }
          }
          transition={ICON_SWAP}
        >
          <path d="m3.5 8.5 3 3 6-7" />
        </motion.svg>
      </div>

      {/* Grid rows from 0fr to 1fr give a real height transition without
          measuring. Opens in 200ms, closes in 150ms. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          invalid
            ? "grid-rows-[1fr] duration-200"
            : "grid-rows-[0fr] duration-150",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            id={errorId}
            aria-hidden={!invalid}
            className={cn(
              "pt-1.5 pl-3 text-xs text-danger transition-[opacity,translate] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[opacity]",
              invalid
                ? "translate-y-0 opacity-100 duration-200"
                : "-translate-y-1 opacity-0 duration-150 motion-reduce:translate-y-0",
            )}
          >
            {message}
          </p>
        </div>
      </div>
      {/* Blur moves focus away, so the error needs its own announcement. */}
      <span className="sr-only" aria-live="polite">
        {invalid ? message : ""}
      </span>
    </div>
  );
}

// Deliberately loose: the server is the real judge of an address.
function validateEmail(value: string) {
  const email = value.trim();
  if (email === "") return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return "That doesn't look like an email address.";
  return null;
}

export default function FloatingLabelDemo() {
  return (
    <form
      className="flex w-72 flex-col gap-3"
      noValidate
      onSubmit={(e) => e.preventDefault()}
    >
      <FloatingLabel label="Name" name="name" autoComplete="name" />
      <FloatingLabel
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        validate={validateEmail}
      />
    </form>
  );
}
