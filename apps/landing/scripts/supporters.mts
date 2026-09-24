/**
 * supporters.mts — the mention watcher (bean riprap-9spw, copy doc §5.6):
 * finds posts on X that mention @riprapxyz and turns them into the front
 * page's supporter discs (`src/supporters.json` — handle, post URL, avatar).
 *
 * Backend: TwitterAPI.io (the same provider as the session's twitterapi MCP).
 * Search is a paid endpoint — set TWITTERAPI_IO_KEY (https://twitterapi.io,
 * credit top-up, key lives in the account dashboard). X's official API needs
 * the $200/mo Basic tier for search; this one costs cents per run.
 * Farcaster mentions are a v2 add-on (Neynar key) — see the bean.
 *
 * Run:  node scripts/supporters.mts           # dry run — list, touch nothing
 *       node scripts/supporters.mts --write   # update src/supporters.json
 *
 * Data law (bean): default proposes, --write applies; self-posts and retweets
 * are excluded by the query; zero mentions or an API error leaves the file
 * untouched and exits non-zero. Audit the list before the first --write.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const HANDLE = "riprapxyz";
// Exclude our own posts (broadcasts, not support) and retweets (no new
// mention). Everything else mentioning the handle counts as support.
const QUERY = `@${HANDLE} -from:${HANDLE} -is:retweet`;
const MAX_DISCS = 24; // the band is a row, not a wall — bean riprap-9spw
const PAGES = 3; // ≈ up to ~100 posts per run; plenty between deploys

const JSON_PATH = new URL("../src/supporters.json", import.meta.url);
const ENDPOINT = "https://api.twitterapi.io/twitter/tweet/search";

export type Supporter = { handle: string; url: string; avatar?: string };

type MiniAuthor = { userName?: string; profilePicture?: string };
type Tweet = { id?: string; text?: string; createdAt?: string; author?: MiniAuthor };

/** tweet → the front page's disc. Handle loses its @; avatar is optional. */
export function toSupporter(tweet: Tweet): Supporter | null {
  const handle = tweet.author?.userName?.replace(/^@/, "");
  const id = tweet.id;
  if (!handle || !id) return null;
  const supporter: Supporter = { handle, url: `https://x.com/${handle}/status/${id}` };
  const avatar = tweet.author?.profilePicture;
  if (avatar) supporter.avatar = avatar;
  return supporter;
}

/** merge by post URL — the fresh entry wins (fresher avatar), newest first,
 *  capped at MAX_DISCS. Order comes from the API (Latest first). */
export function mergeSupporters(
  existing: Supporter[],
  found: Supporter[],
  max = MAX_DISCS,
): Supporter[] {
  // found entries lead (API Latest order) and win their URL slot; existing
  // discs that weren't re-found trail after the new posts
  const freshUrls = new Set(found.map((s) => s.url));
  return [...found, ...existing.filter((s) => !freshUrls.has(s.url))].slice(0, max);
}

async function searchTweets(key: string): Promise<Tweet[]> {
  const tweets: Tweet[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < PAGES; page += 1) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, queryType: "Latest", cursor }),
    });
    if (!response.ok) {
      // 401/402 = key missing/unfunded — say which, one line, exit non-zero.
      throw new Error(`TwitterAPI.io ${response.status}: ${(await response.text()).slice(0, 120)}`);
    }
    const payload = (await response.json()) as { tweets?: Tweet[]; next_cursor?: string };
    if (!Array.isArray(payload.tweets)) {
      throw new Error(`Unexpected payload: ${Object.keys(payload).join(", ")}`);
    }
    tweets.push(...payload.tweets);
    cursor = payload.next_cursor;
    if (!cursor) break;
  }
  return tweets;
}

function list(label: string, supporters: Supporter[]): void {
  console.log(`${label}: ${supporters.length}`);
  for (const s of supporters) console.log(`  @${s.handle}  ${s.url}${s.avatar ? "" : "  (no avatar — initials disc)"}`);
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const key = process.env.TWITTERAPI_IO_KEY;
  const existing = JSON.parse(readFileSync(JSON_PATH, "utf8")) as Supporter[];

  if (!key) {
    list("Listed (current supporters.json)", existing);
    console.log("\nNo TWITTERAPI_IO_KEY — search skipped. Set it to scan X for @riprapxyz mentions.");
    process.exitCode = write ? 1 : 0;
    return;
  }

  const tweets = await searchTweets(key);
  if (tweets.length === 0) {
    // never an empty overwrite (bean acceptance): zero mentions is a stop, not a reset
    console.error(`No mentions found for ${QUERY} — supporters.json left untouched.`);
    process.exitCode = 1;
    return;
  }

  const found = tweets.map(toSupporter).filter((s): s is Supporter => s !== null);
  const merged = mergeSupporters(existing, found);
  list("Found", found);
  list("Merged", merged);

  if (!write) {
    console.log("\nDry run — pass --write to update src/supporters.json.");
    return;
  }
  writeFileSync(JSON_PATH, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`\nWrote src/supporters.json (${merged.length} supporters). Commit + push deploys it.`);
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(String(error));
    process.exit(1);
  });
}
