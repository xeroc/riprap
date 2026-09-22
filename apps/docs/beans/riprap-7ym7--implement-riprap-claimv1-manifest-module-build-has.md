---
# riprap-7ym7
title: Implement riprap-claim/v1 manifest module (build, hash, canonical paths, option block)
status: completed
type: task
assigned: implementer
created_at: 2026-09-22T14:00:08Z
updated_at: 2026-09-22T18:35:00Z
parent: riprap-qmtr
blocked_by:
    - riprap-kic0
---

## Summary of Changes

`apps/landing/src/app/file-claim/manifest.ts` — pure module, no chain/React:

- `serializeClaimManifest(input)`: the exact CLAIM-WIZARD §5 layout (key
  order, quoting, flow maps, trailing newline — all part of the hash).
  Deterministic: same input → same bytes, so the on-chain `evidence_hash`
  reproduces months later (recovery gate).
- `buildClaimManifest(input)`: one serialization yields `{ yaml, sha256Hex }`
  together — callers never re-serialize (spec §5's one-buffer rule).
- `sha256Hex(bytes)`: WebCrypto subtle digest → 64 lower-case hex; no new
  dependency (the workspace has no yaml/sha256 lib in the landing graph; the
  fixed shape needs neither).
- Canonical paths: `CLAIM_DOCUMENT_PATHS` — the five policy §7 documents in
  order; serialization rejects any other set/length (incomplete proof sets
  are not adjudicated; wrong paths are daemon 400s).
- Fixed option block: `{ recipe: hanse-opt/v1, labels: ["Approve", "Deny"] }`
  — no filer salt (EVENT-MUTUAL amendment).
- Validation at the trust boundary: base58 addresses, ISO-8601-UTC
  timestamps, 64-hex leaf hashes, YAML double-quote escaping for the two
  member-typed free-text fields (title, incident_place); control chars
  rejected.
- Amounts are raw micro-USDC `bigint` (spec example: $2,000 → 2000000000).

Smoke tests colocated (`manifest.test.ts`): §5 example → exact golden bytes,
independent digest equality, non-canonical entry rejection. The full
byte-stability/canonical-path/provenance suite is riprap-7qad's to extend.

Verify: `ACCORD_SO=/tmp/accord-pin/target/deploy/accord.so pnpm verify` exit
0; landing 84/84; lint 0 errors (73 warnings pre-existing in tests/src).
