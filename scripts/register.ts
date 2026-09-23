// Usage: bun scripts/register.ts '<json array of {slug, description, previewScale?, anchor?}>'
const file = `${import.meta.dir}/../src/lab/registry.ts`;
const entries: {
  slug: string;
  description: string;
  keywords?: string;
  previewScale?: number;
  anchor?: "top";
}[] = JSON.parse(process.argv[2]);

let source = await Bun.file(file).text();
for (const e of entries) {
  const pattern = new RegExp(
    `(    slug: "${e.slug}",\\n(?:    isNew: true,\\n)?    name: "[^"]*",\\n)    description: "",\\n`,
  );
  if (!pattern.test(source)) throw new Error(`no empty entry for ${e.slug}`);
  const extra =
    (e.keywords ? `    keywords: ${JSON.stringify(e.keywords)},\n` : "") +
    (e.previewScale ? `    previewScale: ${e.previewScale},\n` : "") +
    (e.anchor ? `    anchor: "${e.anchor}",\n` : "");
  source = source.replace(
    pattern,
    `$1    description: ${JSON.stringify(e.description)},\n${extra}`,
  );
  console.log("registered", e.slug);
}
await Bun.write(file, source);
