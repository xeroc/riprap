---
# riprap-vqoa
title: 'Test def resolution: store, packs, hero, fallback'
status: todo
type: task
assigned: tester
priority: normal
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-hs4r
blocked_by:
    - riprap-jo1k
    - riprap-8vue
    - riprap-97b6
---

- [ ] Store tests (mock CAS): valid def listed in community band with derived fields; 404 / hash-mismatch / unknown-schema dropped
- [ ] Pack-builder golden tests vs the def-format fixtures; zero-numbers assertion; slot-path parity between built ClaimFlow and AdjudicationPolicy (blade-pool parity test generalized)
- [ ] GenericPoolHero render test: data bindings, template defaults when marketing absent, {{PARAM}} states
- [ ] Registry fallback test: unknown pubkey -> GenericPoolPage
- [ ] De-blading regressions: manifest/parser reject default-slot use; DocumentsStep renders pack strings; url slot accepts non-x.com https
- [ ] Devnet browser pass: CLI-deployed mutual with published def appears in community band, joins through generic hero, files a claim with def-driven slots, juror session runs with def-driven policy
