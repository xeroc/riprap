---
"@riprap/landing": minor
---

Enable mobile wallet connection: the provider stack now passes the Mobile Wallet Adapter config to ConnectorKit's AppProvider (plus appUrl metadata), so on Android Chrome the picker offers "Mobile Wallet Adapter" and connects through Phantom/Solflare/other MWA-compliant wallets. Without the mobile prop AppProvider never registers MWA, which is why connect was dead on phones. Deferred the @solana/connector 0.3.x bump to a bean — 0.3.0 moves to @solana/kit 8 internally and the workspace is on kit 7.
