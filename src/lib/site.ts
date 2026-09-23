import { lab, type LabEntry } from "@/lab/registry";

// One place for the facts every metadata file, OG image and JSON-LD block
// repeats, so the title in a share card never drifts from the page title.
export const site = {
  url: "https://lab.xevrion.dev",
  name: "ui lab",
  tagline: "Interaction design components built to feel right",
  description: `${lab.length} React interaction components built with Tailwind CSS and Motion: smooth animation, keyboard support, light and dark themes, and source for each.`,
  repo: "https://github.com/xevrion/ui-lab",
  locale: "en_US",
  author: {
    name: "Yash Bavadiya",
    handle: "xevrion",
    url: "https://xevrion.dev",
    twitter: "@xevrion_the1",
    sameAs: [
      "https://xevrion.dev",
      "https://github.com/xevrion",
      "https://x.com/xevrion_the1",
    ],
  },
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

export function labPath(slug: string) {
  return `/lab/${slug}`;
}

// Registry descriptions are one short line written for cards. Search results
// and share previews read better with a little context, so short ones get a
// plain, accurate suffix while long ones are left alone.
export function entryDescription({ description }: LabEntry) {
  const suffix =
    " A React interaction component built with Tailwind CSS and Motion, with its source on GitHub.";
  return description.length + suffix.length <= 170
    ? description + suffix
    : description;
}

export function entryKeywords({ name, keywords }: LabEntry) {
  return [
    name.toLowerCase(),
    ...(keywords?.split(/\s+/).filter(Boolean) ?? []),
    "react",
    "tailwind",
    "motion",
    "animation",
    "component",
  ];
}
