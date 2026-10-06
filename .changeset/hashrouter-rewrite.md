---
"@riprap/landing": patch
---

Routing internals: the hand-rolled hash matcher in src/main.tsx is replaced by react-router's HashRouter (new dependency). Same route table — trailing-slash tolerance, adjudicate session deep links with board fallback for malformed segments, cross-route anchor scroll (#mechanism from any surface) — now expressed as declarative <Route>s; the pool detail route (#/m/<id>) and the pools directory (#/mutuals) resolve through the mutuals registry as designed there. The per-route <title> swapping is gone: one static title for the whole app, from index.html.
