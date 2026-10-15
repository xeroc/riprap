---
# riprap-i6c3
title: 'Implement riprap-def/v1 module: schema, canonical renderer, §-parser, validators'
status: completed
type: task
assigned: implementer
assigned: implementer
priority: high
created_at: 2026-10-15T08:00:49Z
updated_at: 2026-10-15T08:00:49Z
parent: riprap-plok
---

- [x] `apps/landing/src/mutuals/def/schema.ts` — parse + strict-validate the frontmatter contract (milestone HANDOFF §2): unknown keys rejected, kind enum, slug kebab-case, tiers 1-3 (fee > 0, cap >= fee), proof slot grammar (`NN-slug.ext` ordinals unique, kind file|url), period sanity (claims_close > end >= start), language default "en".
- [x] `render.ts` — canonical renderer: fixed key order, stable whitespace, no timestamps; frontmatter + 11-§ body with the two kind word-maps; chosen economics rendered into §7 prose (numbers allowed in doc bytes).
- [x] `sections.ts` — inverse §-parser (body markdown -> § blocks) for the doc bands.
- [x] `validate.ts` — the validation matrix (one exported rejection per milestone HANDOFF §3/§6).
- [x] `.changeset/riprap-def-v1-format.md` (patch — internal module, no route yet).
- Data contract + constraints: milestone riprap-9bh4 HANDOFF §2/§3. No UI, no chain, no daemon calls.

## Summary of Changes

Four pure modules under `apps/landing/src/mutuals/def/`, no imports added
beyond `../types` (PoolKind, MutualTier):

- `schema.ts` — the artifact envelope (`splitDefDocument`) and a strict
  parser for exactly the canonical frontmatter grammar: unknown keys,
  duplicate keys, missing required keys, wrong value types, and foreign
  YAML throw `DefFormatError`; typed `DefFrontmatter` result (language
  normalizes to "en"). Grammar inverse of render.ts; `dq` exported so
  emitter and unescaper share one escape map.
- `render.ts` — `renderDef(DefInput) → string`: fixed key order, strings
  always double-quoted, integers bare, no timestamps. Body = the 11 §s:
  kind-templated skeleton prose, §5 tier table and §2 period block from
  the machine block, §3 definition blocks / §4 exclusion bullets verbatim,
  §7 proof list from `proof` slots (label + verify), optional §7
  adjudication-fee sentence from `economics.filingFeeUsdc`. Throws on
  empty prose / zero tiers / zero proof.
- `sections.ts` — the kind title maps (§ word-maps mirror the
  first-party Micro Mutual / Micro Bounty docs: Coverage Period/Bounty
  Period, Covered Event/Qualifying Delivery, Coverage and Price/Bounty
  and Price, Pool/The Pot, Payout Requests/Claims, Pool
  Dissolution/Winding Up) and `parseSections` (body → § blocks, trailing
  `---` separators stripped).
- `validate.ts` — `DefRejection` union (one code per matrix row:
  unknown-schema, bad-kind/slug/name, bad-period not-iso/not-a-date/
  order/empty, bad-tier-count, bad-tier naming the tier, proof-empty,
  bad-slot grammar/ordinal-duplicate/bad-kind/kind-mismatch/empty-
  optional, bad-marketing, bad-language, bad-prose, bad-body, malformed)
  + `validateFrontmatter`, `validateDefInput` (wizard pre-render),
  `validateDefArtifact` (CAS bytes → whole-artifact verdict: parse +
  matrix + 11-§ body structure).

Verification: implementer scratch suite (determinism, Chairmageddon
mutual + Caffeine Supercycle bounty round-trips with §5 tables from doc
facts, rejection matrix incl. cap-below-fee naming the tier, duplicate
ordinals, period order) — 4/4 green, then deleted; the dedicated test
bean is riprap-04yu. `pnpm --filter @riprap/landing run build` green,
`pnpm lint` zero errors (def/ zero diagnostics; remaining warnings
pre-existing in tests/), full landing suite 46 files / 410 tests green.
