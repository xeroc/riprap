---
"@riprap/landing": patch
---

Cut the mutuals directory surfaces to the store's live-only view: the §1.2 band and the /mutuals table render exactly the pools the store resolved on the active cluster (getProgramAccounts scan × pinned pubkeys) — drafts never render, on-chain mutuals without a listing are not shown. Shared state lines (copy doc §1.2/§ /mutuals v13): `Reading the pools from the chain.` while scanning, `Couldn't reach the cluster.` + `Try again` on scan failure, `No pools are live on this cluster yet.` when nothing resolves. The store's error state gained a `retry` for the shared retry pattern.
