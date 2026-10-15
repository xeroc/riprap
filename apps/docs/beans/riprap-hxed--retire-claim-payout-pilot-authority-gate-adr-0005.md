---
# riprap-hxed
title: Retire claim_payout pilot authority gate (ADR-0005 path)
status: todo
type: epic
priority: high
created_at: 2026-10-15T08:00:17Z
updated_at: 2026-10-15T08:00:17Z
parent: riprap-9bh4
---

Milestone D6 first half: the wizard's self-serve promise needs permissionless
payouts. `claim_payout.rs` carries the pilot pass gate
(`cranker.key() == mutual.authority`, ADR-0005); the other four cranks are
already permissionless. Retire exactly as the AGENTS.md map prescribes, in
ONE change: program constraint out, reconciler mirror + matrix tests out,
ADR-0005 + `meta/specs/EVENT-MUTUAL.md` §7/§12 wording, `anchor build` +
`@riprap/hanse` codegen committed, e2e expectations flipped.

Ship-gate (milestone): the wizard-ui epic does not ship before this epic.

Acceptance = milestone HANDOFF §5 LiteSVM item (third-party cranker
succeeds; old rejection test replaced, not deleted) + full `pnpm verify`
(programs change - Rust legs included). Changeset: patch, `@riprap/hanse`.

Tasks: implement -> test -> review (chained).
