---
# riprap-sbkp
title: 'Copy doc: pool on-chain states + juror modal copy (own commit)'
status: completed
type: task
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-17T20:20:00Z
parent: riprap-wan9
---

## Summary of Changes

- meta/marketing/03-website-copy/landing-page.md (vault, via meta symlink): new subsection "On-chain states + juror modal" under the pool page section — loading / cluster-unreachable retry / not-live-on-this-cluster / connect prompt / building·signing·confirming progress labels / log-derived failure toast fallback, insufficient-USDC ({{balance}}/{{tier}}/{{fee}} slots) + SOL pre-check reason + devnet Circle-faucet line, deposits-closed pair, Covered — {{tier}} stamp + /app subline, and the OK-only juror modal ({{min_stake}} ← mutual.min_stake, reference $10 per messaging-guide Numbers table). Number provenance stated inline ({{fee}}/{{tier}} ← mutual.tiers, policy §5).
- Approval gate noted in the subsection heading: Fabian approves before any component renders these strings.
- Docs-only: no code touched; no lint/typecheck/test surface applies (copy doc consumed by convention, not build).

meta/marketing/03-website-copy/landing-page.md gains: loading/not-found-on-cluster/insufficient-balance/deposits-closed strings, covered-stamp label, juror modal copy with {{min_stake}} slot bound from mutual.min_stake. Deadpan-honest, no emoji, numbers as sourced. Fabian approves before any component renders it. Docs-only commit.
