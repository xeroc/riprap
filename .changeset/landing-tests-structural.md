---
"@riprap/landing": patch
---

Trim content-assertion tests from the landing suites. The mutuals band and /mutuals directory tests hardcoded pool names, display order, prices, and copy-doc strings, so every content change broke CI (the mainnet pin reorder did). The suites now assert structure and behavior with expectations derived from data.ts: card links, kind styling, meter and rail structure, store states, and the seats formula via synthetic listings. Pool-page smoke tests keep only mount + policy-disclosure behavior; the Blade Pool suite drops its verbatim-copy tests and keeps the join machine, state machine, and tier data bindings. Router and nav tests no longer key on hero copy.
