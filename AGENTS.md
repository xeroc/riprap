# AGENTS.md

Instructions for coding agents working in this repository. Human-oriented docs live in `README.md`; the product rationale lives in `meta/PROJECT.md`.

## Project Overview

Riprap is a platform for event-scoped mutual protection pools on Solana (first deployment: **Riprap: Blade Pool @ Breakpoint 2026**, 15–17 November 2026, Olympia Convention Centre, London). This repo is a pnpm monorepo with a frontend half and an on-chain half. Frontend: `packages/ui` (`@riprap/ui` — data-bound React SVG illustration kit with Storybook 10) and `apps/landing` (`@riprap/landing` — static Vite + React site). On-chain: `programs/pool` (Anchor program `pool` — generic three-track mutual-pool primitive) and `programs/hanse` (Anchor program `hanse` — bounded-lifetime event mutual on top of pool), each with a generated Codama client (`packages/pool` → `@riprap/pool`, `packages/hanse` → `@riprap/hanse`); both programs are localnet/LiteSVM-only in v1. Operators drive both through `apps/cli` (`@riprap/cli` — oclif v4, bin `riprap`, config/pool/hanse topics over the two SDKs; single-signer, except `hanse:claim-payout` which co-signs with the mutual authority via `--co-signer`). End-to-end: `tests` (`@riprap/tests` — jest specs against a Surfpool surfnet, harness ported from the accord repo). TypeScript strict, React 19, Vite, Vitest, Biome; Rust 1.89, Anchor 1.0.2. No web2 backend, no database; the only environment variables are optional `RIPRAP_*`/`ACCORD_*` overrides with localnet defaults (see README § Environment Variables).

- `DESIGN.md` — the committed visual identity and the law for every component: near-black ground, warm-white ink, one harbor-blue accent (links/stamps/crest only), Space Grotesk + JetBrains Mono (every numeral mono), 0px radius chrome, 1px hairlines, no gradients/shadows/glow, settle-not-slide motion (~160ms ease-out, 40ms stagger, no bounce).

- `meta/PROJECT.md` — why/what of the product; the 8-step pool lifecycle.
- `meta/specs/EVENT-MUTUAL.md` — the event-mutual contract `programs/hanse` implements (lifecycle, §8 payout math). If program and spec disagree, the spec wins — fix the program.
- `meta/primitives/` — **the spec `packages/ui` implements**: `atoms/*.md` (12 atom specs), `composition.md` (tokens, grid, anchors, scene templates, finish checklist), `data-stories.md` (5 money narratives + number provenance). If code and spec disagree, the spec wins — fix the code.
- `meta/marketing/03-website-copy/landing-page.md` — the approved landing copy. `apps/landing` renders this copy; do not rewrite copy in code without updating the source doc.
- `meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md` — the tier table and claims rules. The **only** allowed prices: $10/$20/$40 entry, $1,000/$2,000/$4,000 caps.
- `meta/marketing/07-brand-assets/messaging-guide.md` — tone law for any user-facing string: deadpan-honest, no buzzwords, ≤1 emoji per surface (landing uses zero), numbers exactly as sourced.

## Setup Commands

```bash
pnpm install        # links the workspace; esbuild build script is pre-approved in pnpm-workspace.yaml
pnpm dev:landing    # landing dev server → http://localhost:5173
pnpm dev:ui         # Storybook → http://localhost:6006
```

Node 26+, pnpm 11+. Rust 1.89.0 (pinned in `rust-toolchain.toml`, auto-installed by rustup) and Anchor CLI 1.0.2 (via `avm`) — both required by the completion gate.

## Completion Gate (REQUIRED)

Work is not done until this passes from the repo root, exit 0:

```bash
pnpm -r run build && pnpm lint && pnpm -r run test && anchor build && cargo test
```

