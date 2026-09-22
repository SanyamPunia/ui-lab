import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SourceLink } from "@/components/source-link";
import { LabDemo } from "@/lab/demos";
import { getEntry, lab } from "@/lab/registry";
import { cn } from "@/lib/cn";

export function generateStaticParams() {
  return lab.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/lab/[slug]">) {
  const { slug } = await params;
  return { title: getEntry(slug)?.name };
}

export default async function LabPage({ params }: PageProps<"/lab/[slug]">) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  return (
    <>
      <SiteHeader title={entry.name} />
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
