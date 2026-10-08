---
"@riprap/landing": patch
---

Fix a stray trailing `});` left in `BreakpointPage.test.tsx` by the CI-test removal in 107941ba — the file did not compile, failing `tsc -b` and with it the workspace build.
