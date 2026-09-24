// Saves the repo's star count for the header's GitHub link. Runs before every
// build, like the contribution graph, so the site stays fully static; if
// GitHub can't be reached, the last saved count is kept.
const repo = "xevrion/ui-lab";
const file = `${import.meta.dir}/../src/lib/repo.json`;

try {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const { stargazers_count: stars } = (await res.json()) as {
    stargazers_count?: number;
  };
  if (typeof stars !== "number") throw new Error("no star count");
  await Bun.write(file, `${JSON.stringify({ repo, stars })}\n`);
  console.log(`repo: ${stars} stars on ${repo}`);
} catch (error) {
  console.warn(`repo: kept the saved count (${(error as Error).message})`);
}
