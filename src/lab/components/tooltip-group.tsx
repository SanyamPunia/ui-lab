"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/cn";

/* The teachable part: one shared clock for every tooltip in a group. */

type Open = { id: string; instant: boolean } | null;

type Group = {
  open: Open;
  request: (id: string, immediate: boolean) => void;
  release: (id: string) => void;
  dismiss: (id: string) => void;
};

const GroupContext = createContext<Group | null>(null);

export function TooltipGroup({
  // Long enough that sweeping the cursor across the page never flashes a
  // tooltip, short enough that a deliberate pause gets one.
  delay = 500,
  // How long the group stays warm after the last tooltip closes. Covers the
  // gap between two buttons with plenty of room to spare.
  skipDelay = 300,
  children,
}: {
  delay?: number;
  skipDelay?: number;
  children: React.ReactNode;
}) {
  const [open, setOpenState] = useState<Open>(null);
  // Pointer events can outrun re-renders, so handlers read these refs.
  const openRef = useRef<Open>(null);
  const warm = useRef(false);
  const pending = useRef<string | null>(null);
  const suppressed = useRef<string | null>(null);
  const delayTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const graceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setOpen = useCallback((next: Open) => {
    openRef.current = next;
    setOpenState(next);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(delayTimer.current);
      clearTimeout(graceTimer.current);
    },
    [],
  );

  const request = useCallback(
    (id: string, immediate: boolean) => {
      // Pressed or Escaped: stay quiet until the pointer or focus moves on.
      if (suppressed.current === id) return;
      clearTimeout(delayTimer.current);
      clearTimeout(graceTimer.current);
      pending.current = null;
      if (warm.current || openRef.current) {
        // Scanning the toolbar: no delay and no entrance, as if the tooltips
        // were already there.
        setOpen({ id, instant: true });
        return;
      }
      if (immediate) {
        warm.current = true;
        setOpen({ id, instant: false });
        return;
      }
      pending.current = id;
      delayTimer.current = setTimeout(() => {
        pending.current = null;
        warm.current = true;
        setOpen({ id, instant: false });
      }, delay);
    },
    [delay, setOpen],
  );

  const release = useCallback(
    (id: string) => {
      if (suppressed.current === id) suppressed.current = null;
      if (pending.current === id) {
        clearTimeout(delayTimer.current);
        pending.current = null;
      }
      // A late leave or blur from a trigger that is no longer showing must
      // not close or cool down the one that is.
      if (openRef.current && openRef.current.id !== id) return;
      if (openRef.current) setOpen(null);
      if (!warm.current) return;
      clearTimeout(graceTimer.current);
      graceTimer.current = setTimeout(() => {
        warm.current = false;
      }, skipDelay);
    },
    [skipDelay, setOpen],
  );

  const dismiss = useCallback(
    (id: string) => {
      if (pending.current === id) {
        clearTimeout(delayTimer.current);
        pending.current = null;
      }
      suppressed.current = id;
      if (openRef.current?.id === id) setOpen(null);
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss(open.id);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  const value = useMemo(
    () => ({ open, request, release, dismiss }),
    [open, request, release, dismiss],
  );
  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}

export function useTooltip() {
  const group = useContext(GroupContext);
  if (!group) throw new Error("useTooltip needs a <TooltipGroup> above it");
  const { open, request, release, dismiss } = group;
  const id = useId();
  const isOpen = open?.id === id;

  return {
    isOpen,
    // Snap in when the group is warm, and snap out when a neighbor takes
    // over, so a sweep never shows two tooltips crossing.
    instant: isOpen ? open.instant : open !== null,
    triggerProps: {
      "aria-describedby": id,
      onPointerEnter: (e: React.PointerEvent) => {
        // Touch has no hover; a tap would flash the tooltip under the finger.
        if (e.pointerType !== "touch") request(id, false);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType !== "touch") release(id);
      },
      // A press means the user already knows what it does, and the tooltip
      // would otherwise sit on top of whatever the press changed.
      onPointerDown: () => dismiss(id),
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        // Keyboard users get it at once: there is no hover to wait out.
        if (e.currentTarget.matches(":focus-visible")) request(id, true);
      },
      onBlur: () => release(id),
    },
    tooltipProps: { id, role: "tooltip" as const },
  };
}

