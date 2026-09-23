// Refreshes the contribution heatmap's data from GitHub's public profile
// graph. Runs before every build, so each deploy shows the current year; if
// GitHub can't be reached, the last saved copy is kept and the build goes on.
const user = "xevrion";
const file = `${import.meta.dir}/../src/lab/data/contributions.json`;

try {
  const res = await fetch(`https://github.com/users/${user}/contributions`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const html = await res.text();

  // Each day is a cell with its date and level; the count lives in the
  // tooltip that points at the cell's id.
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].match(/^([\d,]+) contribution/);
    counts.set(m[1], n ? Number(n[1].replaceAll(",", "")) : 0);
  }
  const days: { date: string; count: number; level: number }[] = [];
  for (const m of html.matchAll(/<td[^>]*ContributionCalendar-day[^>]*>/g)) {
    const date = m[0].match(/data-date="([^"]+)"/)?.[1];
    const id = m[0].match(/id="([^"]+)"/)?.[1];
    const level = Number(m[0].match(/data-level="(\d)"/)?.[1] ?? 0);
    if (date && id) days.push({ date, count: counts.get(id) ?? 0, level });
  }
  // The page lists days row by row (every Sunday, then every Monday), so
  // put them back in calendar order.
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 300) throw new Error(`only ${days.length} days found`);

  await Bun.write(file, `${JSON.stringify({ user, days })}\n`);
  console.log(`contributions: ${days.length} days for ${user}`);
} catch (error) {
  console.warn(`contributions: kept the saved copy (${(error as Error).message})`);
}