Or the shorthand: `pnpm verify`. Run it before declaring any task complete — no exceptions, no "pre-existing failures" excuses: if it was green before your change, your change broke it; if it was red before your change, fixing it is part of your task. If you touched Storybook stories or `.storybook/`, also run `pnpm --filter @riprap/ui run build-storybook` as a smoke check.

- The `pnpm -r run test` leg includes the jest e2e lane `@riprap/tests`: every spec probes the validator (`RIPRAP_RPC_URL`, default localnet) and skips cleanly when none is reachable, so `pnpm verify` stays green with no validator running. To exercise the lane for real, run `anchor test` — it builds, starts Surfpool, deploys pool + hanse, then runs the jest suite (Anchor.toml `[scripts]`).
- Live-e2e prerequisites: a built sibling checkout of the accord repo — `cd ../accord && make build`, or point `ACCORD_SO` at the artifact (default `…/accord/target/deploy/accord.so` next to this worktree; `ACCORD_KEYPAIR` for its keypair). The accord dependency is a deliberate cross-repo pin — `programs/hanse/Cargo.toml`, `rev ba91bd8b8b374091c174909b115688ffb9b231ff` — the deployed artifact must be built from that rev.
- `anchor build` regenerates the gitignored IDLs for both programs (`target/idl/pool.json`, `target/idl/hanse.json`); after changing either program, re-run the matching codegen (`pnpm --filter @riprap/pool codegen` / `pnpm --filter @riprap/hanse codegen`) and commit the regenerated client alongside the program change.

## Testing Instructions

- Test runner: Vitest (jsdom) + @testing-library/react. `*.test.ts(x` colocated with the code.
- Run all: `pnpm test`. One package: `pnpm --filter @riprap/ui test`. Watch: `cd packages/ui && pnpm exec vitest`. Focus: `pnpm --filter @riprap/ui exec vitest run -t "area = money"`.
- Anchor programs (`programs/pool`, `programs/hanse`): `cargo test` — inline unit tests plus the LiteSVM full-lifecycle suites (no validator needed); single test: `cargo test <name>`.
- `@riprap/tests` (repo root `tests/`): jest e2e against a Surfpool surfnet — node env, ESM (`--experimental-vm-modules`), strictly serial (`maxWorkers: 1`; `surfnet_timeTravel` warps the global surfnet clock). Specs skip when no validator answers; prerequisites for a live run are in the completion gate above.
- `apps/cli` (`@riprap/cli`): vitest — a help-completeness suite that always runs, plus `surfpool-smoke.test.ts`, which runs one live `pool:init → deposit → spend --dry-run` chain when `RIPRAP_SMOKE_RPC` (default localnet) answers and skips otherwise.
- New logic in `packages/ui/src/lib/` (math, geometry) gets pure unit tests first — the numbers must trace to the policy doc / worked example, and test names cite the source (`policy §7`, `composition.md`).
- New atoms/scenes/stories get render tests asserting their data bindings (labels printed, fill heights, dashed-vs-solid) and composition invariants (both doors labeled, rejected branch present in any full claim flow).
- `apps/landing` keeps at least a mount smoke test; visual checks happen in a browser via the dev server, not snapshots.

## Code Style

