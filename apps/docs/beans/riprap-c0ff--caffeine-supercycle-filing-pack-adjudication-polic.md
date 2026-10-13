---
# riprap-c0ff
title: Caffeine Supercycle filing pack + adjudication policy pack
status: todo
type: task
priority: normal
tags:
    - landing
    - bounty
created_at: 2026-10-13T00:00:00Z
updated_at: 2026-10-13T00:00:00Z
---

The merged hot-drink bounty (slug `caffeine-supercycle`, terms: `meta/Breakpoint/Micro Bounty — Caffeine Supercycle - Terms.md`) shipped with directory entry, pool page, and hero only. Still owed before claims can flow through this pool:

- **Filing pack** — `apps/landing/src/app/file-claim/flows/caffeine-supercycle.ts`, keyed by `claimFlow: "caffeine-supercycle"` in `apps/landing/src/mutuals/data.ts` (pattern: `toly-needs-his-fuel.ts`). Proof set per terms §7: ticket, ID, request evidence, delivery evidence, confirmation (pasted URL), no declaration slot (wallet signature is the statement of facts — founder precedent). Needs one new flow-pack capability: a **named-person selector** (roster: Lily Liu / Anatoly "Toly" Yakovenko / Raj Gokal) ahead of the request-evidence slot — the claim must state which named person the drink went to, and the roster is fixed when joining closes.
- **Adjudication policy pack** — `apps/landing/src/adjudicate/policies/caffeine-supercycle.ts`, keyed by `adjudicationPolicy: "caffeine-supercycle"` in `data.ts` (pattern: `blade-pool.ts`; zero numbers, every numeral a chain read; question set from terms §3/§4/§7).

The three single-person hot-drink pools (Raj/Lily/Toly) stay listed and devnet-deployed; their Toly filing pack keeps working unchanged.
