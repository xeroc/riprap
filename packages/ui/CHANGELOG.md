# @riprap/ui

## 0.6.0

### Minor Changes

- [#7](https://github.com/xeroc/riprap/pull/7) [`61606e8`](https://github.com/xeroc/riprap/commit/61606e8e6d3cdfc2d43497787b5208c884df98aa) Thanks [@xeroc](https://github.com/xeroc)! - Add `PoolCard` and `MemberRow` chrome components — the platform-register pool card (risk stamp + group display name, numberless by the category law) and the hairline member row (mono handle, avatar disc), first used by the riprap-promo-2026-10 video and available to the landing's future instances surface.

## 0.5.0

No changes in this release.

## 0.4.0

### Minor Changes

- [#1](https://github.com/xeroc/riprap/pull/1) [`7c87153`](https://github.com/xeroc/riprap/commit/7c871532a60f81ef1881c2d257ddd773b5d61026) Thanks [@xeroc](https://github.com/xeroc)! - Added an explainers band to the unlisted blurb page (`#/blurb`), below the email: the founder's six short videos and talks as quoted tweets, two per row, ordered by what they explain — the mutual, the verdict layer, the court, the full mtnDAO demo-day pitch (YouTube talk embedded inline), then the making-of posts. The five native X videos are self-hosted mp4s embedded with their poster frames; the X glyph top-right of each card links to the source tweet. TweetCard in the kit gains optional `media.video` (controllable `<video>` in place of the poster `<img>`), `meta` (engagement stamp beside the date), and the href behavior changed: the X glyph is the permalink while the card stays an `<article>` so interactive media never nests in a link. Tweet bodies are verbatim quotes with permalink provenance in `content.ts`.

## 0.3.0

No changes in this release.

## 0.2.0

### Minor Changes

- initial changeset release
