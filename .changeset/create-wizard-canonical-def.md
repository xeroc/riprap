---
"@riprap/landing": patch
---

The #/create wizard now renders its terms through the shared `riprap-def/v1` renderer, so wizard-published pools resolve in the store and render on the generic pool page like every other def. The reader also tolerates the pre-canonical wizard shape already anchored on devnet — bare enum tokens, `marketing.smallest_payout`, and the old 10-§ body (exclusions folded into §3) — renumbering only the parsed view so the hash-anchored bytes stay untouched. The raw-policy panel hides the machine frontmatter in its document view; the copy action still takes the full anchored bytes.
