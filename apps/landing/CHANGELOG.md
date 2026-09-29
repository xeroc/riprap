# @riprap/landing

## 0.4.0

### Minor Changes

- [#1](https://github.com/xeroc/riprap/pull/1) [`7c87153`](https://github.com/xeroc/riprap/commit/7c871532a60f81ef1881c2d257ddd773b5d61026) Thanks [@xeroc](https://github.com/xeroc)! - Added an explainers band to the unlisted blurb page (`#/blurb`), below the email: the founder's six short videos and talks as quoted tweets, two per row, ordered by what they explain — the mutual, the verdict layer, the court, the full mtnDAO demo-day pitch (YouTube talk embedded inline), then the making-of posts. The five native X videos are self-hosted mp4s embedded with their poster frames; the X glyph top-right of each card links to the source tweet. TweetCard in the kit gains optional `media.video` (controllable `<video>` in place of the poster `<img>`), `meta` (engagement stamp beside the date), and the href behavior changed: the X glyph is the permalink while the card stays an `<article>` so interactive media never nests in a link. Tweet bodies are verbatim quotes with permalink provenance in `content.ts`.

### Patch Changes

- [#1](https://github.com/xeroc/riprap/pull/1) [`e5379af`](https://github.com/xeroc/riprap/commit/e5379af6a29df9c764c17650f72f4c85d48cb4f2) Thanks [@xeroc](https://github.com/xeroc)! - Renames the juror/filing fee to the adjudication fee across member-facing copy (pool page stamp and FAQ now carry the policy's 200 USDC with forfeit-on-denial / return-on-failed semantics), corrects sponsor copy — a sponsored membership's claim payments go to the member, the unused remainder to whoever paid the entry fee — and fixes the claim wizard's preflight and review to charge the on-chain filing cost `(min_jury_size + 1) × fee_per_juror` (the +1 unit is the filer's flip-bounty deposit, ADR-0030), so the balance gate no longer under-checks by one fee unit.

- [#1](https://github.com/xeroc/riprap/pull/1) [`56c3310`](https://github.com/xeroc/riprap/commit/56c33105f7b6acf777697a63c414b9f67fb60849) Thanks [@xeroc](https://github.com/xeroc)! - Blade pool page rebuilt around concrete bands: "How this pool runs" (five steps with the pool's actual values), the policy §10 worked example as a receipt, and a nine-question Breakpoint FAQ; the §1–§13 policy and the anchored raw terms now sit behind a collapsed-by-default disclosure with Explained/Raw tabs. The juror serve panel's stake default is the tier contribution floored at the live subaccord minimum, and the covered overlay's juror CTA links `#/app/adjudicate` (the old `#/app#jurors` anchor never resolved under the hash router).

- [#1](https://github.com/xeroc/riprap/pull/1) [`c31c4e0`](https://github.com/xeroc/riprap/commit/c31c4e08dda3a6c59a76e15f15de6df619d88902) Thanks [@xeroc](https://github.com/xeroc)! - Single Solana provider stack at the app root: a wallet connected on any surface (pool page, member app, adjudication, claim wizard) now stays connected across all of them — previously each hash route mounted its own provider and required a fresh connect. The platform landing's first load now includes the connector stack by design (ADR-0007).

- [#1](https://github.com/xeroc/riprap/pull/1) [`e3d1814`](https://github.com/xeroc/riprap/commit/e3d1814a0084e0d0c022abd295b8647772998314) Thanks [@xeroc](https://github.com/xeroc)! - Syncs the policy-details §7 card with the updated cover terms: adds the adjudication-fee stamp (200 USDC, forfeited on denial, returned on failed adjudication) and the wallet-access line, and widens the insolvency sentence to the policy's fee-inclusive trigger — approved payments and returned adjudication fees scale together when the pool is short.

- [#2](https://github.com/xeroc/riprap/pull/2) [`14b8c26`](https://github.com/xeroc/riprap/commit/14b8c2641116f01cf475c3d7868e73ca48c3588e) Thanks [@xeroc](https://github.com/xeroc)! - The policy-details §4 card now lists all eleven policy exclusions verbatim and in the policy's order — the 2026-09-15 eight-item compression had dropped the three contested-claim deciders (staged or collusive assaults, initial aggressor or mutual fight, committing a criminal offence), leaving the "policy, in full" surface narrower than the terms the hash pins and than the FAQ band states.
- Updated dependencies [[`1b7231b`](https://github.com/xeroc/riprap/commit/1b7231b5402da3ba46d527472d60742d4d355222), [`7c87153`](https://github.com/xeroc/riprap/commit/7c871532a60f81ef1881c2d257ddd773b5d61026), [`b302c98`](https://github.com/xeroc/riprap/commit/b302c98c78c2299d9be76f699fe6e51a616a4e7a)]:
  - @riprap/hanse@0.4.0
  - @riprap/ui@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.3.0
  - @riprap/ui@0.3.0

## 0.2.0

### Minor Changes

- initial changeset release

### Patch Changes

- Updated dependencies [`a9f65eb`]:
  - @riprap/hanse@0.2.0
  - @riprap/ui@0.2.0
