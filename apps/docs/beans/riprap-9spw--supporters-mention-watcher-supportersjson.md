---
# riprap-9spw
title: Supporters mention watcher — @riprapxyz mentions → supporters.json
status: in-progress
type: task
priority: normal
tags:
    - ts
    - landing
created_at: 2026-09-24T12:00:00Z
updated_at: 2026-09-24T12:00:00Z
parent: riprap-kctm
---

Build the script that feeds the front-page supporter discs (copy doc §5.6, `apps/landing/src/sections/Supporters.tsx`). The covered overlay's share field already asks members to post with @riprapxyz; this script closes the loop — every real mention becomes a disc.

## Scope

- A runnable script (cron/scheduled job, not request-time) that searches mentions of `@riprapxyz` on X and Farcaster (warpcast) — the three share intents the overlay opens (`twitter.com/intent/tweet`, `warpcast.com/~/compose`, `t.me/share/url`) all land on those two public surfaces; Telegram shares are private and out of scope.


## Progress (2026-09-24)

Script shipped: `apps/landing/scripts/supporters.mts` (+ `supporters.test.ts`, pure merge/normalize law) — X search via TwitterAPI.io (`POST /twitter/tweet/search`, query `@riprapxyz -from:riprapxyz -is:retweet`, 3 pages ≈ 100 posts), dedupe by post URL with fresh entries leading, cap 24, dry-run by default / `--write` applies / zero-mentions or API error leaves the file untouched and exits non-zero. Provider confirmed against the session's twitterapi MCP (same backend — one funded `TWITTERAPI_IO_KEY` lights up both). Remaining: fund the key (TwitterAPI.io dashboard — X's official search API costs $200/mo, this is cents per run), first audited `--write` run, then schedule (cron hourly during the Breakpoint deposit window). Farcaster add-on (Neynar key) still open.

- Cap the list (e.g. newest 24) so the band stays a row, and re-run on a cadence that matches the campaign (hourly during the Breakpoint deposit window is plenty).
- Rate limits/auth: X API search needs a bearer token (env var, never committed); Farcaster has public hubs/`searchcaster`-class endpoints — pick what's alive at build time and record the choice here.

## Acceptance

- Running the script with ≥1 real mention updates supporters.json and the deployed front page shows the disc linking the post.
- Zero mentions / API down → file untouched, exit non-zero with a one-line reason; never an empty overwrite.
