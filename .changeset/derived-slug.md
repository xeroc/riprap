---
"@riprap/landing": patch
---

The #/create wizard's slug becomes fully derived from the pool name (2026-10-21 founder pass): the editable `Slug` field is retired. `slugify` (create/doc.ts) is upgraded to best practice — NFKD normalization folds accents (café → cafe), ligatures map (ß → ss, ø → o, æ → ae, œ → oe), separators collapse to single hyphens — and a new `poolSlug` (create/slug.ts) appends a counter on collision with a listed pool's route id (`chairmageddon-2`), falling back to `pool` for names with nothing slugable. The doc-format slug contract and the deploy-time validation are unchanged.
