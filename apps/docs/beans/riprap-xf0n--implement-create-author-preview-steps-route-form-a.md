---
# riprap-xf0n
title: 'Implement #/create author + preview steps (route, form, advanced drawer)'
status: todo
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:52Z
updated_at: 2026-10-15T08:01:52Z
parent: riprap-gob1
---

- [ ] `src/main.tsx` router case + `<title>` + lazy CreatePage; router-test case; `public/llms.txt` entry; copy in meta/marketing/03-website-copy/landing-page.md first (source-doc law — PR quotes the line)
- [ ] Author form over the def schema (name, kind, peril definition, exclusions, tiers 1-3, period + venue, proof slots with file|url + optional verify, roster if bounty, marketing optional); kind is a copy-selector only
- [ ] Advanced drawer: ALL 17 initialize_mutual inputs (milestone HANDOFF §2), §12 pilot preset pre-filled, evidence_operator = riprap daemon default (env-resolved, overridable), client-side mirror of every on-chain gate with mapped one-line deadpan notes
- [ ] Preview: deterministic doc render + policy_hash + derived domain_ref (mono), live rehash on edit; random u64 seed, re-pick on collision
- [ ] Draft persistence: localStorage fields only (file-claim draft pattern), resumable until deploy succeeds
- [ ] `.changeset/*.md` minor (with the epic's deploy task)
