import { notFound } from "next/navigation";
import { getEntry, lab } from "@/lab/registry";
import { componentImage, ogContentType, ogSize } from "@/lib/og";

export const alt = "A component from ui lab, an interaction design component collection";
export const size = ogSize;
export const contentType = ogContentType;

// Every component's card is rendered at build, like the page itself.
export function generateStaticParams() {
  return lab.map(({ slug }) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();
  return componentImage(entry);
}
