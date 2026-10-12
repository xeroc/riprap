---
"@riprap/landing": patch
---

Url-slot manifest entries now serialize as URL-path entries — `path: "<raw link>"` with sha256(utf8(url)) — the evidence format's own out-of-band form (EVIDENCE-FORMAT §2/§7.1), replacing the `confirmation-url:` custom key. The daemon already handles this shape natively: a scheme-prefixed entry is never stored, never PUT, and marked `out_of_band` in the juror index, so a bounty claim's round completes without a phantom file upload — the previous custom-key form parsed as an empty path on the daemon side (400 unsafe entry path, or a forever-pending tracked file that blocked juror delivery). The raw link rides the manifest's own ECIES envelope; `DocSlot.url` is now a presence-only marker. Zero daemon and zero SDK changes. Already-filed old-form bounty claims (devnet test data) do not parse under the new form — their rounds could never complete anyway; re-file.
