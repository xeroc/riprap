---
# riprap-gob1
title: 'Wizard UI: #/create - author, preview, deploy, publish, verify'
status: todo
type: epic
priority: high
created_at: 2026-10-15T08:00:34Z
updated_at: 2026-10-15T08:00:34Z
parent: riprap-9bh4
blocked_by:
    - riprap-plok
    - riprap-hxed
    - riprap-hs4r
---

Milestone D7: the browser wizard at a new `#/create` route. Per the
AGENTS.md landing-routes rule this epic carries: src/main.tsx router case +
<title> + lazy import, router-test case, public/llms.txt entry, and its copy
in meta/marketing/03-website-copy/landing-page.md (source-first; PR quotes
the line).

Steps per milestone HANDOFF §1: author (form over the def schema; advanced
drawer with ALL 17 initialize_mutual inputs, §12 pilot preset pre-filled,
evidence_operator = riprap daemon default, client-side mirror of every
on-chain validation gate with mapped one-line notes) -> preview
(deterministic doc + policy_hash + derived domain_ref, live rehash; random
u64 seed, re-pick on collision) -> deploy (initialize_mutual via
@riprap/hanse, wallet signs, rent shown first) -> publish (hash-gated CAS
PUT; 400/404/409 deadpan lines; explicit skip) -> verify (GET round-trip +
pool-page link + share row). Drafts: localStorage fields only, resumable
until deploy succeeds. No server state.

Acceptance = milestone HANDOFF §5 wizard items + devnet end-to-end browser
pass (the wizard's own dogfood). Changeset: minor. AGENTS.md map edges for
#/create ride with the first implement task.

Tasks: implement author+preview -> implement deploy+publish+verify ->
test -> review.
