---
# riprap-kic0
title: Author copy doc sections + route scaffolding (main.tsx case, entry.tsx, llms.txt, router test)
status: completed
type: task
assigned: implementer
created_at: 2026-09-22T14:00:08Z
updated_at: 2026-09-22T18:20:00Z
parent: riprap-qmtr
---

## Summary of Changes

Copy doc (`meta/marketing/03-website-copy/landing-page.md`):
- § `/app` amended: `This surface only reads.` retired (CLAIM-WIZARD §2), intro
  rewritten (payout request is the surface family's one write), new bullets for
  the `File a payout request` action (preflight-gated) and claim-row evidence
  status + recovery re-entry (for riprap-wwvc); stale `slider locked` note
  corrected to the 2026-09-21 covered-overlay reality.
- § `/app/file-claim` authored in full: head/title, frame + deep-link wallet
  gate, emergency banner (999/112 mono, proof-list link), step-0 preflight
  states (open claim / window closed / fee short, live subaccord provenance),
  steps 1–5 (incident self-screen vs policy §3/§4, amount + cap, five proof
  slots in policy §7 order with format/size gates, manifest + sha256 +
  recovery download, review fee economics + scaling + appeals), SIGN phases +
  nonce race, PUBLISH per-doc states + 409 hard stop + operator-down, FILED
  screen (timeline rail, fee note, keep-manifest), draft-persistence law.

Route scaffolding:
- `src/main.tsx`: `#/app/file-claim` case, `<title>` `Riprap: File a payout
  request`, lazy `src/app/file-claim/entry.tsx`.
- `src/app/file-claim/`: entry (SolanaProviders mount, chain code out of the
  platform chunk) + `FileClaimPage` shell — emergency banner (leads every
  step), wizard wallet gate, preflight loading line (the branch the
  wizard-flow beans resolve into gate states); mount tests (banner copy
  verbatim, gate, connected preflight line).
- Shared `/app`-family wallet controls extracted to `src/app/controls.tsx`
  (ClusterSwitch/AccountControls/ConnectWalletButton/AppNavControls);
  `AppPage.tsx` slimmed to imports; gate line retired there + in its test.
- Router tests: wizard case (trailing slash, not `#/app`, title swap).
- `public/llms.txt`: `File a payout request` page entry.
- AGENTS.md Frontends row: route + `src/app/file-claim/entry.tsx` +
  `src/app/controls.tsx` recorded.

Pre-existing red repaired (gate law — red before this change is part of the
task): 8 stale `BreakpointPage.test.tsx` tests vs the 2026-09-21
picker-behind-wallet + covered-overlay commits — ready sentinels moved to the
CTA / connected wallet, chip-in test reordered overlay-first (two
`Covered — Standard` stamps), covered-view slider/tier-line assertions
dropped (view no longer carries a picker), anchored-terms heading updated to
`The immutable terms of this mutual.` Landing suite 81/81.

Environment repairs (no source change; recorded for the lane): `target/` was
wiped — pool/hanse deploy keypairs restored from
`/home/xeroc/projects/Accord/{PuuL…,hanseP4…}.json` (also fixing a stale
nested `programs/pool/target/deploy` keypair) and `pool.so` rebuilt via
`anchor build -p pool`. The sibling `../accord` checkout was rebuilt today at
`bc1aec4` as sBPFv3 (unloadable by riprap's litesvm 0.10); the pinned
`ba91bd8` artifact was rebuilt in a detached worktree — lane runs need
`ACCORD_SO=/tmp/accord-pin/target/deploy/accord.so` until the sibling's
deploy artifact matches the pin again.

Verify: `ACCORD_SO=/tmp/accord-pin/target/deploy/accord.so pnpm verify` exit 0
(build + lint + all tests + anchor build + cargo test); lint warnings
pre-existing (`tests/src/` non-null assertions, untouched).
