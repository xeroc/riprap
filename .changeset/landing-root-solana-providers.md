---
"@riprap/landing": patch
---

Single Solana provider stack at the app root: a wallet connected on any surface (pool page, member app, adjudication, claim wizard) now stays connected across all of them — previously each hash route mounted its own provider and required a fresh connect. The platform landing's first load now includes the connector stack by design (ADR-0007).
