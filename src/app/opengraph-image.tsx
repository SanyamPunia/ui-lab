import { lab } from "@/lab/registry";
import { ogContentType, ogSize, siteImage } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `ui lab: ${lab.length} interaction components with source`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return siteImage({
    description: `${site.tagline}, with source for each.`,
    count: lab.length,
  });
}
