---
# riprap-plok
title: 'Def format: riprap-def/v1 artifact (schema, canonical renderer, validators)'
status: todo
type: epic
priority: high
created_at: 2026-10-15T08:00:11Z
updated_at: 2026-10-15T08:00:11Z
parent: riprap-9bh4
---

The `riprap-def/v1` artifact (milestone D1/D2): one markdown file - YAML
frontmatter (machine block) + the 11-§ terms body - deterministically
rendered so `sha256(whole file)` is a stable `policy_hash`. Pure module +
colocated tests under `apps/landing/src/mutuals/def/`, no UI, no chain or
daemon changes (the hash feeds the existing `domainRefHex` path unchanged).

Machine block is exactly the milestone HANDOFF §2 frontmatter contract.
Body renderer carries the two kind word-maps (mutual: Coverage Period /
Pool / Payout Requests / Pool Dissolution; bounty: Bounty Period / The Pot /
Claims / Winding Up). Doc prose MAY carry numbers; the zero-numbers law
governs UI packs, not doc bytes. §-section parser is the inverse (body
markdown -> § blocks) and feeds the def-resolution epic's doc bands.

Acceptance = milestone HANDOFF §5 items 1-3 (determinism, worked vectors
Chairmageddon + Caffeine Supercycle, validation matrix) + round-trip
(renderer output parses back). See milestone riprap-9bh4 HANDOFF for the
data contract, constraints, and test matrix - not repeated here.

Tasks: implement -> test -> review (chained).
