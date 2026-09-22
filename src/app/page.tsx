import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
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
          {lab.map(({ slug, name, description, Demo }) => (
            <li key={slug}>
              <Link
                href={`/lab/${slug}`}
                className="group block h-full rounded-[20px] bg-background p-2 shadow-raised transition-[background-color] duration-150 ease-out hover:bg-surface"
              >
                <div
                  inert
                  className="flex h-56 items-center justify-center rounded-xl bg-surface transition-[background-color] duration-150 ease-out group-hover:bg-background"
                >
                  <Demo />
                </div>
                <div className="px-2 pt-3 pb-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-0.5 text-sm text-pretty text-muted">
                    {description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
