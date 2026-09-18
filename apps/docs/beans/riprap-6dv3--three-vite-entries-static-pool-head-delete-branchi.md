---
# riprap-6dv3
title: Three Vite entries + static pool head + delete branching/RouteHead
status: completed
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T20:35:00Z
parent: riprap-p7dl
---

vite.config: rollupOptions.input {main, 2026-breakpoint-blade-pool/index.html, app/index.html}, appType mpa. Move BreakpointPage into src/pool entry with static head (title/OG/canonical/Event JSON-LD verbatim from current BREAKPOINT_HEAD); delete App.tsx pathname branch + RouteHead; root entry keeps platform sections only. Mount smoke test per entry; BreakpointPage tests move with it.

## Summary of Changes

- `apps/landing/vite.config.ts`: `appType: "mpa"` + `build.rollupOptions.input` with three entries (main, `2026-breakpoint-blade-pool/index.html`, `app/index.html`); build emits all three html files.
- `apps/landing/2026-breakpoint-blade-pool/index.html`: NEW — pool head static (title/description/canonical/OG/Twitter + WebPage+Event JSON-LD verbatim from the former BREAKPOINT_HEAD; numbers per policy §2/§5), entry script `/src/pool/main.tsx`, analytics parity.
- `apps/landing/app/index.html` + `src/app/{main.tsx,AppPage.tsx,AppPage.test.tsx}`: NEW — /app MPA shell (TopNav wayfinding, no invented copy; wallet gate lands with the on-chain join beans).
- `src/pool/{main.tsx,BreakpointPage.tsx}` + `src/pool/sections/{PoolHero,PolicyFineprint}.tsx`: moved from `src/pages/` + `src/sections/pool/`; RouteHead usage + BREAKPOINT_HEAD constant deleted (head is static in the entry html now).
- `src/App.tsx`: pathname branch deleted — platform sections only; `src/components/RouteHead.tsx` + `src/pages/` removed.
- Tests: `BreakpointPage.test.tsx` moved to `src/pool/` rendering the page directly (pathname machinery dropped); `AppPage.test.tsx` mount smoke for /app; platform `App.test.tsx` unchanged and green. Landing suite 20/20.
- Gate unblock (pre-existing red, formatter-only): biome format on `tests/src/setup/{env,deploy}.ts` + `apps/remotion/src/video/tweets.ts`.
- Verification: `pnpm verify` green end-to-end (build, lint 0 errors, all test lanes, `anchor build` exit 0, cargo test 111/0 — after breaking a fresh-worktree bootstrap deadlock: hanse/pool LiteSVM test targets `include_bytes!` `target/deploy/pool.so`, which anchor only copies after the build succeeds; seeded the already-linked sbpf artifact once so the workspace compiles, then anchor rebuilt pool.so properly at full size). Platform bundle contains zero @solana/* references (grep over emitted chunks).
