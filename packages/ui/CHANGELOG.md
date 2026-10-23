# @riprap/ui

## 0.10.0

### Minor Changes

- [#18](https://github.com/xeroc/riprap/pull/18) [`15db644`](https://github.com/xeroc/riprap/commit/15db64409855032cb3f631421e7b29b608169dac) Thanks [@xeroc](https://github.com/xeroc)! - Three new lane glyphs for the mechanism band's cards (2026-10-21): `seal` — the terms card, written and sealed at creation (the accent binding mark lands last over the corner); `chip-in` — the fee leaves the member's stone and lands in the pool; `pays-out` — the ruling (one deliberation vote) releases the money through the pool's one door. Same grammar as the existing glyphs: 96×96, stroke 3, token colors only, zero rounded corners, deterministic glyph-clock twins for the traveling blocks, static under reduced motion. Spec'd in `meta/primitives/atoms/`; the landing's mechanism cards carry them at 44px beside title and actor.

- [#18](https://github.com/xeroc/riprap/pull/18) [`bf9a3ce`](https://github.com/xeroc/riprap/commit/bf9a3ce24d512db124ffbe20b8667a90879bd505) Thanks [@xeroc](https://github.com/xeroc)! - Reworks the mechanism band into the group-pool flow explainer. `@riprap/ui` gains the `sign` and `filed` glyphs and the `FlowStep` chrome (glyph column, accent mono ordinal, headline, body). The landing's mechanism band renders the two flows directly — founding and drawing, three numbered glyph-stepped rows each, side by side from md up — with the former pool/joining/claiming tabs retired and their copy folded into the flow descriptions.

### Patch Changes

- [#18](https://github.com/xeroc/riprap/pull/18) [`3e195a1`](https://github.com/xeroc/riprap/commit/3e195a1507f0d663f7fccdcec50fa56d7547c3ea) Thanks [@xeroc](https://github.com/xeroc)! - Vocabulary pass (2026-10-21 founder note): customer-facing copy stops using the insurance words claim/claimant/covered/coverage and runs on request/fund/decide — a member files a payout request, the pool funds it, drawn peers decide. Rendered strings swept across the platform sections, pool pages, community pool pages, /app, the payout-request wizard, the juror session, the create wizard (COVERAGE→TIERS and CLAIMS→TERMS screens), llms.txt, and the kit's visible labels/story copy; the member stamp `Covered — {tier}` becomes `Member — {tier}` and the juror checklist heading "Coverage criteria" becomes "Qualifying criteria". Chain-layer and format identifiers (`Claim`, `file_claim`, `riprap-claim/v1`, `claimFlow`, the `#/app/file-claim` route, kit component names) are unchanged by design, and the deployed Breakpoint policy docs keep their pinned wording.

- [#18](https://github.com/xeroc/riprap/pull/18) [`36ef9b6`](https://github.com/xeroc/riprap/commit/36ef9b6509ce3996d8a237c7bd4eb66fb41386e1) Thanks [@xeroc](https://github.com/xeroc)! - Purpose-pool repositioning sweep outside the landing (2026-10-20 pass). The kit's FooterBand default tagline and story samples say "Purpose pools on Solana." (DESIGN.md § CTA/Footer, synced); the cranker's package description says pools, not mutuals; both decks' platform-register lines say purpose pools (mutual cover framed as the first template — proper nouns, market stats, and instance copy untouched). The on-chain `Mutual` vocabulary is unchanged by design.

- [#18](https://github.com/xeroc/riprap/pull/18) [`ac7f54b`](https://github.com/xeroc/riprap/commit/ac7f54b45908afdc72268cfe3fe5fe4ef853a12f) Thanks [@xeroc](https://github.com/xeroc)! - Map the `muted-foreground` Tailwind theme key onto `--riprap-muted` — the utility generated no CSS before (the theme mapped `muted` and `muted-soft` but not `muted-foreground`), so every `text-muted-foreground` element across the surfaces silently inherited ink. Secondary text now renders muted sitewide.

## 0.9.0

### Minor Changes

- [#16](https://github.com/xeroc/riprap/pull/16) [`72a8026`](https://github.com/xeroc/riprap/commit/72a802663e6e31c4cd5c2555803302a6f6d0f8bf) Thanks [@xeroc](https://github.com/xeroc)! - Make the navbar responsive: below 768px the actions slot (cluster select, wallet controls) and the CTA now collapse into the burger drawer instead of overflowing the mobile bar. The drawer carries the same content as the desktop right side — links first, then a hairline-ruled section with the cluster select, the wallet controls (buttons full-width), and the Open App CTA, which stays dropped inside /app as on desktop. Drawer links and the CTA close the menu on navigate; AppNavControls drops its per-item sm gating since TopNav now owns the breakpoint.

### Patch Changes

- [#16](https://github.com/xeroc/riprap/pull/16) [`ff4760d`](https://github.com/xeroc/riprap/commit/ff4760d4ad397fad412efbae09a608bbba8cfcec) Thanks [@xeroc](https://github.com/xeroc)! - ClaimApproval: the Approved stamp now lands ON the Purpose headline instead of the review column's corner — rotated ~10° counterclockwise, resting over the title like a rubber stamp. Placed by flow layout (a relative row whose negative bottom margin slides the paper up under it), not absolute coordinates, so the overlap is paper-relative and cannot drift with the stage size.

## 0.8.0

### Minor Changes

- [#14](https://github.com/xeroc/riprap/pull/14) [`107eb7e`](https://github.com/xeroc/riprap/commit/107eb7e32223be13d8f8e5c20766f827201fc0d6) Thanks [@xeroc](https://github.com/xeroc)! - Adds `ClaimApproval` to the illustration kit — a looping payout scene (claim submitted → jury reviews against the original purpose, three jurors sign → the approved stamp lands → funds release from the pool back to the member), ported from an external demo and restyled to DESIGN.md: token colors only (adjudication = deliberation, money = funds), drawn connectors and checks instead of text glyphs, mono stamps, an SVG dot grid instead of gradient tricks, and a static completed-payout frame under prefers-reduced-motion.

- [#14](https://github.com/xeroc/riprap/pull/14) [`107eb7e`](https://github.com/xeroc/riprap/commit/107eb7e32223be13d8f8e5c20766f827201fc0d6) Thanks [@xeroc](https://github.com/xeroc)! - Adds `FundingPool` to the illustration kit — the join ceremony as one synchronized act (the purpose agreement settles in and gets signed, the coin rises from the member into the vessel, the level rises, "you're in" stamps), restyled to DESIGN.md: token colors only, the kit's open-top vessel as the pool, mono stamps, a 6s wall-clock loop (position/opacity only), and a static completed-join frame under prefers-reduced-motion.

- Adds a `Tabs` chrome primitive to the kit (Radix, restyled to DESIGN.md: one hairline under the list, mono uppercase triggers, active = ink underline — no pill, no radius, no shadows) and turns the how-it-works band into three tabs: `The pool` keeps the lifecycle story, `Joining` pairs the copy-doc joining text with the FundingPool scene, `Claiming` pairs the payout-request text with the ClaimApproval scene and credits Accord (useaccord.xyz, external) for adjudication. Copy added to the copy doc §2 in the same change.

## 0.7.0

No changes in this release.

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
