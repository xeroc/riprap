---
# riprap-acat
title: Review def format module
status: todo
type: task
assigned: reviewer
priority: normal
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-plok
blocked_by:
    - riprap-04yu
---

Review the def-module diff against the milestone HANDOFF data contract:
- [ ] Frontmatter fields exactly the §2 contract (no extras, no renames)
- [ ] Renderer determinism holds (no clocks, no map-iteration order leaks)
- [ ] §-word-maps cover both kinds; no per-pool content in the module
- [ ] Changeset present
