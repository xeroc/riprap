---
"@riprap/ui": patch
---

Map the `muted-foreground` Tailwind theme key onto `--riprap-muted` — the utility generated no CSS before (the theme mapped `muted` and `muted-soft` but not `muted-foreground`), so every `text-muted-foreground` element across the surfaces silently inherited ink. Secondary text now renders muted sitewide.
