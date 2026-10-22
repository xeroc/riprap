---
"@riprap/landing": patch
---

The #/create advanced screen shows one input — the contribution + fee mint — with everything else folded into a collapsed `Advanced settings` disclosure (2026-10-21 founder pass): every Accord/juror parameter, the read-only derived rows (policy hash, seed, evidence operator, close timestamps), and the taken-seed variant, all prefilled with the pilot preset behind the FAQ's native-`<details>` pattern. The disclosure force-opens while any of its fields rejects, so a blocked submit can still focus the rejecting field; the mint's gate stays visible outside.
