import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getEntry, lab } from "@/lab/registry";

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

  const { Demo } = entry;

  return (
    <>
      <SiteHeader title={entry.name} />
      <main className="flex flex-1 items-center justify-center p-4">
        <Demo />
      </main>
    </>
  );
}
