---
"@riprap/landing": minor
---

The directory cards' "members needed" row now carries a funding meter: a thin bar under the number, red far from funding the smallest tier payout, green close — the semantic error/success tokens mixed in oklab, one solid color per state (no gradient), settling at 120ms as members join. Width and color both derive from one number (fundingProgress: live member count over the members-needed threshold, clamped to [0,1]); drafts and freshly launched pools show the empty red-tinted track. The bar is decorative for assistive tech — the number stays the accessible datum.
