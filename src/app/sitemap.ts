import type { MetadataRoute } from "next";
import { lab } from "@/lab/registry";
import { absoluteUrl, labPath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Generated at build, so this is the date of the deploy that last changed
  // the site.
  const lastModified = new Date();
  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...lab.map(({ slug }) => ({
      url: absoluteUrl(labPath(slug)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
