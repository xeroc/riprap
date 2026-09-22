---
# riprap-vahh
title: Test wizard flow (mount, state machine, publish retry, recovery re-entry)
status: completed
type: task
assigned: tester
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T19:40:00Z
parent: riprap-5gud
blocked_by:
    - riprap-yr3y
---

## Summary of Changes

The wizard suite extended to the milestone's test matrix (MILESTONE §6) — the wizard file now runs 23 specs (22 green, 1 skip):

- Gate matrix (step 0): not-a-member (shared /app copy + pool-page link), zero rights stake (copy-doc no-stake state), claims window closed (chain-truth close date + no-requests line), no deployment (not-live + zero gate reads), open claim + exact fee shortfall (already pinned in earlier beans' specs, kept).
- State machine: mount/walk 0→5 with per-step Continue gating, cap default, five-hash gate, single-buffer manifest (preview bytes == hashed bytes), draft persistence (shape: fields + {sha256, fileName} only) and reload survival.
- Sign: happy (exactly ONE send), nonce race (first send fails → nonce moved → rebuild + re-sign once → claim #1; exactly two sends), plain send failure (toast + back to review, no second attempt).
- Publish: POST 400 (unknown schema) surfaced loudly — rows failed, unreachable copy, no silent degrade; PUT 409 hard stop (wrong-document copy, no filed screen); NEW: the `retrying` row state is now actually surfaced — `putDocument` gained an `onRetry` callback and the page maps it to the copy-doc `retrying` row word; pinned by a held-response test (500 → retrying visible → released → delivered, tx still sent exactly once).
- Recovery re-entry: `it.skip` with a pointer to riprap-wwvc — the #/app claim-detail surface it tests does not exist yet; unskips when wwvc lands.

Also fixed along the way: afterEach mock resets (a cross-test call-count leak made the not-live assertion count earlier tests' calls).

Verification: file-claim suite 22 passed + 1 intentional skip; landing total 91 passed + 8 pre-existing BreakpointPage failures (draft bean riprap-8ys5, reproduced at the parent revision); `pnpm lint` exit 0; landing build clean.
