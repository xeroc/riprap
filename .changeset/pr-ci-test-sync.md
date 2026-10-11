---
"@riprap/landing": patch
"@riprap/tests": patch
---

Sync landing tests with the 2026-10-10 rewording: the headline-set assertion matches the shipped sentence-case `P2P purpose pools`, the lineage test asserts the new Mutuals-first opener instead of the removed "Protection without a protector." closer, and two typos in the new Heritage paragraph (Mututals/prestage) are fixed. The e2e harness now gates accord's loader Deploy on the buffer's actual content — re-sending missing 1 KiB chunks until every byte has landed — instead of an account-size poll that always passed immediately (the allocation is born full-size), which let Deploy race its own fire-and-forget writes and ship a truncated ELF ("Verifier error: jump to middle of LD_DW").
