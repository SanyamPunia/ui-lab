"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type ValueAnimationTransition,
} from "motion/react";
import { cn } from "@/lib/cn";

type Phase = "compose" | "sending" | "sent";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
// Gravity: the note drops into the pocket and the envelope is flung away,
// so both gather speed rather than settle.
const EASE_IN = [0.55, 0, 1, 0.45] as const;

// Envelope geometry in px. The paper area is 180 tall, so a 150 tall
// envelope sits centered in it with 15px to spare above and below.
const PAPER_H = 180;
const ENV_W = 240;
const ENV_H = 150;
const ENV_TOP = (PAPER_H - ENV_H) / 2;
// The flap tip lands just past the pocket's V (82), so it fully covers it.
const FLAP_H = 86;
const POCKET_V = 82;
// The note shrinks to this width: 20px clear of each side of the envelope.
const NOTE_W = 200;

const noop = () => () => {};
const readModifier = () =>
  /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

export function EnvelopeSend({
  onSend,
  title = "Send feedback",
  description = "Tell us what to fix. We read every note.",
  placeholder = "What could be better?",
  className,
}: {
  onSend?: (message: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const modifier = useSyncExternalStore(noop, readModifier, () => "Ctrl");
  const fieldId = useId();
  const [phase, setPhase] = useState<Phase>("compose");
  const [message, setMessage] = useState("");
  const paperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const running = useRef<AnimationPlaybackControls[]>([]);

  // The header and footer fade as one; the note, envelope and the group
  // they fly off in each get their own values so steps can overlap.
  const chrome = useMotionValue(1);
  const noteScale = useMotionValue(1);
  const noteY = useMotionValue(0);
  const envOpacity = useMotionValue(0);
  const envY = useMotionValue(16);
  // 180deg is fully open, folded up behind the note.
  const flap = useMotionValue(180);
  const seal = useMotionValue(0);
  const groupX = useMotionValue(0);
  const groupY = useMotionValue(0);
  const groupRotate = useMotionValue(0);
  const groupOpacity = useMotionValue(1);
  const groupBlur = useMotionValue(0);
  const groupFilter = useTransform(groupBlur, (b) =>
    b > 0.01 ? `blur(${b}px)` : "none",
  );
  // Open, the flap sits behind the note; past vertical it folds over it.
  const flapZ = useTransform(flap, (r) => (r > 90 ? 1 : 4));
  const sealScale = useTransform(seal, [0, 1], [0.5, 1]);

  useEffect(() => {
    const list = running;
    return () => list.current.forEach((c) => c.stop());
  }, []);

  const play = (
    value: MotionValue<number>,
    to: number,
    transition: ValueAnimationTransition<number>,
  ) => {
    const controls = animate(value, to, transition);
    running.current.push(controls);
    return controls;
  };

  const finish = () => {
    running.current = [];
    setPhase("sent");
    // Wait a frame for the sent panel to lose inert before focusing it.
    requestAnimationFrame(() => againRef.current?.focus());
  };

  const send = async () => {
    const text = message.trim();
    const paper = paperRef.current;
    if (phase !== "compose" || !text || !paper) return;
    setPhase("sending");
    onSend?.(text);

    if (reduceMotion) {
      chrome.jump(0);
      groupOpacity.jump(0);
      finish();
      return;
    }

    const scale = NOTE_W / paper.offsetWidth;
    const noteH = PAPER_H * scale;

    // 1. 240ms: the note shrinks and lifts over the envelope's mouth while
    // the envelope rises in beneath it.
    await Promise.all([
      play(chrome, 0, { duration: 0.15, ease: EASE_OUT }),
      play(noteScale, scale, { duration: 0.24, ease: EASE_IN_OUT }),
      play(noteY, ENV_TOP - noteH * 0.55, {
        duration: 0.24,
        ease: EASE_IN_OUT,
      }),
      play(envOpacity, 1, { duration: 0.18, ease: EASE_OUT }),
      play(envY, 0, { duration: 0.24, ease: EASE_OUT }),
    ]);
    // 2. 160ms: it drops into the pocket, 10px below the envelope's top.
    await play(noteY, ENV_TOP + 10, { duration: 0.16, ease: EASE_IN });
    // 3. 180ms: the flap folds shut over it.
    await play(flap, 0, { duration: 0.18, ease: EASE_IN_OUT });
    // 4 and 5. The seal presses on, and 80ms later, once it has landed,
    // the envelope leaves in 240ms. The whole send stays under 900ms.
    play(seal, 1, { type: "spring", duration: 0.25, bounce: 0.3 });
    const away = { duration: 0.24, ease: EASE_IN, delay: 0.08 };
    await Promise.all([
      play(groupX, 160, away),
      play(groupY, -28, away),
      play(groupRotate, -8, away),
      play(groupOpacity, 0, away),
    ]);
    finish();
  };

  const writeAnother = () => {
    setMessage("");
    setPhase("compose");
    // Everything resets out of sight, then the blank note fades back in.
    noteScale.jump(1);
    noteY.jump(0);
    envOpacity.jump(0);
    envY.jump(16);
    flap.jump(180);
    seal.jump(0);
    groupX.jump(0);
    groupRotate.jump(0);
    if (reduceMotion) {
      groupY.jump(0);
      groupOpacity.jump(1);
      chrome.jump(1);
    } else {
      groupY.jump(8);
      groupBlur.jump(4);
      const enter = { duration: 0.3, ease: EASE_OUT };
      play(groupY, 0, enter);
      play(groupBlur, 0, enter);
      play(groupOpacity, 1, enter);
      play(chrome, 1, enter);
    }
    requestAnimationFrame(() => textRef.current?.focus());
  };

  const empty = message.trim() === "";
  const envelopeBox = {
    left: `calc(50% - ${ENV_W / 2}px)`,
    top: ENV_TOP,
    width: ENV_W,
  };

  return (
    <div
      className={cn(
        "relative h-[372px] w-[min(440px,100%)] rounded-[20px] bg-surface p-5 shadow-raised",
        className,
      )}
    >
      <div inert={phase !== "compose"} className="flex h-full flex-col">
        <motion.div style={{ opacity: chrome }}>
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </motion.div>

        <motion.div
          className="relative mt-4 shrink-0"
          style={{
            height: PAPER_H,
            x: groupX,
            y: groupY,
            rotate: groupRotate,
            opacity: groupOpacity,
            filter: groupFilter,
          }}
        >
          {/* Envelope back: the inside you see behind the note. */}
          <motion.svg
            aria-hidden
            viewBox={`0 0 ${ENV_W} ${ENV_H}`}
            className="absolute z-[1] overflow-visible"
            style={{
              ...envelopeBox,
              height: ENV_H,
              opacity: envOpacity,
              y: envY,
            }}
          >
            <rect
              x="0.5"
              y="0.5"
              width={ENV_W - 1}
              height={ENV_H - 1}
              rx="6"
              className="fill-background stroke-foreground/15"
            />
            {/* A shade darker than the pocket, so the inside reads as
                being in shadow. */}
            <rect
              x="0.5"
              y="0.5"
              width={ENV_W - 1}
              height={ENV_H - 1}
              rx="6"
              className="fill-foreground/[0.05]"
            />
          </motion.svg>

          {/* The flap hinges on the envelope's top edge. */}
          <motion.svg
            aria-hidden
            viewBox={`0 0 ${ENV_W} ${FLAP_H}`}
            className="absolute overflow-visible"
            style={{
              ...envelopeBox,
              height: FLAP_H,
              opacity: envOpacity,
              y: envY,
              rotateX: flap,
              zIndex: flapZ,
              transformPerspective: 600,
              originY: 0,
            }}
          >
            <path
              d={`M1 1 L${ENV_W - 1} 1 L${ENV_W / 2 + 8} ${FLAP_H - 6} Q${ENV_W / 2} ${FLAP_H} ${ENV_W / 2 - 8} ${FLAP_H - 6} Z`}
              strokeLinejoin="round"
              className="fill-background stroke-foreground/20"
            />
          </motion.svg>

          <motion.div
            ref={paperRef}
            className="absolute inset-0 z-[2] rounded-[12px] bg-background shadow-raised"
            style={{ scale: noteScale, y: noteY, originY: 0 }}
          >
            <label htmlFor={fieldId} className="sr-only">
              {title}
            </label>
            <textarea
              id={fieldId}
              ref={textRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={placeholder}
              readOnly={phase !== "compose"}
              className="block size-full resize-none rounded-[12px] bg-transparent p-4 text-[15px] leading-6 text-foreground outline-hidden placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            />
          </motion.div>

          {/* Pocket front: covers everything but the V the note slides into. */}
          <motion.svg
            aria-hidden
            viewBox={`0 0 ${ENV_W} ${ENV_H}`}
            className="absolute z-[3] overflow-visible"
            style={{
              ...envelopeBox,
              height: ENV_H,
              opacity: envOpacity,
              y: envY,
            }}
          >
            <path
              d={`M0.5 6 L${ENV_W / 2} ${POCKET_V} L${ENV_W - 0.5} 6 L${ENV_W - 0.5} ${ENV_H - 6} Q${ENV_W - 0.5} ${ENV_H - 0.5} ${ENV_W - 6} ${ENV_H - 0.5} L6 ${ENV_H - 0.5} Q0.5 ${ENV_H - 0.5} 0.5 ${ENV_H - 6} Z`}
              strokeLinejoin="round"
              className="fill-background stroke-foreground/15"
            />
            {/* The side folds meeting under the V. */}
            <path
              d={`M1 ${ENV_H - 1} L${ENV_W / 2 - 14} ${POCKET_V + 18} M${ENV_W - 1} ${ENV_H - 1} L${ENV_W / 2 + 14} ${POCKET_V + 18}`}
              className="fill-none stroke-foreground/10"
            />
          </motion.svg>

          <motion.div
            aria-hidden
            className="absolute z-[5] flex size-6 items-center justify-center rounded-full bg-foreground text-background"
            style={{
              left: `calc(50% - 12px)`,
              // Centered 6px above the flap tip, where a seal would press.
              top: ENV_TOP + FLAP_H - 18,
              scale: sealScale,
              opacity: seal,
            }}
          >
            <svg
              viewBox="0 0 16 16"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m4 8.5 2.5 2.5 5.5-6" />
            </svg>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-auto flex items-center justify-between gap-3"
          style={{ opacity: chrome }}
        >
          <span className="text-xs text-muted">
            <kbd className="font-sans">{modifier}</kbd>
            {" + "}
            <kbd className="font-sans">Enter</kbd> to send
          </span>
          <button
            type="button"
            onClick={send}
            disabled={empty}
            className="h-9 touch-manipulation rounded-full bg-foreground px-4 text-sm font-medium text-background outline-hidden transition-[scale,opacity] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] disabled:opacity-40 disabled:active:scale-100"
          >
            Send
          </button>
        </motion.div>
      </div>

      {/* Enters only after the envelope has gone; leaves quickly so writing
          another is never kept waiting. */}
      <div
        inert={phase !== "sent"}
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center text-center",
          "transition-[opacity,filter,translate] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[opacity]",
          phase === "sent"
            ? "translate-y-0 opacity-100 filter-none duration-300"
            : "pointer-events-none translate-y-1.5 opacity-0 blur-[4px] duration-150 motion-reduce:translate-y-0 motion-reduce:filter-none",
        )}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-7 text-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        </svg>
        <p className="mt-3 text-lg font-medium text-foreground">Sent</p>
        <p className="mt-1 text-sm text-muted">Thanks for the note.</p>
        <button
          ref={againRef}
          type="button"
          onClick={writeAnother}
          className="mt-5 h-9 touch-manipulation rounded-full bg-background px-4 text-sm font-medium text-foreground shadow-raised outline-hidden transition-[scale] duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96]"
        >
          Write another
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {phase === "sent" ? "Feedback sent" : ""}
      </span>
    </div>
  );
}

export default function EnvelopeSendDemo() {
  return <EnvelopeSend />;
}
