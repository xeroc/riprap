---
status: accepted
---

# 0009 — kitty is a separate circle program; templates are programs, not modes

Decided 2026-10-21 (design grilling, session consensus). Ongoing pools —
recurring contributions, epoch-bounded cover, adjudicated payouts of any
amount — get a new sibling template program: `kitty`, domain word `circle`
(accounts `Circle`/`Member`/`Request`, PDA seeds `[circle, …]`). The hanse
program is byte-frozen through the Breakpoint pilot; the pool program stays
generic custody + accounting and gains exactly one instruction: a
per-depositor exit (ownership-authority gated, ratio-neutral), landing
post-pilot.

## Why

- **hanse is deployed and live** with the pilot event 25 days out. The epoch
  fields would fit in `Mutual`'s padding, but the *instruction flow* doesn't:
  renew/advance/exit only make sense for ongoing pools, deposits_close_at and
  the settlement freeze only for event pools — every instruction would branch
  on a mode flag, and every codegen'd client call grows an `if mode`. That is
  an upgrade of the one program about to insure real people, mid-crunch, for
  a roadmap feature.
- **The mode flag doesn't unify anything — it relocates the split to where
  it's most expensive to change.** Deployed account layouts, audit surface,
  and e2e churn all grow; the two-pool discriminated union exists either way.
- **The repo pattern already is "template programs over a generic pool"** —
  hanse orchestrates pool for event mutuals; kitty orchestrates it for
  circles. Finite-vs-ongoing is a template choice, not a pool parameter
  (PROJECT.md: "lifecycle is a parameter" at the *product* layer).

## Decision

- One template = one program. kitty gets its own PDA domain (`circle`,
  `member`, `circle`-scoped) — no address clash with hanse's seeds; no shared
  accounts.
- pool (deployed, unchanged behavior) grows only `exit_depositor`: pays
  `depositor.total / pool.total_amount × treasury` atomically, decrements
  both, ownership-authority gated. The *when* of exits stays in the template
  (kitty: only at a boundary the member's paid cover has ended). Never a
  mode enum in any deployed program.
- Listing UX is unified at the SDK/store seam, not on-chain: the landing
  store becomes a two-arm union (`hanse mutual | kitty circle`) resolving to
  one listing shape; the def doc (`riprap-def/v1`) grows a `template` field
  and the entry-credential issuer. Wallets list SPL and Token-22 in one view;
  nobody demands they be one program.

## Consequences

- Third program in the workspace: codegen, SDK facade, CLI topic, cranker
  modules, e2e specs per template — the propagation cost IS the price of
  frozen pilots. The AGENTS.md Parts table gains the row when the code lands
  (bean-tracked, same change).
- hanse can eventually merge into a shared core crate with kitty if
  duplication itches; deliberately not done until the second template exists.
- `pool::exit_depositor` is a pool upgrade → ships after Breakpoint 2026
  (soft gate, tracked in the kitty milestone).
