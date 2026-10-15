---
# riprap-2kz6
title: 'Implement #/create deploy + publish + verify steps'
status: todo
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:52Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-gob1
blocked_by:
    - riprap-xf0n
---

- [ ] Deploy: build initialize_mutual via `@riprap/hanse` (same sendInstruction seam as join/claim); wallet signs; rent + fees shown before sign; honest failure states (one-line log reads, describeError mapping)
- [ ] Publish: hash-gated CAS PUT of the exact doc bytes at the derived domain_ref (RawPolicyTerms proof-mode path, creator-side); 400/404/409 deadpan lines; explicit skip state (mutual live, doc unpublishable until PUT)
- [ ] Verify: GET round-trip against the ref; link to the pool page (def-resolution surfaces); share row
- [ ] AGENTS.md map edges for #/create in this change
- [ ] `.changeset/*.md` minor
