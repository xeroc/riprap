# @riprap/angel-round

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @riprap/ui@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @riprap/ui@0.10.1

## 0.10.0

### Patch Changes

- [#20](https://github.com/xeroc/riprap/pull/20) [`6ec366c`](https://github.com/xeroc/riprap/commit/6ec366c5d0f20e3c7e13e06309f78e2f4db91843) Thanks [@xeroc](https://github.com/xeroc)! - Intro slide added after the title slide: kicker `introduction`, headline `What an Insurance Actually Does`, a check table in the vision slide's compare grammar — rows labeled by the four moves (01 people pool money, 02 claims get adjudicated by members, 03 pool pays approved claims, 04 risk capital earns yield, offers backstop); the Mutual column checks 01–03, the Insurance column checks 01–04. The single ✗ in row 04 is the mutual-to-insurance delta. Copy per founder direction 2026-10-12, not yet mirrored in meta/PITCH.md.

- Deck re-stage (2026-10-22): the why-now carries named institutional receipts instead of asserted market depth — Lloyds Bank's tokenised-deposit gilt purchase on a public blockchain with its own validator node (LBG press release 2026-01-20), the six-UK-bank shared-ledger sterling pilot (UK Finance), and the GENIUS Act. The vision slide names the settlement intermediaries that collapse (premium finance, custodian, claims desk, paying bank; "fast" renamed "settles instantly"). Two new appendix slides: the industry timeline (2017–22 private-ledger attempts — B3i insolvent '22, AXA fizzy closed '19, Marsh Risk Exchange, BUILDINGBLOCK — against 2025–26 public-rail receipts plus the Everest Group partner-to-scale conclusion and blockchain-in-insurance forecasts with their spread) and the Lloyd's Lab Cohort 17 destination (next-generation ART solicited verbatim; first-loss/tail/pools-stack mapping, modal language). Slide-counter denominator now derived from the slide list (the hand-counted "- 3" had drifted).

- [#20](https://github.com/xeroc/riprap/pull/20) [`6ec366c`](https://github.com/xeroc/riprap/commit/6ec366c5d0f20e3c7e13e06309f78e2f4db91843) Thanks [@xeroc](https://github.com/xeroc)! - Team slide restaged: headline now reads "A Decade of Building What's Next — Before It Was Obvious." with a subheader walking the early-timeline thesis — early for DEX (2014), tokenomics (2016), prediction markets (2018), scalar betting (2022), early again today; years render in JetBrains Mono per the type law. Speaker notes walk the timeline with its referents (BitShares, MakerDAO whitepaper review + Steemit, exbet). Also drops the now-unused `HexBackdrop` import from App.tsx after the founder removed the backdrop from the canvas.

- [#23](https://github.com/xeroc/riprap/pull/23) [`6674a30`](https://github.com/xeroc/riprap/commit/6674a30e5accb6e31891b386caf1d8cbd6f7a023) Thanks [@xeroc](https://github.com/xeroc)! - Two release-pipeline repairs. Format the two decks' slides.tsx with Biome —
  the 2026-10-22 slide re-stage landed unformatted and failed the lint leg.
  Raise testing-library's asyncUtilTimeout to 5s in the landing test setup —
  findBy* waits run on their own 1s clock (not vitest's 20s testTimeout), and
  loaded CI runners missed that budget twice today (CreatePage, BreakpointPage
  ready-state texts), each a different "text not found" flake.

- [#20](https://github.com/xeroc/riprap/pull/20) [`6ec366c`](https://github.com/xeroc/riprap/commit/6ec366c5d0f20e3c7e13e06309f78e2f4db91843) Thanks [@xeroc](https://github.com/xeroc)! - Pitch decks move under `apps/pitches/` with date-prefixed folders (`2026-11-pitch-seed-raise`, `2026-11-demo-worlds-fair`); package names unchanged. New `2026-12-angel-round` deck forked from the World's Fair demo deck as the angel-round working copy. Workspace + changeset globs gain `apps/pitches/*`; deck `@source` paths deepen one level.
- Updated dependencies [[`15db644`](https://github.com/xeroc/riprap/commit/15db64409855032cb3f631421e7b29b608169dac), [`3e195a1`](https://github.com/xeroc/riprap/commit/3e195a1507f0d663f7fccdcec50fa56d7547c3ea), [`bf9a3ce`](https://github.com/xeroc/riprap/commit/bf9a3ce24d512db124ffbe20b8667a90879bd505), [`36ef9b6`](https://github.com/xeroc/riprap/commit/36ef9b6509ce3996d8a237c7bd4eb66fb41386e1), [`ac7f54b`](https://github.com/xeroc/riprap/commit/ac7f54b45908afdc72268cfe3fe5fe4ef853a12f)]:
  - @riprap/ui@0.10.0
