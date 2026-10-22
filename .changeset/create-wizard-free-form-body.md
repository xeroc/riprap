---
"@riprap/landing": minor
---

The #/create wizard's policy editor is now one free-form Markdown body: the frontmatter stays machine data and everything after it is the author's, rendered as Markdown (`react-markdown` + GFM with raw HTML skipped and link schemes allowlisted) in the pool page's terms band. The document is hashed whole, so `policy_hash` covers every byte the author writes. The exclusions line reads a `## Exclusions` heading (number optional), the platform promise and winding-up copy are hard-coded instead of synthesized from the doc, and the legacy numbered § docs keep their blockquote/§ extractions. Pre-body drafts fold their old `definition` + `roster` fields into the body on load.
