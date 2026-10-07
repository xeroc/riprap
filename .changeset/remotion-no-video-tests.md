---
"@riprap/remotion":
  - patch
---

Removed the remotion package's test lane by founder directive: deleted `src/cli/sync.test.ts` + `src/framework/music.test.ts` + `vitest.config.ts`, dropped the `test` script from `package.json`, and added `apps/remotion/AGENTS.md` codifying the rule — never build tests for the videos; verification is stills, pixel probes, render-back beat checks, and independent review. Root `AGENTS.md` Parts table now carries the Videos row with the no-test-lane note.

`vitest` + `jsdom` stay in `package.json` for now (orphaned by this change): the lockfile is mid-flight with the cranker `@useaccord/sdk@0.5.1` pin — sweep both deps in the same lockfile-updating change when that lands.
