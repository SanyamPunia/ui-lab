import { ogContentType, ogSize, siteImage } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = "ui lab: small interaction experiments by xevrion";
export const size = ogSize;
export const contentType = ogContentType;

export default function TwitterImage() {
  return siteImage({
    description: `${site.tagline}, with source for each.`,
  });
}
