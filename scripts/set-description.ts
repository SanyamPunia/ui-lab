// Usage: bun scripts/set-description.ts '{"slug": "New description."}'
// Rewrites registered descriptions, wrapping long ones onto their own line
// the way the registry already does.
const file = `${import.meta.dir}/../src/lab/registry.ts`;
const updates: Record<string, string> = JSON.parse(process.argv[2]);

let source = await Bun.file(file).text();
for (const [slug, description] of Object.entries(updates)) {
  const entry = new RegExp(
    `(    slug: "${slug}",\\n(?:    isNew: true,\\n)?    name: "[^"]*",\\n(?:    category: "[^"]*",\\n)?)    description:\\s*"(?:[^"\\\\]|\\\\.)*",\\n`,
  );
  if (!entry.test(source)) throw new Error(`entry not found: ${slug}`);
  const line = `    description: ${JSON.stringify(description)},\n`;
  // 80 columns, plus the newline.
  const text =
    line.length > 81
      ? `    description:\n      ${JSON.stringify(description)},\n`
      : line;
  source = source.replace(entry, `$1${text}`);
  console.log("updated", slug);
}
await Bun.write(file, source);
