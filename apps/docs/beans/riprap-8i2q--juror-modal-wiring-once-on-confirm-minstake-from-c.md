---
# riprap-8i2q
title: Juror modal wiring — once on confirm, minStake from chain
status: completed
type: task
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-17T14:05:49Z
parent: riprap-wan9
blocked_by:
    - riprap-kctm
    - riprap-sbkp
    - riprap-v78i
---

On join-confirmed signature: JurorUpsellDialog (A3) opens with mutual.min_stake, copy verbatim from doc (D2), OK closes; no persistence machinery (one join per mutual); reload → alreadyMember → stamp, no modal.

## Summary of Changes

- `apps/landing/src/pool/sections/PoolHero.tsx` — JurorUpsellDialog mounts in the hero; `setJurorUpsell(true)` fires ONLY on the join-confirmed transition in `onChipIn` (never on alreadyMember loads — no persistence machinery; one join per mutual). Copy verbatim from landing-page.md § "On-chain states + juror modal" (lines 109-113): heading `The pool needs jurors.`, body with the inline mono stake, button `Noted` (OK-only — Escape/overlay also close via the kit's onOk semantics).
- `apps/landing/src/pool/useMinStake.ts` — the min_stake chain read. The floor does NOT live on the Mutual account (the HANDOFF's "mutual.min_stake" shorthand): it is the accord Subaccord's min_stake (set by the hanse::initialize CPI), reached via `mutual.subaccord` + `@useaccord/sdk`'s `fetchSubaccordMaybe` — the SDK single-source law, no parallel decoding. Missing/pending → `{{PARAM}}` mono placeholder (kit data law); provenance policy §12 / messaging-guide Numbers ($10 reference).
- `apps/landing/package.json` — add `@useaccord/sdk@0.1.0` (same pin as apps/cli + tests). AGENTS.md Cross-repo pin row updated with the landing consumer in the same change.
- Tests: join-flow walk now asserts the modal (title/body/$10 plate/Noted), dismissal, and the post-dismiss slider lock + /app link (open Radix dialog aria-hides the page — asserted first); alreadyMember load asserts NO dialog. Landing 49/49; `pnpm verify` exit 0.
