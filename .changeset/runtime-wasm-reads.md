---
"@riprap/pool": patch
"@riprap/hanse": patch
---

The LiteSVM test harnesses read `target/deploy/*.so` at runtime (LazyLock) instead of `include_bytes!`. Anchor's IDL pass compiles the integration tests before `build-sbf` writes the binaries, so a compile-time embed made `anchor build` fail on any machine without stale artifacts — every fresh CI runner died with `couldn't read target/deploy/pool.so`. Same anchor-build-first contract, now enforced at test runtime with a readable panic instead of a compile error.
