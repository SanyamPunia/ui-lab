import Link from "next/link";
import { ScrollMemory } from "@/components/scroll-memory";
import { SiteHeader } from "@/components/site-header";
import { SourceLink } from "@/components/source-link";
import { previews } from "@/lab/previews";
import { lab } from "@/lab/registry";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <ScrollMemory />
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
                  // Named, because demos use plain group-hover for their own
                  // hover states; an unnamed group here would trigger all of
                  // them whenever the card is hovered.
                  className="group/preview block h-full rounded-[20px] bg-background p-2 shadow-raised transition-[background-color] duration-150 ease-out hover:bg-surface"
                >
                  {/* Offscreen previews skip rendering until scrolled near, so
                      the index doesn't paint every live demo at once. It sits
                      here rather than on the card because it clips like
                      overflow-hidden, which would cut off the card's shadow. */}
                  <div
                    inert
                    className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-surface transition-[background-color] duration-150 ease-out [content-visibility:auto] group-hover/preview:bg-background"
                  >
                    {/* As wide as the demo would have at full size (the box
                        divided by the scale), so demos sized in percentages
                        resolve as they do on their own page, then the scale
                        shrinks the whole thing to fit. */}
                    <div
                      className="flex shrink-0 justify-center"
                      style={{
                        scale: previewScale && String(previewScale),
                        width: `${100 / (previewScale ?? 1)}%`,
                      }}
                    >
                      <Preview />
                    </div>
                  </div>
                  <div className="px-2 pt-3 pb-1">
                    {/* Right padding leaves room for the source link. */}
                    <p className="pr-20 text-sm font-medium">{name}</p>
                    <p className="mt-0.5 text-sm text-pretty text-muted">
                      {description}
                    </p>
                  </div>
                </Link>
                {/* Beside the card link rather than inside it, since links can't
                    nest. It sits on the title line, below the preview, so no
                    demo can ever run into it: 8px padding + 224px preview +
                    12px gap puts the title 244px down, and 242 centers the
                    24px link on its 20px line. */}
                <SourceLink
                  slug={slug}
                  name={name}
                  className="absolute top-[242px] right-3 px-1.5 py-1 text-xs group-hover/card:text-foreground"
                />
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
