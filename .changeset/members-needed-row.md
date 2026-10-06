---
"@riprap/landing": patch
---

The mutuals cards replace the retired demo stats with a members-needed row: how many more members the pool needs before it makes sense — need, not a cap (nothing limits joining). The founder formula, always on the smallest tier: if the smallest success payment exceeds the entry fee, ceil(payment / fee) members fund one full payout (Blade Pool 100 at 100x, Chairmageddon 4, Coffee Apocalypse 3, the hot-drink bounties 10 at 10x); if one entry already funds the smallest payment, the push number is the second success — where the member turns a profit — so 2 (NGMI Hairline grade I, OnlyFriends' first introduction). Each pool carries its smallestPayout (smallest tier cap, lowest grade, or first-act payment) in the data; stillNeeded() subtracts the live member count — a chain read against the pool's pinned pubkey — and floors at 0, so pre-launch cards show the full count in accent mono.
