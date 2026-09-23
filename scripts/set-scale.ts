// Usage: bun scripts/set-scale.ts '{"slug": [width, height, max?], ...}'
// Fits each demo inside the index preview (316x200 keeps a margin in the 224px box) and writes
// previewScale into the registry, removing it when the demo already fits at 1. `max` lets a
// tiny control grow past 1 (up to that value) so it doesn't float in an empty box.
const file = `${import.meta.dir}/../src/lab/registry.ts`;
const sizes: Record<string, [number, number, number?]> = JSON.parse(process.argv[2]);
const MAX_W = 316;
const MAX_H = 200;

let source = await Bun.file(file).text();
for (const [slug, [w, h, max = 1]] of Object.entries(sizes)) {
  const fit = Math.min(max, MAX_W / w, MAX_H / h);
  // Rounded down to 0.05 so the preview always has a little margin.
  const rounded = Math.floor(fit * 20) / 20;
  const scale = rounded === 1 ? null : rounded;
  const entry = new RegExp(
    // Strings may hold escaped quotes, like a description that quotes UI text.
    `(    slug: "${slug}",\\n(?:    isNew: true,\\n)?    name: "[^"]*",\\n(?:    category: "[^"]*",\\n)?    description:\\s*"(?:[^"\\\\]|\\\\.)*",\\n(?:    keywords:\\s*"[^"]*",\\n)?)(    previewScale: [\\d.]+,\\n)?`,
  );
  if (!entry.test(source)) throw new Error(`entry not found: ${slug}`);
  source = source.replace(
    entry,
    `$1${scale ? `    previewScale: ${scale},\n` : ""}`,
  );
  console.log(slug.padEnd(22), `${w}x${h}`.padEnd(10), scale ?? "fits");
}
await Bun.write(file, source);
