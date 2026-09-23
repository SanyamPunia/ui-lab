"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

// The drawer curve: fast out of the edge, settling gently.
const SLIDE = { duration: 0.32, ease: [0.32, 0.72, 0, 1] } as const;

// The sidebar's list on screens too narrow for the column: a button in the
// header slides it in from the left.
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Picking a component navigates, and the menu gets out of the way.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // The page underneath stays put while the list scrolls.
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panelRef.current?.focus();
    const button = buttonRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
      button?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="All components"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-ml-2 grid size-9 touch-manipulation place-items-center rounded-full text-muted outline-hidden transition-[color,scale] duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-foreground active:scale-[0.96] lg:hidden"
      >
        <svg
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M2.5 5h11M2.5 11h7" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal
              aria-label="All components"
              tabIndex={-1}
              className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-background shadow-raised outline-hidden"
              initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { x: "-100%", transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }
              }
              transition={SLIDE}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pr-3 pl-6">
                <span className="text-[15px] font-semibold tracking-tight">
                  ui lab
                  <span className="ml-2 text-[13px] font-normal text-muted">
                    by xevrion
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="grid size-9 touch-manipulation place-items-center rounded-full text-muted outline-hidden transition-[color,scale] duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-foreground active:scale-[0.96]"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="m4 4 8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
              <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-5 pb-10">
                {children}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
