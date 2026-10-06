---
"@riprap/hanse": patch
"@riprap/landing": patch
---

Live member counts behind the members-needed row, carousel resume fix, and Mert of the Year. @riprap/hanse gains fetchMemberCount — a count-only member scan (member discriminator + mutual memcmp at layout offset 8, zero-length dataSlice, no account data over the wire); the landing's useMemberCount reads it per pool (pinned pubkey, or the Blade Pool's env-bound per-cluster address) and stillNeeded() subtracts the live count, flooring at 0 — undeployed drafts show the full count. The carousel's pointer-leave handler, dropped in a rebase, is restored: the drift pauses on hover and resumes when the mouse moves away. Mert of the Year joins the directory (nine pools — the concurrent-edit collision that briefly dropped Toly Needs His Fuel is reconciled): $10 entry, one $1000 verdict bounty, placeholder detail page from its terms doc, membersNeeded 100.
