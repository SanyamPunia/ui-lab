import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "@/lib/site";

// Everything is public. AI crawlers are named explicitly so the site stays
// open to answer engines even if a host adds its own default blocks.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
