import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { SourceLink } from "@/components/source-link";
import { LabDemo } from "@/lab/demos";
import { getEntry, lab, sourceUrl } from "@/lab/registry";
import { cn } from "@/lib/cn";
import {
  absoluteUrl,
  entryDescription,
  entryKeywords,
  labPath,
  site,
} from "@/lib/site";

export function generateStaticParams() {
  return lab.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lab/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) return {};
  const description = entryDescription(entry);
  const path = labPath(slug);
  // openGraph and twitter replace the layout's objects wholesale, so the
  // shared fields are repeated here. The images come from the colocated
  // opengraph-image and twitter-image files.
  return {
    title: entry.name,
    description,
    keywords: entryKeywords(entry),
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      siteName: site.name,
      locale: site.locale,
      url: path,
      title: `${entry.name} · ${site.name}`,
      description,
      authors: [site.author.url],
    },
    twitter: {
      card: "summary_large_image",
      creator: site.author.twitter,
      title: `${entry.name} · ${site.name}`,
      description,
    },
  };
}

export default async function LabPage({ params }: PageProps<"/lab/[slug]">) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const url = absoluteUrl(labPath(entry.slug));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        "@id": `${url}#code`,
        name: entry.name,
        description: entryDescription(entry),
        url,
        codeRepository: site.repo,
        // The component's own file on GitHub.
        sameAs: sourceUrl(entry.slug),
        programmingLanguage: { "@type": "ComputerLanguage", name: "TypeScript" },
        runtimePlatform: "React",
        keywords: entry.keywords,
        image: `${url}/opengraph-image`,
        author: { "@id": `${site.url}/#person` },
        isPartOf: { "@id": `${site.url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Lab", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: entry.name, item: url },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        url: absoluteUrl("/"),
      },
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: site.author.name,
        alternateName: site.author.handle,
        url: site.author.url,
        sameAs: site.author.sameAs,
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader title={entry.name} isNew={entry.isNew} />
      <main className="flex flex-1 flex-col">
        {/* Clipped sideways so thrown or dragged demos can't widen the page.
            `clip` rather than `hidden`, which would make this a scroll box. */}
        <div
          className={cn(
            "flex flex-1 justify-center overflow-x-clip p-4",
            entry.anchor === "top" ? "items-start pt-[18vh]" : "items-center",
          )}
        >
          <LabDemo slug={entry.slug} />
        </div>
        <div className="mx-auto flex w-full max-w-3xl items-baseline justify-between gap-4 px-4 sm:px-6">
          <p className="text-sm text-pretty text-muted">{entry.description}</p>
          <SourceLink
            slug={entry.slug}
            name={entry.name}
            className="shrink-0"
          />
        </div>
      </main>
    </>
  );
}
