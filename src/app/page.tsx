import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { LabCard } from "@/components/lab-card";
import { LabSearch } from "@/components/lab-search";
import { NewMark } from "@/components/new-mark";
import { ScrollMemory } from "@/components/scroll-memory";
import { SiteHeader } from "@/components/site-header";
import { SourceLink } from "@/components/source-link";
import { previews } from "@/lab/previews";
import { lab } from "@/lab/registry";
import { cn } from "@/lib/cn";
import { absoluteUrl, labPath, site } from "@/lib/site";

// The newest batch leads, so returning visitors see it without scrolling
// past everything they've seen before. Search matches cards by position, so
// its entries come from this same list.
const shown = [...lab.filter((e) => e.isNew), ...lab.filter((e) => !e.isNew)];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      url: absoluteUrl("/"),
      description: site.description,
      inLanguage: "en",
      author: { "@id": `${site.url}/#person` },
      publisher: { "@id": `${site.url}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.author.name,
      alternateName: site.author.handle,
      url: site.author.url,
      sameAs: site.author.sameAs,
    },
    {
      "@type": "CollectionPage",
      "@id": `${site.url}/#collection`,
      name: `${site.name}: interaction design components with source`,
      url: absoluteUrl("/"),
      description: site.description,
      isPartOf: { "@id": `${site.url}/#website` },
      author: { "@id": `${site.url}/#person` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: lab.length,
        itemListElement: lab.map(({ slug, name, description }, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name,
          url: absoluteUrl(labPath(slug)),
          description,
        })),
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />
      <ScrollMemory />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16 sm:px-6">
        {/* Says plainly what the page is, for people and for the search and
            answer engines that quote it. */}
        <div className="mb-10">
          <h1 className="text-xl font-medium tracking-tight text-balance">
            Interaction components, built to feel right
          </h1>
          <p className="mt-2 max-w-xl text-sm text-pretty text-muted">
            A collection of {lab.length} React interaction components built
            with Tailwind CSS and Motion. Each one has smooth animation,
            keyboard support, light and dark themes, and source you can read.
          </p>
        </div>
        <LabSearch
          entries={shown.map(({ name, description, keywords }) => ({
            name,
            description,
            keywords,
          }))}
        >
          {shown.map(({ slug, name, description, previewScale, previewCrop, isNew }) => {
            const Preview = previews[slug];
            return (
              <LabCard
                key={slug}
                // Named groups, because demos use plain group-hover for their
                // own hover states; an unnamed group here would trigger all of
                // them whenever the card is hovered.
                className="group/card group/preview relative rounded-[20px] bg-background p-2 shadow-raised transition-[background-color] duration-150 ease-out hover:bg-surface"
              >
                  {/* Offscreen previews skip rendering until scrolled near, so
                      the index doesn't paint every live demo at once. It sits
                      here rather than on the card because it clips like
                      overflow-hidden, which would cut off the card's shadow. */}
                  <div
                    inert
                    className={cn(
                      "flex h-56 justify-center overflow-hidden rounded-xl bg-surface transition-[background-color] duration-150 ease-out [content-visibility:auto] group-hover/preview:bg-background",
                      // Cropped previews start at the top and fade out below,
                      // like a screenshot of the top of the tool.
                      previewCrop
                        ? "items-start pt-4 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
                        : "items-center",
                    )}
                  >
                    {/* As wide as the demo would have at full size (the box
                        divided by the scale), so demos sized in percentages
                        resolve as they do on their own page, then the scale
                        shrinks the whole thing to fit. */}
                    <div
                      className="flex shrink-0 justify-center"
                      style={{
                        scale: previewScale && String(previewScale),
                        transformOrigin: previewCrop ? "top" : undefined,
                        width: `${100 / (previewScale ?? 1)}%`,
                      }}
                    >
                      <Preview />
                    </div>
                  </div>
                  <div className="px-2 pt-3 pb-1">
                    {/* Right padding leaves room for the source link. */}
                    <p className="pr-20 text-sm font-medium">
                      {/* The title is the card's link, stretched over the
                          whole card by its ::after. Wrapping the card in the
                          link instead would nest any link inside a demo in
                          another link, which is invalid HTML and breaks
                          hydration. */}
                      <Link
                        href={`/lab/${slug}`}
                        className="outline-hidden after:absolute after:inset-0 after:rounded-[20px] focus-visible:after:outline-2 focus-visible:after:outline-solid focus-visible:after:outline-offset-2 focus-visible:after:outline-foreground"
                      >
                        {name}
                      </Link>
                      {/* The space keeps "new" a separate word for screen
                          readers and search snippets. */}{" "}
                      {isNew && <NewMark className="ml-1" />}
                    </p>
                    <p className="mt-0.5 text-sm text-pretty text-muted">
                      {description}
                    </p>
                  </div>
                {/* Above the stretched card link, so it stays its own target.
                    It sits on the title line, below the preview, so no demo
                    can ever run into it: 8px padding + 224px preview + 12px
                    gap puts the title 244px down, and 242 centers the 24px
                    link on its 20px line. */}
                <SourceLink
                  slug={slug}
                  name={name}
                  className="absolute top-[242px] right-3 z-10 px-1.5 py-1 text-xs group-hover/card:text-foreground"
                />
              </LabCard>
            );
          })}
        </LabSearch>
      </main>
    </>
  );
}
