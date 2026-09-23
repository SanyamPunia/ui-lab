import { categories, lab } from "@/lab/registry";
import { SidebarLink } from "./sidebar-link";

// Every piece in the lab, grouped the same way as the index filters and
// alphabetical within each group, so it works as a table of contents. Only
// on screens wide enough to hold it beside the centred content.
export function LabSidebar() {
  const groups = categories.map((c) => ({
    ...c,
    items: lab
      .filter((e) => e.category === c.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return (
    <nav
      aria-label="All components"
      // Fades at both ends, so the list reads as scrolling on under the
      // header rather than being cut by it.
      className="fixed top-14 bottom-0 left-0 hidden w-60 overflow-y-auto overscroll-contain px-4 pt-6 pb-16 [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-48px),transparent)] [scrollbar-width:none] xl:block [&::-webkit-scrollbar]:hidden"
    >
      {groups.map((g) => (
        <div key={g.id} className="mb-6">
          <p className="mb-1.5 px-2 text-xs font-medium text-muted">
            {g.label}
          </p>
          <ul>
            {g.items.map((e) => (
              <li key={e.slug}>
                <SidebarLink slug={e.slug} name={e.name} isNew={e.isNew} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
