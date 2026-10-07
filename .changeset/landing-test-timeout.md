---
"@riprap/landing": patch
---

Raise the landing vitest testTimeout to 20s. The full-page mount tests pass in ~2s unloaded but exceeded vitest's 5s default under `pnpm -r run test`, where every package's vitest process competes for the CPU. Hang detection is preserved.
