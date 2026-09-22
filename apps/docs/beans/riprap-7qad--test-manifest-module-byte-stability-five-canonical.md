---
# riprap-7qad
title: Test manifest module (byte stability, five canonical paths, sha256 provenance)
status: completed
type: task
assigned: tester
created_at: 2026-09-22T14:00:08Z
updated_at: 2026-09-22T18:50:00Z
parent: riprap-qmtr
blocked_by:
    - riprap-7ym7
---

## Summary of Changes

`apps/landing/src/app/file-claim/manifest.test.ts` — the full suite (19
tests, subsuming the implementer's smoke):

- Byte stability (CLAIM-WIZARD §5): §5 worked example → exact golden bytes;
  deterministic across builds (recovery re-hashes months later); single
  trailing newline; micro-USDC integers unsuffixed ($2,000 → 2000000000);
  YAML dq escaping of member-typed free text, stable under re-serialization.
- Five canonical policy §7 paths: the exact list in policy order; incomplete
  set rejected; unknown/forged path rejected (ADR-0031 daemon 400 — the cast
  through `unknown` IS the attack); reordered entries rejected; non-64-hex
  leaf rejected.
- sha256 provenance: `evidence_hash = sha256(utf8(manifest.yaml))` —
  independent digest equality; any changed field (title, amount, one leaf,
  dispute) changes the hash; all variants distinct — the manifest is the
  commitment.
- Fixed option block: `hanse-opt/v1`, labels Approve/Deny byte-exact, with
  no input field that could vary it (EVENT-MUTUAL: no filer salt).
- Trust boundary: non-base58 address, non-UTC-ISO timestamps, unescaped
  control characters in free text all rejected.

Verify: landing 97/97; tsc clean; lint 0 errors (73 warnings pre-existing,
tests/src); `ACCORD_SO=/tmp/accord-pin/target/deploy/accord.so pnpm verify`
exit 0.
