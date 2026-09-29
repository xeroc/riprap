---
"@riprap/landing": minor
---

Evidence daemon URL is now cluster-aware: devnet resolves api.devnet.useaccord.xyz, mainnet api.useaccord.xyz, localnet shares the resolved devnet host unless pinned. The single VITE_EVIDENCE_URL override is replaced by VITE_EVIDENCE_DAEMON_URL_DEVNET / _MAINNET / _LOCALNET (defaults baked in, so unset env keeps working). The anchored-terms read and the sponsor policy upload now follow the navbar's cluster selector instead of always hitting the mainnet host.
