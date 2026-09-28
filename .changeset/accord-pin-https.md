---
"@riprap/hanse": patch
---

The accord git dependency moves from `ssh://git@github.com/xeroc/accord.git` to `https://github.com/xeroc/accord.git` (same pinned rev). The repo is public, but ssh URLs always authenticate — CI runners without a key could not cargo-fetch the pin. Same rev, so no protocol behavior change; the lock entry swaps scheme only.
