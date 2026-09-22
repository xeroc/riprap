---
# riprap-042l
title: Review foundation (spec conformance, copy quotes, kit chrome only)
status: completed
type: task
assigned: reviewer
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T19:00:00Z
parent: riprap-qmtr
blocked_by:
    - riprap-7qad
---

## Review verdict: PASS — one defect found and fixed in-review

Scope reviewed: riprap-kic0 (copy + route scaffold), riprap-7ym7 (manifest
module), riprap-7qad (manifest suite) — commits kmpvyvsw, xlluoxut, ytolluzq.

### Spec conformance (CLAIM-WIZARD §2/§5/§10)
- §2 routing: all six artifacts present and exact — copy doc § `/app` amended
  + § `/app/file-claim` authored (source of every string), `main.tsx` case,
  `<title>` `Riprap: File a payout request` (verbatim), lazy
  `src/app/file-claim/entry.tsx`, router-test case, `public/llms.txt` entry.
- §5 manifest: the 19-test suite pins the worked example to golden bytes;
  `options` block is byte-fixed with no input field that could vary it
  (no filer salt); `evidence_hash = sha256(utf8(manifest.yaml))` proven by
  independent digest + per-field sensitivity; one-serialization API makes
  re-serialize impossible for callers.
- §10 propagation: AGENTS.md Frontends row records the route + controls
  module. The `@useaccord/sdk/evidence` Parts edge correctly NOT present —
  no such import exists yet; it rides with the evidence-client work (wizard
  epic; AGENTS edge is riprap-17xq's).

### Copy quotes
- FileClaimPage renders § `/app/file-claim` verbatim: gate (H1 `Payout
  request`, body `Connect the wallet you joined with. Filing needs its
  signature.`, `Connect a wallet`), emergency banner (mono `FIRST`, exact
  sentence, `the five required proofs` → pool page, 999/112 mono `data-num`),
  preflight loading line. AppPage gate line retired exactly per §2.
- llms.txt entry matches the copy doc's head description line.

### Kit chrome only
- No hex values, no raw `<button>/<input>`, no arbitrary border/color
  classes; every control is kit (`Button`, `WalletDialog`, `ClusterSelect`,
  `AddressChip`) or the shared chrome components (`SiteNav`, `Settle`,
  `SectionBand`, `HexBackdrop`, `TextLink`); utility vocabulary matches
  existing chrome (`border-hairline`, mono-label pattern). Platform route
  stays `@solana/*`-free; chain code confined to the route module.

### Defect found and fixed (rides in this change)
- The emergency banner used `bg-surface` — no such Tailwind theme token
  exists (the theme maps `--color-card` → `bg-card`); the class was silently
  dead and the banner rendered transparent over the backdrop. Fixed to
  `bg-card`. Verify after fix: file-claim suites 19/19, tsc clean, lint 0
  errors.

### Notes, not blockers
- Preflight gates (open claim / window closed / fee short) are wizard-epic
  scope; the shell's loading branch is documented as their mount point.
- `pnpm verify` green via
  `ACCORD_SO=/tmp/accord-pin/target/deploy/accord.so` (pinned-rev artifact
  rebuilt in a detached sibling worktree — sibling HEAD moved to sBPFv3;
  lane note in riprap-kic0's summary).
