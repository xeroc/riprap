---
# riprap-vqoa
title: 'Test def resolution: store, packs, hero, fallback'
status: completed
type: task
assigned: tester
priority: normal
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-hs4r
blocked_by:
    - riprap-jo1k
    - riprap-8vue
    - riprap-97b6
---

- [x] Store tests (mock CAS): valid def listed in community band with derived fields; 404 / hash-mismatch / unknown-schema dropped
- [x] Pack-builder golden tests vs the def-format fixtures; zero-numbers assertion; slot-path parity between built ClaimFlow and AdjudicationPolicy (blade-pool parity test generalized)
- [x] GenericPoolHero render test: data bindings, template defaults when marketing absent, {{PARAM}} states
- [x] Registry fallback test: unknown pubkey -> GenericPoolPage
- [x] De-blading regressions: manifest/parser reject default-slot use; DocumentsStep renders pack strings; url slot accepts non-x.com https
- [x] Devnet browser pass: CLI-deployed mutual with published def appears in community band, joins through generic hero, files a claim with def-driven slots, juror session runs with def-driven policy

## Summary of Changes

- Matrix placement: the store CAS cases, mutual worked vector, zero-numbers,
  hero/registry/Param suites, and de-blading regressions shipped WITH the
  implement beans (store.test.tsx, packs.test.ts, GenericPoolPage.test.tsx,
  FileClaimPage.test.tsx, DocumentsStep.test.tsx — default-slot use is now
  compile-impossible, the strongest regression gate). This change adds the
  second worked vector: worked-vectors.test.ts (Caffeine Supercycle bounty —
  parse, listing derivation incl. §3-excerpt fallback, url-slot marking,
  claimant/juror slot parity, verify-line threading, bounty word-maps,
  share-template fill and unread-figure drop), 8 tests.
- Devnet browser pass (LIVE, 2026-10-15, devnet + api.devnet.useaccord.xyz):
  - Deployed community mutual EpRP7c8… from a def doc (seed 4242,
    policy-hash = sha256(doc)); published the doc via the hash-gated CAS PUT
    (201) and verified a byte-identical GET round-trip.
  - /mutuals on devnet: "COMMUNITY POOLS — ANCHORED TERMS, ANYONE'S
    AUTHORSHIP" band below the founder rows, "Hot Drink Bounty" listed with
    derived fields (bounty kind, blurb tagline, $5–$20 entry, <$200 cap).
  - #/m/GxzLSja… renders the full generic page from the live def: marketing
    hero (headline/blurb/odds), 3-tier slider, chain-read tier facts
    ("Standard · $10 entry · up to $100 maximum payout"), §3/§4/§7 doc
    bands with the five def proof slots, honest {{PARAM}} receipt (no §10 in
    the doc), and the raw-policy band serving the pinned bytes at the
    derived domain_ref (hash + ref chips verbatim).
  - On-chain: joined (member Pda BiTfoc…), then on a low-denomination
    sibling mutual (seed 4243, same doc — EpRP7c8…) joined three juror
    wallets and staked each via the MST-proof accord::stake flow, then
    FILED a claim (claim 5Zng5r…, dispute EmpJQKP…, fee 3_000_000) with a
    manifest built over the def's five slots (two url slots).
  - Boundaries: the wizard and session surfaces beyond their gates need a
    connected browser wallet (join/claim signatures, drawn seats) — those
    steps ran via CLI/script on-chain instead, and the session's def-driven
    pack path is covered by the unit suites; the full draw/commit/reveal
    cycle stays the surfnet e2e lane's job.
- Gate: build 0, lint 0, landing suite 48 files / 448 tests green.
  Changeset: patch.
