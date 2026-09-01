# AGENTS.md

Instructions for coding agents working in this repository. Human-oriented docs live in `README.md`; the product rationale lives in `meta/PROJECT.md`.

## Project Overview

Riprap is a platform for event-scoped mutual protection pools on Solana (first deployment: **Riprap: Blade Pool @ Breakpoint 2026**, 15–17 November 2026, Olympia Convention Centre, London). This repo is the **frontend monorepo**: a pnpm workspace containing `packages/ui` (`@riprap/ui` — data-bound React SVG illustration kit with Storybook 10) and `apps/landing` (`@riprap/landing` — static Vite + React site). TypeScript strict, React 19, Vite, Vitest, Biome. No backend, no database, no environment variables.

## Source-of-Truth Map (read before touching code)

- `meta/PROJECT.md` — why/what of the product; the 8-step pool lifecycle.
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

Node 26+, pnpm 11+.

## Completion Gate (REQUIRED)

Work is not done until this passes from the repo root, exit 0:

```bash
pnpm -r run build && pnpm lint && pnpm -r run test
```

Or the shorthand: `pnpm verify`. Run it before declaring any task complete — no exceptions, no "pre-existing failures" excuses: if it was green before your change, your change broke it; if it was red before your change, fixing it is part of your task. If you touched Storybook stories or `.storybook/`, also run `pnpm --filter @riprap/ui run build-storybook` as a smoke check.

## Testing Instructions

- Test runner: Vitest (jsdom) + @testing-library/react. `*.test.ts(x` colocated with the code.
- Run all: `pnpm test`. One package: `pnpm --filter @riprap/ui test`. Watch: `cd packages/ui && pnpm exec vitest`. Focus: `pnpm --filter @riprap/ui exec vitest run -t "area = money"`.
- New logic in `packages/ui/src/lib/` (math, geometry) gets pure unit tests first — the numbers must trace to the policy doc / worked example, and test names cite the source (`policy §7`, `composition.md`).
- New atoms/scenes/stories get render tests asserting their data bindings (labels printed, fill heights, dashed-vs-solid) and composition invariants (both doors labeled, rejected branch present in any full claim flow).
- `apps/landing` keeps at least a mount smoke test; visual checks happen in a browser via the dev server, not snapshots.

## Code Style

- **Lint is law**: Biome from the root (`pnpm lint`, autofix `pnpm lint:fix`). Zero errors before you finish; warnings only with a one-line justification in the PR body.
- Formatting: 2-space indent, double quotes, semicolons, trailing commas, 100-col lines — enforced by Biome; never hand-format.
- **Colors never appear as hex outside `packages/ui/src/tokens.css`.** Use `var(--riprap-*)` tokens. Semantic law: `funds` = money, `deliberation` = adjudication, `peril` = incidents only. One stroke width (3), one radius (12), 4px grid, no gradients, no filters, no emoji in SVG.
- **Data law**: components render props, never invented numbers. Unknown values render as monospace `{{PARAM}}` placeholders. Never hardcode the tier prices outside `lib/poolMath.ts`'s `TIERS`.
- **Motion law** (`src/motion/`): use the CSS motion tokens / `var(--riprap-ease)` family; stone is rigid material (no bounce); every animated component must render its final state under `prefers-reduced-motion` (`useReducedMotion`).
- Import the kit via `@riprap/ui` (workspace source, no build step needed between packages). Named exports only; extend `packages/ui/src/index.ts` when adding public components.
- New packages/apps: add to `pnpm-workspace.yaml` globs (`packages/*`, `apps/*` already covered), name `@riprap/<name>`, and wire `build`/`lint`/`test` scripts so the completion gate covers them.

## Monorepo Navigation

- `pnpm -r ls --depth -1` — list workspace packages.
- `pnpm --filter @riprap/ui <script>` — run a script in one package.
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
