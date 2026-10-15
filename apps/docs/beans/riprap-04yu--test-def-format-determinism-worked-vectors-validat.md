---
# riprap-04yu
title: 'Test def format: determinism, worked vectors, validation matrix, round-trip'
status: completed
type: task
assigned: tester
priority: normal
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-plok
blocked_by:
    - riprap-i6c3
---

Colocated vitest suite for the def module (see milestone riprap-9bh4 HANDOFF §6, first two rows):
- [x] Determinism: same DefInput renders byte-identical twice
- [x] Worked vectors: Chairmageddon (mutual) + Caffeine Supercycle (bounty) rendered from existing doc facts; §5 tier tables verbatim; byte snapshots
- [x] Validation matrix: every rejection path (tiers, period, slot grammar, unknown keys, kind enum, slug)
- [x] Round-trip: renderer output parses back through sections.ts
- [x] Scoped gate green: pnpm --filter @riprap/landing run test

## Summary of Changes

`apps/landing/src/mutuals/def/def.test.ts` — 31 tests, vectors fact-cited
in the header (data.ts §5 comments + policy/terms §2/§3/§5/§7; Blade §5
trio for en-US thousands grouping):

- Determinism: byte-identical double render; language defaulting carries
  no environment-derived bytes.
- Worked vectors: §5 tables asserted as exact padded rows
  (`| Flat |       $10 |      up to $40 |`, `| Flat |        $5 | up to $50 |`),
  kind word-map title swaps (§2/§3/§5/§6/§7/§8) with §1/§4/§9–§11 pinned
  kind-invariant, full canonical byte inline snapshots for both vectors.
- Validation matrix: unknown-schema, bad-kind, bad-slug (case +
  underscore), bad-name, bad-period (not-iso / not-a-date / order both
  directions / empty venue), bad-tier-count 0 and 4, fee-not-positive,
  cap-below-fee naming the tier, proof-empty, slot grammar (missing /
  short / cased ordinal, bad extension), ordinal-duplicate, bad slot
  kind, kind/extension mismatch both ways, empty optional prose,
  marketing (empty blurb, bad odds row, smallestPayout ≤ 0), bad
  language tag, unknown-key parse throws (top level + nested),
  validateDefInput prose rules, validateDefArtifact malformed /
  section-count / section-title / section-number, and the store-drop
  rule (any rejection ⇒ droppable, never fallback content).
- Round-trip: both vectors parse back — frontmatter deep-equals the
  DefInput machine block, 11 §s numbered 1–11 with kind-matching
  titles, non-empty bodies, no `---` separator leakage.

Verification: def suite 31/31; scoped gate
`pnpm --filter @riprap/landing run test` 46 files / 437 tests green;
`tsc -b` clean; `pnpm lint` zero errors (def/ zero diagnostics —
remaining 68 warnings pre-existing under tests/). Changeset
`.changeset/riprap-def-v1-suite.md` (patch).
