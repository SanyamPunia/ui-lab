// Structured data for search engines and answer engines. Rendered on the
// server as plain JSON, with `<` escaped so no string in it can close the
// script tag early.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
