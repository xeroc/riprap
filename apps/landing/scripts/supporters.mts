/**
 * supporters.mts — the mention watcher (bean riprap-9spw, copy doc §5.6):
 * finds posts on X that mention @riprapxyz and turns them into the front
 * page's supporter discs (`src/supporters.json` — handle, post URL, and a
 * local avatar: --write downloads each image into `public/pfp/` and the json
 * carries `/pfp/<handle>.<ext>`, so discs never hotlink pbs.twimg.com —
 * those URLs die the moment a supporter changes their picture).
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
 * --write also downloads every avatar into public/pfp/ — commit the images
 * together with the json (they are the deploy's disc images).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const HANDLE = "riprapxyz";
// Exclude our own posts (broadcasts, not support) and retweets (no new
// mention). Everything else mentioning the handle counts as support.
const QUERY = `@${HANDLE} -from:${HANDLE} -is:retweet`;
const MAX_DISCS = 24; // the band is a row, not a wall — bean riprap-9spw
const PAGES = 3; // ≈ up to ~100 posts per run; plenty between deploys

const JSON_PATH = new URL("../src/supporters.json", import.meta.url);
const ENDPOINT = "https://api.twitterapi.io/twitter/tweet/advanced_search";

const PFP_DIR = new URL("../public/pfp/", import.meta.url);

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

/** local disc-image filename: the handle (X handles are [A-Za-z0-9_] —
 * sanitized anyway, it becomes a filename) + the remote extension, jpg
 * when the URL has none. Stable per person: a new avatar overwrites. */
export function pfpName(handle: string, remote: string): string {
  const safe = handle.replace(/[^A-Za-z0-9_-]/g, "_");
  const ext = /\.(jpe?g|png|webp|gif)$/i.exec(new URL(remote).pathname)?.[1]?.toLowerCase();
  return `${safe}.${!ext || ext === "jpeg" ? "jpg" : ext}`;
}

/** download one remote avatar into public/pfp/ and return its served path;
 * null = the image is gone (404 on every variant) — the caller drops the
 * disc to its initials; a network throw keeps the previous avatar. */
export async function downloadAvatar(handle: string, remote: string): Promise<string | null> {
  // _normal is 48px — blurry at the 48 CSS-px disc on retina; pbs serves the
  // same image larger on request, but not every variant exists (the odd .png
  // 404s upscaled) — fall back to the URL exactly as delivered.
  const upscale = remote.replace(/_(normal|bigger|mini)(?=\.)/, "_400x400");
  let response = await fetch(upscale);
  if (!response.ok && upscale !== remote) response = await fetch(remote);
  if (!response.ok) {
    console.error(`  avatar @${handle}: HTTP ${response.status} — keeping previous`);
    return null;
  }
  mkdirSync(PFP_DIR, { recursive: true });
  const file = pfpName(handle, remote);
  writeFileSync(new URL(file, PFP_DIR), Buffer.from(await response.arrayBuffer()));
  return `/pfp/${file}`;
}

/** merge into the disc row — ONE disc per person: the first occurrence of a
 *  handle wins its disc. Found entries lead (API Latest order), so that's
 *  each person's newest post; handles that weren't re-found keep their
 *  existing disc and trail after the fresh ones. Capped at MAX_DISCS. */
export function mergeSupporters(
  existing: Supporter[],
  found: Supporter[],
  max = MAX_DISCS,
): Supporter[] {
  const byHandle = new Map<string, Supporter>();
  for (const supporter of [...found, ...existing]) {
    if (!byHandle.has(supporter.handle)) byHandle.set(supporter.handle, supporter);
  }
  return [...byHandle.values()].slice(0, max);
}

async function searchTweets(key: string): Promise<Tweet[]> {
  const tweets: Tweet[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < PAGES; page += 1) {
    const params = new URLSearchParams({ query: QUERY, queryType: "Latest" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { "X-API-KEY": key },
    });
    if (!response.ok) {
      // 401/402 = key missing/unfunded — say which, one line, exit non-zero.
      throw new Error(`TwitterAPI.io ${response.status}: ${(await response.text()).slice(0, 120)}`);
    }
    const payload = (await response.json()) as {
      tweets?: Tweet[];
      next_cursor?: string;
      has_next_page?: boolean;
    };
    if (!Array.isArray(payload.tweets)) {
      throw new Error(`Unexpected payload: ${Object.keys(payload).join(", ")}`);
    }
    tweets.push(...payload.tweets);
    cursor = payload.has_next_page ? payload.next_cursor : undefined;
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
  let key = process.env.TWITTERAPI_IO_KEY;
  // cron shells don't inherit exports — the landing's .env may carry the key
  if (!key) {
    try {
      process.loadEnvFile(new URL("../.env", import.meta.url));
      key = process.env.TWITTERAPI_IO_KEY;
    } catch {
      /* no .env — handled below */
    }
  }
  const existing = JSON.parse(readFileSync(JSON_PATH, "utf8")) as Supporter[];

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

  let downloaded = 0;
  if (write) {
    // every http avatar (fresh from the API or stale in the json) becomes a
    // local /pfp/ file; 404 = image gone → initials disc, a network throw
    // keeps that disc's previous avatar
    for (const s of merged) {
      if (!s.avatar?.startsWith("http")) continue;
      try {
        const local = await downloadAvatar(s.handle, s.avatar);
        if (local) {
          s.avatar = local;
          downloaded += 1;
        } else {
          delete s.avatar; // image gone — the mono initials disc takes over
        }
      } catch (error) {
        console.error(`  avatar @${s.handle}: ${String(error)} — keeping previous`);
      }
    }
  }
  list("Merged", merged);

  if (!write) {
    console.log("\nDry run — pass --write to download avatars into public/pfp/ and update src/supporters.json.");
    return;
  }
  writeFileSync(JSON_PATH, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(
    `\nWrote src/supporters.json (${merged.length} supporters, ${downloaded} avatars in public/pfp/). Commit + push deploys it.`,
  );
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(String(error));
    process.exit(1);
  });
}
