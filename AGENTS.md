# AGENTS.md

Instructions for coding agents working in this repository. Human-oriented docs live in `README.md`; the product rationale lives in `meta/PROJECT.md`.

## Project Overview

Riprap is a platform for event-scoped mutual protection pools on Solana (first deployment: **Riprap: Blade Pool @ Breakpoint 2026**, 15–17 November 2026, Olympia Convention Centre, London). This repo is a pnpm monorepo with a frontend half and an on-chain half. Frontend: `packages/ui` (`@riprap/ui` — data-bound React SVG illustration kit with Storybook 10), `apps/landing` (`@riprap/landing` — static Vite + React MPA, three entries: `/` platform landing (Solana-free), `/2026-breakpoint-blade-pool/` pool page, `/app/` member wallet surface), and `apps/remotion` (`@riprap/remotion` — one Remotion 4 framework, many videos: each video is a self-contained dir under `videos/` (local-only, gitignored; only `_example`/`_template` tracked) rendering `@riprap/ui` illustrations under the kit's glyph clock via the `defineVideo` contract and a generated manifest; every video motion is kit-authored, music is scored in Strudel per `apps/remotion/MUSIC.md`, wav/render artifacts local-only). On-chain: `programs/pool` (Anchor program `pool` — generic three-track mutual-pool primitive) and `programs/hanse` (Anchor program `hanse` — bounded-lifetime event mutual on top of pool), each with a generated Codama client (`packages/pool` → `@riprap/pool`, `packages/hanse` → `@riprap/hanse`); both programs are localnet/LiteSVM-only in v1. Operators drive both through `apps/cli` (`@riprap/cli` — oclif v4, bin `riprap`, config/pool/hanse topics over the two SDKs; single-signer, except `hanse:claim-payout` which co-signs with the mutual authority via `--co-signer`). End-to-end: `tests` (`@riprap/tests` — jest specs against a Surfpool surfnet, harness ported from the accord repo). TypeScript strict, React 19, Vite, Vitest, Biome; Rust 1.89, Anchor 1.0.2. No web2 backend, no database; the only environment variables are optional `RIPRAP_*`/`ACCORD_*` overrides with localnet defaults plus the landing's optional `VITE_*` vars (see README § Environment Variables).

- `DESIGN.md` — the committed visual identity and the law for every component: near-black ground, warm-white ink, one harbor-blue accent (links/stamps/crest only), Space Grotesk + JetBrains Mono (every numeral mono), 0px radius chrome, 1px hairlines, no gradients/shadows/glow, settle-not-slide motion (~160ms ease-out, 40ms stagger, no bounce).

- `meta/PROJECT.md` — why/what of the product; the 8-step pool lifecycle.
- `meta/specs/EVENT-MUTUAL.md` — the event-mutual contract `programs/hanse` implements (lifecycle, §8 payout math). If program and spec disagree, the spec wins — fix the program.
- `meta/primitives/` — **the spec `packages/ui` implements**: `atoms/*.md` (12 atom specs), `composition.md` (tokens, grid, anchors, scene templates, finish checklist), `data-stories.md` (5 money narratives + number provenance). If code and spec disagree, the spec wins — fix the code.
- `meta/marketing/03-website-copy/landing-page.md` — the approved landing copy. `apps/landing` renders this copy; do not rewrite copy in code without updating the source doc.
- `meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md` — the tier table and claims rules. The **only** allowed prices: $10/$20/$40 entry, $1,000/$2,000/$4,000 caps.
- `meta/marketing/07-brand-assets/messaging-guide.md` — tone law for any user-facing string: deadpan-honest, no buzzwords, ≤1 emoji per surface (landing uses zero), numbers exactly as sourced.

## Repository Map

### Parts

|Part|Path|Role|
|---|---|---|
|Programs|`programs/{pool,hanse}/` (`src/{lib,state,events,error}.rs`, `src/instructions/`, `tests/`)|Source of truth for on-chain behavior — except `hanse`, which is subordinate to `meta/specs/EVENT-MUTUAL.md` (spec wins). `anchor build` emits the IDLs to `target/idl/`.|
|Generated clients|`packages/{pool,hanse}/generated/`|Codama output from the IDLs — regenerated (`pnpm --filter @riprap/<p> codegen`), never hand-edited, committed alongside the program change.|
|SDK facades|`packages/{pool,hanse}/src/` (`index.ts`, `pdas.ts`, `fetch.ts` + colocated tests)|Hand-written public surface (PDA derivation, account fetchers) re-exported together with the generated client; `@riprap/hanse` depends on `@riprap/pool`.|
|Shared UI|`packages/ui/` (public API = `src/index.ts`)|Tokens, atoms, chrome per `DESIGN.md` + `meta/primitives/`; consumed by every `apps/*` frontend via source imports.|
|CLI|`apps/cli/` (`src/commands/{config,pool,hanse}/`, `src/lib/`)|`riprap` operator CLI; consumes `@riprap/pool` + `@riprap/hanse` + `@useaccord/sdk` (accord PDAs/reads). No protocol logic lives here.|
|Frontends|`apps/landing/` (three MPA entries: `index.html` → `src/main.tsx` platform, `2026-breakpoint-blade-pool/index.html` → `src/pool/`, `app/index.html` → `src/app/`), `apps/pitch-seed-raise/`|React + Vite (`appType: "mpa"`, entry list = `vite.config.ts` `rollupOptions.input`); consume `@riprap/ui`. Each entry's head (title/OG/canonical/JSON-LD) is static in its own `index.html`. Solana code may only live under `src/pool/`, `src/app/`, `src/shared/` (ConnectorKit `SolanaProviders` + the `useClusterRpc`/`useHanseEnv` seam + the `sendInstruction` port live in `src/shared/`, mounted by the pool and `/app` entries only) — the platform entry stays `@solana/*`-free. `pitch-seed-raise` has no test lane — the gate's `build`/`lint` legs are its only automated check.|
|e2e tests|`tests/src/` (`spec-*.spec.ts`, `{mutual,draw}-harness.ts`, `setup/`)|Drives pool + hanse through both SDKs and `@useaccord/sdk` against a Surfpool surfnet.|
|Governing docs|`meta/` (symlink → the Obsidian spec vault), root `DESIGN.md`, `PROJECT.md`, `CONTEXT.md`, `README.md`|Must describe the code as it is; the spec-wins rules in Project Overview make several of them law.|
|Decisions & ledger|`apps/docs/adr/`, `apps/docs/beans/` (`.beans.yml`)|ADRs for architectural calls; beans task ledger.|
|CI / deploy|`.github/workflows/landing-page.yaml`|Builds `apps/landing` and deploys to GitHub Pages (`riprap.xyz`) on push to `main`.|
|Cross-repo pin|`programs/hanse/Cargo.toml` (accord `rev`, see Completion Gate), `@useaccord/sdk@0.1.0` (`apps/cli` + `tests`), `ACCORD_SO` artifact|The sibling accord checkout is an external dependency of both the program and the TS workspace.|

### When you change X, also touch Y

- **Instruction signature** (add/rename/remove an arg or account in `programs/<p>/src/instructions/`): `anchor build` → `pnpm --filter @riprap/<p> codegen` → every call site in `apps/cli/src/commands/<topic>/` plus `src/lib/{pool-args,hanse-args}.ts` parsing → the harnesses and specs in `tests/src/` → the LiteSVM suite in `programs/<p>/tests/` → for `hanse`, reconcile with `meta/specs/EVENT-MUTUAL.md` (spec wins) and write an ADR if architectural. _E.g. adding an arg to `file_claim` ripples into `getFileClaimInstructionAsync` call sites in `apps/cli/src/commands/hanse/file-claim.ts`, the CLI arg parser, and every e2e claim call._

- **Account field** (add/rename/remove a field in `state.rs`): codegen → every **object literal** constructing that account — `tests/src/setup/fixtures.ts`, CLI test fixtures in `apps/cli/src/**/*.test.ts` — plus `packages/<p>/src/fetch.ts` decoders that read the field → the account table in `meta/specs/EVENT-MUTUAL.md` (hanse).

- **New instruction:** all of the above, plus a new `apps/cli` command (oclif `summary` + `examples` — `src/suite.test.ts` enforces help completeness), a new e2e spec, and a command-list entry in `apps/cli/README.md`.

- **SDK public surface** (new/renamed export from `packages/{pool,hanse}` — a PDA, fetcher, codec — or from `packages/ui/src/index.ts`): migrate **every consumer** (`apps/cli` + `tests` for chain; `apps/landing` + `apps/pitch-seed-raise` for UI), then `pnpm -r run build` to let every `tsc` catch stragglers. No parallel hand-rolled PDA/ATA/fetcher implementations — the SDK packages are the single source.

- **CLI command or flag** (add/rename/remove a command, or rename/make-optional a flag): update `apps/cli/README.md` (command list, `chainFlags` table, `--dry-run` matrix) in the same change and keep `src/suite.test.ts` green — a flag that drifts from the README makes the documented copy-paste commands fail or silently behave differently.

- **Error code / enum variant:** `programs/<p>/src/error.rs` → codegen → generated error maps → every consumer switching on the name (`apps/cli/src/lib/errors.ts`, e2e assertions).

- **Payout math / tier economics:** `meta/specs/EVENT-MUTUAL.md` §8 and the policy doc are the source — change them first; then `programs/hanse` settle instructions, `apps/cli/src/lib/hanse-quote.ts` (the offline `hanse:quote` calculator), `packages/ui/src/lib/poolMath.ts` (`TIERS`), and e2e expectations move together. A changed number carries its provenance.

- **Landing copy:** update `meta/marketing/03-website-copy/landing-page.md` first, then the code; the PR quotes the source line.

- **Landing entries** (a new MPA entry, or imports crossing `apps/landing/src/` subtrees): the platform entry (`src/main.tsx` → `App.tsx`) must never import `@solana/*` — chain code lives under `src/pool/`, `src/app/`, `src/shared/` and is imported only by those entries; a new entry adds an `index.html` (head static, never React-managed), a `src/<entry>/main.tsx`, a line in `vite.config.ts` `rollupOptions.input`, a mount smoke test, and — if user-visible — its copy in `meta/marketing/03-website-copy/landing-page.md` plus `public/{sitemap.xml,llms.txt}` entries, all in the same change.

- **Visual law** (tokens, type, motion): one place — `packages/ui/src/tokens.css` + the kit; hex values never appear anywhere else.

- **Accord pin bump** (`rev` in `programs/hanse/Cargo.toml` or `@useaccord/sdk` version in `apps/cli`/`tests`): rebuild the sibling (`cd ../accord && make build`, or point `ACCORD_SO` at the artifact), audit every `@useaccord/sdk` import site (`apps/cli/src/commands/hanse/{file-claim,set-subaccord-param}.ts` + build tests, `tests/src/setup/deploy.ts`), and run the live e2e.

### Keeping this map current

- This section is load-bearing documentation, not a snapshot. Any change that adds/removes/renames a workspace package or app, introduces a **new import across package boundaries**, a new cross-repo dependency, or a new doc that governs code **must update the Parts table and the propagation list in the same change** — before running the completion gate. A dependency that exists in code but not in this map is a bug in this file.
- You have recognized a new dependency when: you add an `@riprap/*` or `@useaccord/*` import where none existed, you scaffold a new `apps/*` or `packages/*` entry, or you discover a consumer this map missed. Adding the row (or propagation edge) is part of done, not a follow-up task.
- A new app lands under `apps/*` (the workspace globs pick it up), gets a Parts row naming its consumers and test lane (or explicitly "no test lane"), and must not break any leg of `pnpm verify`.
- When code and this map disagree, fix whichever is wrong — establish reality by reading imports (`from "@riprap/`, `from "@useaccord/`), not from memory.

## Setup Commands

```bash
pnpm install        # links the workspace; esbuild build script is pre-approved in pnpm-workspace.yaml
pnpm dev:landing    # landing dev server → http://localhost:5173
pnpm dev:ui         # Storybook → http://localhost:6006
pnpm dev:remotion   # Remotion studio → http://localhost:3000
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
- CI: `.github/workflows/landing-page.yaml` builds `apps/landing` and deploys it to GitHub Pages (`riprap.xyz`) on push to `main`. The completion gate stays manual and mandatory for every change; if you add more CI, keep the gate command identical.

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
