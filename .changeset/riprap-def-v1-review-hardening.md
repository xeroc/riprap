---
"@riprap/landing": patch
---

Harden the `riprap-def/v1` module after review: integers beyond the JavaScript safe range are now rejected on both sides of the format — the renderer refuses tier fees/caps (and the §7 filing fee) that are not safe integers, and the frontmatter parser rejects bare integers that would lose precision — closing a hole where a huge fee rendered as scientific notation the grammar cannot parse back. Regression test added.