- **Lint is law**: Biome from the root (`pnpm lint`, autofix `pnpm lint:fix`). Zero errors before you finish; warnings only with a one-line justification in the PR body.
- Formatting: 2-space indent, double quotes, semicolons, trailing commas, 100-col lines — enforced by Biome; never hand-format.
- **Data law**: components render props, never invented numbers. Unknown values render as monospace `{{PARAM}}` placeholders. Never hardcode the tier prices outside `lib/poolMath.ts`'s `TIERS`.
- **Colors never appear as hex outside `packages/ui/src/tokens.css`.** Use Tailwind theme utilities (`bg-ground`, `text-ink`, `border-hairline`, `text-accent`…) or `var(--riprap-*)` tokens — both resolve to the same tokens.css values. Diagram atoms use the `--riprap-diagram-*` / `funds` / `deliberation` / `peril` set; UI chrome uses the ground/surface/hairline/accent set; never cross them. Semantic law: `funds`/harbor-blue = money, `deliberation` = adjudication, `peril` = incidents only. Money-colored TEXT on dark uses `--riprap-funds-ink`. Geometry: 0px radius on all chrome, 2px on inputs; illustrations keep their own spec (stroke 3, radius 12) per `meta/primitives/composition.md`.
- **Type law**: Space Grotesk display/body, JetBrains Mono for EVERY numeral, parameter, stamp, and address — inline in body text too (wrap numerals: the kit exports `numeralSegments`; chrome marks numbers with `data-num`). Uppercase is mono-only.
- **Component law**: interactive UI comes from the kit's chrome layer (`@riprap/ui` — shadcn/Radix primitives already restyled to DESIGN.md; add new shadcn components via `pnpm dlx shadcn@latest add <name>` from `packages/ui`, then restyle: relative imports only — `@/` aliases leak into consumers and break `apps/landing` builds). Never ship a shadcn component in default state.
- **Motion law**: settle, not slide — `--riprap-settle` (160ms ease-out), `--riprap-settle-fast` (120ms), `--riprap-stagger` (40ms). No bounce, no overshoot, no oscillating loops, no scale/rotation on stones. Every animated component renders its final state under `prefers-reduced-motion` (`useReducedMotion`).
- Changes to `@riprap/ui`'s public API (`src/index.ts`) propagate instantly to the landing (source imports) — after renames run `pnpm -r run build` to let every package's `tsc` catch stale usage.
- Do not edit files under `meta/` as a side effect of code work; docs change in their own commits/PRs (exceptions: parameter tables in `meta/marketing/**/README.md` when a parameter resolves).

## Build and Deployment

- `pnpm build` builds every package. Artifacts: `apps/landing/dist/` (deploy to the static host serving `riprap.xyz` — immutable cache for hashed assets, revalidate `index.html`) and `packages/ui/storybook-static/` (from `build-storybook`, deploy as the docs site).
- No CI yet. The completion gate is manual and mandatory until CI lands; if you add CI, keep the gate command identical.

## Pull Request Guidelines

- Title format: `[ui] …` / `[landing] …` / `[meta] …` / `[repo] …`
- Before opening: `pnpm verify` green (paste the tail in the PR), plus `build-storybook` if stories changed.
- Every user-visible string change in `apps/landing` must quote its source line from `meta/marketing/03-website-copy/landing-page.md` (or update that doc in the same PR).
- A changed number anywhere requires its provenance (policy §, worked example, or `{{PARAM}}`) in the diff or PR body.

## Additional Notes

- pnpm 11 blocks dependency build scripts by default; the allowlist lives in `pnpm-workspace.yaml` (`onlyBuiltDependencies`) — keep it in version control, don't use interactive `pnpm approve-builds`.
- Tokens dark mode is attribute-driven: `data-mode="dark"` on any ancestor of kit components. Never mix modes within one scene.
- The two-door rule is product truth: a vessel with money in it always shows `spending — adjudicated` and `liquidation`, and there is never a third exit. Any drawing/code that violates it is wrong even if it renders.
- Copy tone: deadpan-honest. State the peril plainly, never joke about it, never dramatize it. Banned words (messaging-guide): revolutionary, game-changing, seamless, leverage, synergy, cutting-edge.
- **Category vs instance law** (`meta/PROJECT.md` § "The claim — two layers"): Riprap-the-protocol copy (platform hero, footer descriptor, READMEs, `package.json` description, directory listings) never carries event, peril, expiry, fixed-fee, or refund framing — those are pilot specifics and belong to instance surfaces only (`Riprap: Blade Pool @ Breakpoint 2026`: the pool page, the policy doc, its emails and ads). Platform copy stays numberless; instance numbers come only from the policy doc.
