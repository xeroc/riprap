---
"@riprap/cranker": patch
---

`@riprap/pool`: the `files` allowlist is dropped — the package's base `exports` resolve `./src/index.ts` (source-export), and `pnpm deploy` ships the package as-declared, so the old `dist`-only allowlist stripped `generated/` from the deployed image and broke module resolution at runtime.
Container deployment for the cranker: a four-stage Dockerfile (workspace install from the lockfile → pool/hanse build + cranker typecheck → `pnpm deploy` prune → bun runtime), a reusable `build-docker-image.yaml` workflow plus a Build Cranker Image job in the release pipeline pushing `ghcr.io/xeroc/riprap-cranker` (default-branch tags `main.<run_number>`), and a root `.dockerignore` keeping local build contexts free of `target/`, `node_modules`, and env files. The nomad/vault deployment lives in the sibling `deployment` repo as the new `riprap-cranker` pulumi project.