export function TooltipBubble({
  isOpen,
  instant,
  className,
  children,
  ...props
}: {
  isOpen: boolean;
  instant: boolean;
} & React.ComponentProps<"span">) {
  return (
    <span
      {...props}
      className={cn(
        // Grows out of the trigger it describes.
        "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2.5 -translate-x-1/2 origin-bottom",
        "flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-background",
        "transition-[opacity,scale,translate,visibility] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-[opacity,visibility]",
        // Enters in 150ms and leaves in 100ms, like the copy button's
        // tooltip: the exit should never hold the eye.
        isOpen
          ? "visible translate-y-0 scale-100 opacity-100 duration-150"
          : "invisible translate-y-0.5 scale-[0.97] opacity-0 duration-100 motion-reduce:translate-y-0 motion-reduce:scale-100",
        instant && "duration-0",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* A text formatting toolbar built on it. */

export type FormatItem = {
  key: string;
  label: string;
  // KeyboardEvent.code, so holding Shift never changes which key matches.
  code: string;
  shift?: boolean;
  icon: React.ReactNode;
};

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const subscribeNever = () => () => {};

function useIsMac() {
  // The server can't know, so it renders Mac glyphs and the client corrects
  // them right after hydration.
  return useSyncExternalStore(subscribeNever, isMac, () => true);
}

const keyName = (code: string) => code.replace(/^(Key|Digit)/, "");

export function FormatToolbar({
  items,
  pressed,
  onToggle,
  label = "Text formatting",
  className,
}: {
  items: FormatItem[];
  pressed: Record<string, boolean>;
  onToggle: (key: string) => void;
  label?: string;
  className?: string;
}) {
  const mac = useIsMac();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (mac ? e.metaKey : e.ctrlKey) {
      const item = items.find(
        (i) => i.code === e.code && Boolean(i.shift) === e.shiftKey,
      );
      if (!item) return;
      e.preventDefault();
      onToggle(item.key);
      return;
    }
    // One tab stop for the whole toolbar; arrows move within it.
    const last = items.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    const next = moves[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <TooltipGroup>
      {/* 48px pill with 4px padding around 40px buttons keeps the radii
          concentric: 24 = 20 + 4. */}
      <div
        role="toolbar"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-12 items-center gap-1 rounded-full bg-surface p-1 shadow-raised",
          className,
        )}
      >
        {items.map((item, i) => (
          <FormatButton
            key={item.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            item={item}
            mac={mac}
            pressed={Boolean(pressed[item.key])}
            tabIndex={i === active ? 0 : -1}
            onFocus={() => setActive(i)}
            onToggle={() => onToggle(item.key)}
          />
        ))}
      </div>
    </TooltipGroup>
  );
}

function FormatButton({
  item,
  mac,
  pressed,
  tabIndex,
  onFocus,
  onToggle,
  ref,
}: {
  item: FormatItem;
  mac: boolean;
  pressed: boolean;
  tabIndex: number;
  onFocus: () => void;
  onToggle: () => void;
  ref: React.Ref<HTMLButtonElement>;
}) {
  const { isOpen, instant, triggerProps, tooltipProps } = useTooltip();
  const key = keyName(item.code);
  const glyphs = mac
    ? `⌘${item.shift ? "⇧" : ""}${key}`
    : `Ctrl+${item.shift ? "Shift+" : ""}${key}`;
  const shortcut = `${mac ? "Meta" : "Control"}+${item.shift ? "Shift+" : ""}${key}`;

  return (
    <span className="relative flex">
      <button
        ref={ref}
        type="button"
        aria-label={item.label}
        aria-pressed={pressed}
        aria-keyshortcuts={shortcut}
        tabIndex={tabIndex}
        onClick={onToggle}
        {...triggerProps}
        onFocus={(e) => {
          onFocus();
          triggerProps.onFocus(e);
        }}
        className={cn(
          "flex size-10 touch-manipulation items-center justify-center rounded-full text-muted outline-hidden select-none hover:text-foreground",
          "transition-[scale,color,background-color,box-shadow] duration-150 ease-out motion-reduce:transition-[color,background-color,box-shadow]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96]",
          pressed && "bg-background text-foreground shadow-raised",
        )}
      >
        <svg
          viewBox="0 0 16 16"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {item.icon}
        </svg>
      </button>
      <TooltipBubble isOpen={isOpen} instant={instant} {...tooltipProps}>
        {item.label}
        <kbd className="font-sans text-background/55">{glyphs}</kbd>
      </TooltipBubble>
    </span>
  );
}

const ITEMS: FormatItem[] = [
  {
    key: "bold",
    label: "Bold",
    code: "KeyB",
    icon: (
      <path d="M4.75 3.25h4a2.5 2.5 0 0 1 0 5h-4zM4.75 8.25h4.75a2.25 2.25 0 0 1 0 4.5H4.75z" />
    ),
  },
  {
    key: "italic",
    label: "Italic",
    code: "KeyI",
    icon: <path d="M6.75 3.25h5M4.25 12.75h5M9.75 3.25l-3.5 9.5" />,
  },
  {
    key: "underline",
    label: "Underline",
    code: "KeyU",
    icon: <path d="M4.5 2.75v4.5a3.5 3.5 0 0 0 7 0v-4.5M3.5 13.25h9" />,
  },
  {
    key: "strike",
    label: "Strikethrough",
    code: "KeyX",
    shift: true,
    icon: (
      <path d="M2.75 8h10.5M11 4.5c-.4-1.1-1.5-1.75-3-1.75-1.8 0-3 .9-3 2.25 0 .8.4 1.4 1.2 1.8M5 11.25c.4 1.2 1.6 2 3.1 2 1.9 0 3.15-.95 3.15-2.4 0-.5-.15-.95-.45-1.35" />
    ),
  },
  {
    key: "code",
    label: "Code",
    code: "KeyE",
    icon: <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />,
  },
  {
    key: "quote",
    label: "Quote",
    code: "Digit9",
    shift: true,
    icon: <path d="M3.25 3.75v8.5M6.5 5.25h6.25M6.5 8h6.25M6.5 10.75h4" />,
  },
];

export default function TooltipGroupDemo() {
  const [pressed, setPressed] = useState<Record<string, boolean>>({
    bold: true,
  });
  const toggle = (key: string) =>
    setPressed((p) => ({ ...p, [key]: !p[key] }));

  // Two separate utilities would both set text-decoration-line and clash.
  const decoration =
    [pressed.underline && "underline", pressed.strike && "line-through"]
      .filter(Boolean)
      .join(" ") || "none";

  return (
    <div className="flex flex-col items-center gap-6">
      <FormatToolbar items={ITEMS} pressed={pressed} onToggle={toggle} />
      {/* Fixed height and an always present border, so toggling a style
          never nudges the toolbar above it. */}
      <p
        className={cn(
          "h-7 border-l-2 border-transparent pl-3.5 text-[15px]/7 whitespace-nowrap text-foreground transition-[color,border-color] duration-150 ease-out",
          pressed.bold && "font-semibold",
          pressed.italic && "italic",
          pressed.code && "font-mono",
          pressed.quote && "border-foreground/20 text-muted",
        )}
        style={{ textDecorationLine: decoration }}
      >
        Scan the toolbar, not the docs.
      </p>
    </div>
  );
}
