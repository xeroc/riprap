---
"@riprap/landing": patch
---

Supporter watcher (`scripts/supporters.mts`) no longer hotlinks pbs.twimg.com: `--write` downloads every avatar into `public/pfp/` and `src/supporters.json` carries `/pfp/<handle>.<ext>` paths — those remote URLs die the moment a supporter changes their picture, and `_normal` 48px blur is replaced by the 400px original. Re-found handles refresh their image on every run; existing remote URLs migrate on the next `--write`. Images commit alongside the json.

Dead pbs URLs (supporter changed their picture since the last run) fall back to the mono initials disc instead of shipping a broken image.
