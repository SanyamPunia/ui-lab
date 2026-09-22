import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SourceLink } from "@/components/source-link";
import { previews } from "@/lab/previews";
import { lab } from "@/lab/registry";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16 sm:px-6">
        <p className="text-sm text-muted">
          {lab.length} {lab.length === 1 ? "component" : "components"}
        </p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {lab.map(({ slug, name, description, previewScale }) => {
            const Preview = previews[slug];
            return (
              <li key={slug} className="group/card relative">
                <Link
                  href={`/lab/${slug}`}
                  className="group block h-full rounded-[20px] bg-background p-2 shadow-raised transition-[background-color] duration-150 ease-out hover:bg-surface"
                >
                  {/* Offscreen previews skip rendering until scrolled near, so
                      the index doesn't paint every live demo at once. It sits
                      here rather than on the card because it clips like
                      overflow-hidden, which would cut off the card's shadow. */}
                  <div
                    inert
                    className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-surface transition-[background-color] duration-150 ease-out [content-visibility:auto] group-hover:bg-background"
                  >
                    <div
                      style={{ scale: previewScale && String(previewScale) }}
                    >
                      <Preview />
                    </div>
                  </div>
                  <div className="px-2 pt-3 pb-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="mt-0.5 text-sm text-pretty text-muted">
                      {description}
                    </p>
                  </div>
                </Link>
                {/* Beside the card link rather than inside it, since links can't
                  nest; positioned over the preview's corner. */}
                <SourceLink
                  slug={slug}
                  name={name}
                  className="absolute top-4 right-4 px-1.5 py-1 text-xs group-hover/card:text-foreground"
                />
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
