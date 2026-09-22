import { existsSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];

if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error("usage: bun run new <kebab-case-name>");
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

// The markers in registry.ts are anchors for this script; keep them in place.
const source = await Bun.file(registry).text();
await Bun.write(
  registry,
  source
    .replace(
      "// new-component:imports",
      `import ${pascal}Demo from "./components/${slug}";\n// new-component:imports`,
    )
    .replace(
      "  // new-component:entries",
      `  {
    slug: "${slug}",
    name: "${name}",
    description: "",
    Demo: ${pascal}Demo,
  },
  // new-component:entries`,
    ),
);

console.log(`created src/lab/components/${slug}.tsx`);
console.log(`open http://localhost:3000/lab/${slug}`);
