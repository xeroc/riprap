---
"@riprap/landing": minor
---

Navbar: the cluster select + wallet controls now render on every surface (platform, pool, /app family); the Open App CTA stays on the platform and pool pages and is dropped inside /app. The default cluster is now mainnet-beta (was devnet) — visitors without a persisted cluster choice land on mainnet, where the Blade Pool isn't deployed yet, so the pool/app surfaces open in their not-live state until a cluster with a deployment is selected.
