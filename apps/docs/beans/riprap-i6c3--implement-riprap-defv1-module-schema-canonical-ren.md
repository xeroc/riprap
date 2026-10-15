---
# riprap-i6c3
title: 'Implement riprap-def/v1 module: schema, canonical renderer, §-parser, validators'
status: todo
type: task
assigned: implementer
assigned: implementer
priority: high
created_at: 2026-10-15T08:00:49Z
updated_at: 2026-10-15T08:00:49Z
parent: riprap-plok
---

- [ ] `apps/landing/src/mutuals/def/schema.ts` — parse + strict-validate the frontmatter contract (milestone HANDOFF §2): unknown keys rejected, kind enum, slug kebab-case, tiers 1-3 (fee > 0, cap >= fee), proof slot grammar (`NN-slug.ext` ordinals unique, kind file|url), period sanity (claims_close > end >= start), language default "en".
- [ ] `render.ts` — canonical renderer: fixed key order, stable whitespace, no timestamps; frontmatter + 11-§ body with the two kind word-maps; chosen economics rendered into §7 prose (numbers allowed in doc bytes).
- [ ] `sections.ts` — inverse §-parser (body markdown -> § blocks) for the doc bands.
- [ ] `validate.ts` — the validation matrix (one exported rejection per milestone HANDOFF §3/§6).
- [ ] `.changeset/*.md` (patch — internal module, no route yet).
- Data contract + constraints: milestone riprap-9bh4 HANDOFF §2/§3. No UI, no chain, no daemon calls.
