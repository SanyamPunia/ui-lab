import { existsSync } from "node:fs";
import { join } from "node:path";

import { categories } from "../src/lab/registry";

const slug = process.argv[2];
// Which index filter it belongs to; see `categories` in the registry.
const category = process.argv[3] ?? "cards";

if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error("usage: bun run new <kebab-case-name> [category]");
  process.exit(1);
}
if (!categories.some((c) => c.id === category)) {
  console.error(
    `unknown category "${category}"; use one of: ${categories.map((c) => c.id).join(", ")}`,
  );
  process.exit(1);
}

const root = join(import.meta.dir, "..");
const file = join(root, "src/lab/components", `${slug}.tsx`);
const registry = join(root, "src/lab/registry.ts");

if (existsSync(file)) {
  console.error(`src/lab/components/${slug}.tsx already exists`);
  process.exit(1);
}

const pascal = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
const name = slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll("-", " ");

await Bun.write(
  file,
  `"use client";

export default function ${pascal}Demo() {
  return <div>${name}</div>;
}
`,
);

// The `new-component:` markers in these files are anchors for this script;
// keep them in place. A missing marker stops here instead of silently
// leaving the component half registered.
async function insert(path: string, edits: [marker: string, text: string][]) {
  let source = await Bun.file(path).text();
  for (const [marker, text] of edits) {
    if (!source.includes(marker)) {
      console.error(`${path} is missing the "${marker.trim()}" marker`);
      process.exit(1);
    }
    source = source.replace(marker, `${text}\n${marker}`);
  }
  await Bun.write(path, source);
}

await insert(registry, [
  [
    "  // new-component:entries",
    `  {
    slug: "${slug}",
    name: "${name}",
    category: "${category}",
    description: "",
  },`,
  ],
]);
await insert(join(root, "src/lab/demos.tsx"), [
  [
    "  // new-component:entries",
    `  "${slug}": dynamic(() => import("./components/${slug}")),`,
  ],
]);
await insert(join(root, "src/lab/previews.ts"), [
  ["// new-component:imports", `import ${pascal}Demo from "./components/${slug}";`],
  ["  // new-component:entries", `  "${slug}": ${pascal}Demo,`],
]);

console.log(`created src/lab/components/${slug}.tsx`);
console.log(`open http://localhost:3000/lab/${slug}`);
