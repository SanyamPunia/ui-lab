<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Lab conventions

Each component lives in `src/lab/components/<slug>.tsx`, exports the component by name, and default-exports a demo. Create new ones with `bun run new <slug>` rather than by hand, so the entry in `src/lab/registry.ts` is added too. Never remove the `// new-component:` markers in the registry.

Use the color tokens from `src/app/globals.css` (`bg-surface`, `text-muted`, `border-border`) instead of raw Tailwind palette colors, merge class names with `cn()` from `@/lib/cn`, and use `motion/react` for animation that CSS transitions can't express. Use `bun`, never npm or yarn.

Every component must look right in both themes. Prefer adding theme-dependent colors to `globals.css` as `light-dark()` tokens. The `dark:` variant also follows the toggle, so it's fine for one-off tweaks.
