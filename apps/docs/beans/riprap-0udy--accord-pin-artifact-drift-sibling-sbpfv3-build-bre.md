---
# riprap-0udy
title: 'Accord pin artifact drift: sibling sBPFv3 build breaks bare pnpm verify cargo test'
status: draft
type: task
created_at: 2026-09-22T18:46:55Z
updated_at: 2026-09-22T18:46:55Z
---

../accord HEAD (bc1aec4a) moved to an sBPFv3 fork toolchain; its target/deploy/accord.so is not loadable by riprap litesvm 0.10 (InvalidAccountData in Env::setup, all hanse LiteSVM suites fail). The pinned rev ba91bd8b artifact lives at /tmp/accord-pin/target/deploy/accord.so (built 2026-09-22 18:12). Decide: bump the pin to the fork rev (requires riprap litesvm/toolchain follow) or pin/commit a stable artifact path and document ACCORD_SO as a standing prerequisite in AGENTS.md Completion Gate.
