import { lab } from "@/lab/registry";
import { absoluteUrl, labPath, site } from "@/lib/site";

// A plain markdown index for language models (https://llmstxt.org), built
// from the registry at build time so it never falls behind the site.
export const dynamic = "force-static";

export function GET() {
  const body = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} is ${site.author.name}'s (${site.author.handle}) personal lab of small React interaction experiments. It is not a component library or a package: each piece is something he built because he liked how it felt, with its own page, a live demo and a link to its TypeScript source on GitHub (${site.repo}).`,
    "",
    "## Experiments",
    "",
    ...lab.map(
      ({ slug, name, description }) =>
        `- [${name}](${absoluteUrl(labPath(slug))}): ${description}`,
    ),
    "",
    "## About",
    "",
    `- Author: ${site.author.name} (${site.author.url})`,
    `- Source code: ${site.repo}`,
    `- Built with: React, Next.js, Tailwind CSS, Motion`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
