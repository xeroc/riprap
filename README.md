# Riprap — Monorepo

Riprap is a platform for **event-scoped mutual protection pools** on Solana: one pool, one narrowly defined peril, one finite event. Members pay a fixed entry fee, peer jurors adjudicate claims, unused funds return pro-rata, and the pool dissolves. This monorepo holds the frontend (`packages/ui` — the illustration kit; `apps/landing` — the static site), the on-chain half (`programs/pool` — the generic three-track mutual-pool primitive; `programs/hanse` — the event-mutual orchestrator implementing [`meta/specs/EVENT-MUTUAL.md`](meta/specs/EVENT-MUTUAL.md); generated Codama clients `@riprap/pool` / `@riprap/hanse`), the operator CLI (`apps/cli` — `riprap`), and the jest e2e suite (`tests/` — `@riprap/tests`, Surfpool). Project rationale lives in [`meta/PROJECT.md`](meta/PROJECT.md); the first deployment is **Riprap: Blade Pool @ Breakpoint 2026** (15–17 November 2026, Olympia Convention Centre, London).

## Key Features

- **`packages/ui`** — a data-bound React SVG component kit implementing the illustration language specified in [`meta/primitives/`](meta/primitives/README.md): 12 atoms, 4 composed scenes, 5 data stories, 5 motion components, Storybook 10 docs.
- **`apps/landing`** — static Vite + React landing page built from the approved copy in [`meta/marketing/03-website-copy/landing-page.md`](meta/marketing/03-website-copy/landing-page.md), consuming the UI kit.
- **One design system** — semantic color tokens (`funds` = money, `deliberation` = adjudication, `peril` = the peril), one stroke width (3), one radius (12), 8px grid, no gradients.
- **Data law** — every number rendered by a component is either doc-sourced or an explicit `{{PARAM}}` placeholder. Components never invent figures.
- **`programs/pool` + `programs/hanse`** — the on-chain half: a generic three-track mutual-pool primitive and the bounded-lifetime event mutual built on it, each with a Codama-generated TypeScript client (`@riprap/pool`, `@riprap/hanse`) and LiteSVM test suites.
- **`apps/cli` + `tests/`** — the `riprap` operator CLI (single-signer; `hanse:claim-payout` co-signs with the mutual authority — see [`apps/cli/README.md`](apps/cli/README.md)) and the jest e2e suite against a Surfpool surfnet (specs skip cleanly with no validator reachable).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [The Illustration Language](#the-illustration-language)
- [Environment Variables](#environment-variables)

## Tech Stack

- **Runtime**: Node.js 26+
- **Package manager**: pnpm 11+ (workspace protocol, `onlyBuiltDependencies` pinned in `pnpm-workspace.yaml`)
- **Language**: TypeScript (strict, `verbatimModuleSyntax`, noEmit via `tsc -b`)
- **UI**: React 19
- **Design law**: [`DESIGN.md`](DESIGN.md) — engineering section drawing: near-black ground, warm-white ink, one harbor-blue accent, sharp geometry, settle-not-slide motion
- **Component foundation**: shadcn/ui (Radix base, CLI-scaffolded into `packages/ui/src/components/ui`, restyled to DESIGN.md — never shipped in default state) + `sonner` toasts + `lucide-react` icons
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`); every color/font/radius/motion value resolves through `packages/ui/src/tokens.css` → `src/theme.css` (`@theme inline`) — never inline hex
- **Type**: Space Grotesk + JetBrains Mono, self-hosted via `@fontsource-variable/*`; every numeral renders in JetBrains Mono (DESIGN.md)
- **Motion**: `motion` — settle-only (160/120ms ease-out, 40ms stagger); no bounce, no loops; `prefers-reduced-motion` collapses to static
- **Docs**: Storybook 10 (`@storybook/react-vite` + a11y, docs, vitest, chromatic, mcp addons)
- **Test**: Vitest + @testing-library/react (jsdom)
- **Lint/format**: Biome 2.x (single root config, CSS parser with Tailwind directives enabled)
- **Build**: Vite (app build for the landing, lib build for the ui package)
- **On-chain**: Rust 1.89 + Anchor 1.0.2 (`programs/`), Codama-generated clients (`packages/pool`, `packages/hanse`), LiteSVM unit tests, jest e2e on Surfpool

## Prerequisites

- Node.js 26 or higher
- pnpm 11 or higher (`corepack enable` or `npm i -g pnpm`)
- Git
- A browser (for Storybook and the landing dev server)
- Rust 1.89.0 (pinned in `rust-toolchain.toml`) and Anchor CLI 1.0.2 (`avm`) — required by the `anchor build` / `cargo test` legs of `pnpm verify`
- For a live e2e run only: a built sibling checkout of the accord repo (see [Testing](#testing))

> [!NOTE]
> No database, no API keys. The frontend runs with zero configuration; the CLI and the e2e suite take optional `RIPRAP_*` environment variables with localnet defaults (see [Environment Variables](#environment-variables)).

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> riprap
cd riprap
pnpm install
```

pnpm 11 blocks dependency postinstall scripts by default; this repo already allowlists the only one needed (`esbuild`) in `pnpm-workspace.yaml`, so a plain `pnpm install` works. If you add a dependency that needs a build script, pnpm will tell you — extend `onlyBuiltDependencies` rather than running `pnpm approve-builds` interactively.

### 2. Verify the baseline

```bash
pnpm verify
```

This runs, in order: `pnpm -r run build` → `pnpm lint` → `pnpm -r run test` → `anchor build` → `cargo test` — exactly the `verify` script in [`package.json`](package.json). The jest e2e lane inside the test leg skips itself when no validator is reachable, so the gate stays green on a fresh clone. The first Rust build takes a while and is cached under `target/` from then on. It must exit 0.

Expected tail (final leg, `cargo test`):

```
test result: ok. X passed; 0 failed; 0 ignored; 0 measured; X filtered out
```

### 3. Start developing

```bash
# Landing page — http://localhost:5173
pnpm dev:landing

# UI kit Storybook — http://localhost:6006
pnpm dev:ui
```

Both hot-reload. The landing imports `@riprap/ui` through the workspace link, so atom changes appear in the page without a rebuild.

> [!TIP]
> Run both in separate terminals while iterating on illustrations in page context — Storybook for isolated controls, the landing for composition and scroll behavior.

## Architecture

### Directory Structure

```
riprap/
├── apps/
│   ├── cli/                    # @riprap/cli — `riprap` operator CLI (oclif v4) over @riprap/pool + @riprap/hanse
│   ├── docs/                   # ADRs and fleet bean files
│   └── landing/                # @riprap/landing — static Vite + React site
│       ├── src/
│       │   ├── App.tsx         # page composition (sections per the approved copy)
│       │   ├── main.tsx        # entry
│       │   └── index.css       # imports @riprap/ui/tokens.css + page globals
│       └── index.html
├── packages/
│   ├── ui/                     # @riprap/ui — the illustration primitive kit
│   │   ├── src/
│   │   │   ├── tokens.css      # design tokens: colors (light/dark), type scale, motion
│   │   │   ├── lib/            # pure, tested logic: pool math + stone geometry
│   │   │   │   ├── poolMath.ts # TIERS, proRataShare, scaledPayout, fillHeight, usd
│   │   │   │   └── stone.ts    # seeded irregular-hexagon generator (no mortar)
│   │   │   ├── atoms/          # 12 atomic SVG components (g-fragments, data-bound)
│   │   │   ├── scenes/         # 4 composed scenes (join, claim, end-of-event, lifecycle)
│   │   │   ├── datastories/    # 5 money-math narratives (annotated frame sequences)
│   │   │   ├── motion/         # 5 animated variants of atoms (motion package)
│   │   │   └── index.ts        # public API — named exports only
│   │   ├── .storybook/         # main.ts (globs), preview.tsx (tokens + light/dark toolbar)
│   │   └── vite.config.ts      # lib build + vitest (jsdom)
│   ├── pool/                   # @riprap/pool — Codama client generated from programs/pool
│   └── hanse/                  # @riprap/hanse — Codama client generated from programs/hanse
├── programs/
│   ├── pool/                   # Anchor program `pool` — three-track mutual-pool primitive
│   └── hanse/                  # Anchor program `hanse` — event mutual (meta/specs/EVENT-MUTUAL.md)
├── tests/                      # @riprap/tests — jest e2e against a Surfpool surfnet (skips offline)
├── meta/                       # source-of-truth docs (not code)
│   ├── PROJECT.md              # the why and the what
│   ├── specs/                  # protocol specs (EVENT-MUTUAL.md — the hanse contract)
│   ├── Pool Program.md         # pool mechanics design notes
│   ├── naming.md               # naming session + locked decisions
│   ├── Breakpoint/             # the Blade Pool policy document
│   ├── primitives/             # the illustration spec this kit implements
│   └── marketing/              # the approved marketing package (copy source)
├── biome.json                  # lint + format, whole repo
└── pnpm-workspace.yaml         # packages/*, apps/*, tests; build-script approvals
```

### Data Flow

```
meta/primitives (spec) ──implements──▶ packages/ui ──workspace import──▶ apps/landing
        │                                    │                                │
        │                             tokens.css ◀──── imports ───────────────┘
        └── meta/marketing (copy) ─────────────────────────▶ landing sections
```

The dependency direction is one-way: the landing consumes the kit; the kit implements the spec; the spec and copy live in `meta/` and are never generated from code.

### Key Components

**Tokens (`packages/ui/src/tokens.css`)** — CSS custom properties, two modes (`:root` light, `[data-mode="dark"]`), semantic hues only: `funds` (money, always), `deliberation` (adjudication), `peril` (incidents, sparingly). Type scale 44/28/18/16/13. Motion constants: signature easing `--riprap-ease`, duration palette 180/320/560ms — collapsed to 1ms under `prefers-reduced-motion`.

**Pool math (`lib/poolMath.ts`)** — the money rules as pure functions, fully tested: `TIERS` (policy §5, the only allowed prices), `proRataShare` (`user_stake / total_stake × treasury`), `scaledPayout` (`min(tier cap, amount) × P/A` — the fail-closed wall), `fillHeight` (the area = money mapping), `usd` (deadpan money formatting).

**Stone geometry (`lib/stone.ts`)** — seeded deterministic irregular hexagons: 6 vertices, no two angles equal, rotation ±15°, coordinates snapped to the 4px grid. A member's seed renders the same stone in every scene — that is what makes a pile readable as _these_ members.

**Atoms (`src/atoms/`)** — each implements one spec file from `meta/primitives/atoms/`: `MemberStone`, `PoolVessel` (the most important — every dollar is inside it or visibly leaving it), `SponsorRuleCard`, `TierCapStations`, `JurorStone`, `ClaimFiled`, `JurorDraw`, `CommitRevealVote`, `Ruling`, `TreasuryPayout`, `ProRataRefund`, `Dissolution`. Atoms are `<g>` fragments positioned by `x`/`y` props; `SvgFrame` wraps standalone use and provides the accessibility contract (`role="img"` + `aria-labelledby`).

**Scenes (`src/scenes/`)** — composition per `meta/primitives/composition.md` § scene templates: `JoinFlow`, `ClaimFlow` (approved branch solid, rejected branch dashed — always drawn), `EndOfEventFlow`, `LifecycleOverview` (8 step chips + stepped balance trace).

**Data stories (`src/datastories/`)** — the five narratives from `meta/primitives/data-stories.md`: the standard story, the heavier-storm variant, the worst-case wall, the 1:100 tier ladder, the juror's side. Every figure doc-sourced, derived arithmetic labeled, shared money scale within a story.

**Motion (`src/motion/`)** — animated wrappers around the static atoms: `StoneSettle`, `PoolFill`, `WaveBreak` (the hero), `DissolutionScatter`, `BalanceTrace`. Personality: Premium/Corporate easing; stone is rigid material — no bounce, ever. All components render the final state under reduced-motion.

## The Illustration Language

Four laws from `meta/primitives/` that the kit enforces and reviewers should check:

1. **Area = money.** Fill height is linear in USDC at constant interior width; compared vessels share one scale. Unreadable ratios (1:100 caps) print numbers instead of lying with bars.
2. **Dashed = limit.** Caps, thresholds, window bounds are dashed; actual amounts are solid.
3. **Exactly two doors.** Money leaves a vessel only through `spending — adjudicated` or `liquidation`. No third exit is ever drawn, because none exists.
4. **Facts vs placeholders.** Doc-sourced numbers print in monospace; unknowns print as `{{PARAM}}` in monospace. A reader can always tell which is which.

## Environment Variables

None for the frontend — both packages are static builds with no runtime configuration; the landing's one optional var is `VITE_N8N_WEBHOOK_URL` (waitlist-form webhook, see `apps/landing/.env.example`). The operator CLI and the e2e suite read optional overrides, all defaulting to localnet:

| Variable                           | Used by                     | Default                                           | Meaning                                          |
| ---------------------------------- | --------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `RIPRAP_RPC_URL` / `RIPRAP_WS_URL` | CLI (`--rpc` / `--ws`), e2e | `http://127.0.0.1:8899` / `ws://127.0.0.1:8900`   | Solana JSON-RPC / WebSocket endpoint             |
| `RIPRAP_KEYPAIR_PATH`              | CLI (`--keypair`)           | `ANCHOR_WALLET` → `~/.config/solana/id.json`      | Signer keypair JSON                              |
| `RIPRAP_PAYER_PATH`                | e2e                         | `~/.config/solana/id.json`                        | e2e payer keypair                                |
| `RIPRAP_SMOKE_RPC`                 | CLI smoke test              | `http://127.0.0.1:8899`                           | Live-smoke endpoint; test skips when unreachable |
| `ACCORD_SO` / `ACCORD_KEYPAIR`     | e2e                         | `…/accord/target/deploy/` in the sibling checkout | Built accord program artifact + its keypair      |

Full CLI flag table (including `--commitment`, `--dry-run`, `--json`, `--quiet`): [`apps/cli/README.md`](apps/cli/README.md). Launch parameters that are still undecided are rendered as visible `{{PARAM}}` placeholders by design.

## Available Scripts

Run from the repo root unless noted:

| Command                                        | Description                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm install`                                 | Install and link all workspace packages                                                    |
| `pnpm build`                                   | Build every package (`pnpm -r run build`)                                                  |
| `pnpm lint`                                    | Biome lint + format check for the whole repo                                               |
| `pnpm lint:fix`                                | Biome with safe fixes + formatting applied                                                 |
| `pnpm test`                                    | Run every package's vitest suite                                                           |
| `pnpm verify`                                  | build → lint → test → `anchor build` → `cargo test`, the completion gate                   |
| `pnpm dev:landing`                             | Landing dev server (<http://localhost:5173>)                                                 |
| `pnpm dev:ui`                                  | Storybook dev server (<http://localhost:6006>)                                               |
| `pnpm --filter @riprap/ui run build-storybook` | Static Storybook build → `packages/ui/storybook-static/`                                   |
| `pnpm --filter @riprap/landing run preview`    | Serve the built landing locally                                                            |
| `anchor test`                                  | Full e2e: build, start Surfpool, deploy pool + hanse, run the jest suite (`@riprap/tests`) |
| `pnpm --filter @riprap/cli dev <cmd>`          | Run the `riprap` operator CLI from TypeScript sources                                      |

## Testing

### Running Tests

```bash
# Everything (what CI / the completion gate runs)
pnpm test

# E2e lane alone (jest, Surfpool) — skips cleanly with no validator
pnpm --filter @riprap/tests test

# One package
pnpm --filter @riprap/ui test
pnpm --filter @riprap/landing test

# Watch mode while developing
cd packages/ui && pnpm exec vitest

# One file
pnpm --filter @riprap/ui exec vitest run src/lib/poolMath.test.ts

# By test name
pnpm --filter @riprap/ui exec vitest run -t "area = money"
```

### What gets tested

- **`lib/`** — pure-function unit tests: the tier table (policy §5), pro-rata math on the worked example ($12,000 ÷ 1,000 = $12), the fail-closed payout wall (P/A scaling, cap-then-scale precedence), fill-height linearity and rim clamping, stone determinism/irregularity/grid snapping.
- **`atoms/` + `scenes/` + `datastories/`** — render tests via @testing-library: data bindings (labels printed, fill heights, dashed-vs-solid), composition invariants (both doors labeled, rejected branch present in `ClaimFlow`, story frames carry their headline numbers).
- **`apps/landing`** — a smoke test that the page mounts with its core sections; visual verification is done in a browser (see Storybook/landing dev servers), not snapshot tests.
- **`tests/` (`@riprap/tests`)** — jest e2e, specs a–e against a live Surfpool surfnet: solvent to-the-cent payouts, denied claims, over-treasury scaling, the appeal ladder, and window gates. Serial by design (`surfnet_timeTravel` warps the global surfnet clock). Live-run prerequisites: `anchor test` (deploys pool + hanse) plus a built sibling accord checkout (`cd ../accord && make build`, or `ACCORD_SO`); the accord rev is pinned in `programs/hanse/Cargo.toml`. With no validator reachable, every spec skips.
- **`apps/cli`** — vitest: help completeness and dry-run output always run; `surfpool-smoke.test.ts` goes live only when `RIPRAP_SMOKE_RPC` answers.

### Conventions

- Colocated `*.test.ts(x)` next to the code under test.
- Test names cite their source spec (`policy §7`, `composition.md § scale discipline`) so a failing test tells you which contract broke.
- No snapshots — assertions target data-bound output (text, geometry attributes), which is the actual contract.

## Storybook

```bash
pnpm dev:ui                # develop: http://localhost:6006
pnpm --filter @riprap/ui run build-storybook   # static build → packages/ui/storybook-static/
```

- Stories live colocated as `*.stories.tsx` and are globbed by `.storybook/main.ts`.
- The preview imports `tokens.css` and provides a **light/dark mode toolbar** (sets `data-mode`), mirroring the two palette modes from `composition.md`. Never mix modes within a scene.
- Every data prop is a control — the stories double as the interactive reference for the kit's API.
- Addons installed (Storybook 10 recommended set): a11y, docs, vitest, chromatic, mcp.

## Deployment

Both artifacts are static — no server, no runtime.

**Landing (primary artifact — `riprap.xyz`):**

```bash
pnpm --filter @riprap/landing run build
# → apps/landing/dist/  (index.html + hashed assets)
```

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, or your own nginx):

- Build command: `pnpm --filter @riprap/landing run build`
- Output directory: `apps/landing/dist`
- No SPA rewrites needed (single page, no router); if your host offers it, set `Cache-Control: immutable` for hashed assets and revalidate `index.html`.

**Storybook (docs site):**

```bash
pnpm --filter @riprap/ui run build-storybook
# → packages/ui/storybook-static/
```

Ship as a second static site (e.g. `design.riprap.xyz` or `/design` on the same host).

### On-chain programs — MVP restrictions (security review 2026-09-18)

`hanse:initialize` enforces three things operators cannot get wrong:

- **One mint.** `--deposit-mint` and `--fee-mint` must be the same mint — the program rejects mixed mints (`InvalidConfiguration`). Settlement adds claim and fee amounts as raw integers, so two different assets would corrupt payout math (ADR-0002).
- **Fixed payout pull window.** 180 days after settlement, hardcoded on-chain (`PULL_WINDOW_SECS` = 15 552 000 s) — there is no `--pull-window` flag. Unpaid amounts revert to the residual when the window closes.
- **Classic SPL Token only.** Token-2022 mints are not supported by the programs' token constraints; init rejects them by construction.

### Mainnet deployment

The Surfpool runbook (`runbooks/deployment/`, wired by `txtx.yml`) deploys both programs. The Surfnet-only instant-deploy cheatcode is gated to `localnet`; a mainnet run goes through the real deploy path. Once per program lifetime:

1. **Generate the program keypairs offline** (`solana-keygen new --no-passphrase -o pool-mainnet.json`, likewise `hanse-mainnet.json`) — keep them off this machine; the upgrade authority below is what matters day-to-day. Record the derived addresses in `Anchor.toml`'s commented `[programs.mainnet]` block.
2. **Pin the environment** in `txtx.yml` (`mainnet`): your RPC URL and the `expected_payer_address` / `expected_authority_address` values. `runbooks/deployment/signers.mainnet.txt` *enforces* both — a mismatched wallet fails the run. The authority should be the 2/3 Squads multisig (EVENT-MUTUAL §12), not a single key.
3. **Gate:** `pnpm verify` green, plus the live e2e (`anchor test`) against a mainnet-forked surfnet with the exact accord artifact pinned in `programs/hanse/Cargo.toml`.
4. **Deploy:** `surfpool run deployment --environment mainnet` (or the Surfpool Studio equivalent).
5. **Verify the deployment before announcing it:** for each program, `solana program show <id> --url mainnet` (owner = BPFLoaderUpgradeab1e, `ProgramData` authority = the multisig), then `solana program dump <id> dumped.so --url mainnet` and compare `sha256sum dumped.so target/deploy/<p>.so` — the deployed bytes must match the reviewed build. A mismatch is a stop-ship.


> [!IMPORTANT]
> There is no CI pipeline in the repo yet. Until one exists, `pnpm verify` is the release gate — run it before every push that touches `packages/`, `apps/`, `programs/`, or `tests/`.

## Troubleshooting

### `ERR_PNPM_IGNORED_BUILDS` on install

pnpm 11 blocks postinstall scripts. This repo allowlists `esbuild` in `pnpm-workspace.yaml`. If you hit this after adding a dependency with a build step, add its package name to `onlyBuiltDependencies` there and re-run `pnpm install`. Do not use `pnpm approve-builds` interactively — the allowlist must live in version control.

### Workspace package not resolving (`@riprap/ui` not found)

Run `pnpm install` from the repo root after cloning or adding packages — pnpm links workspace deps at install time. Confirm with `pnpm -r ls --depth -1`.

### Storybook shows unstyled atoms (black-on-black or white-on-white)

`tokens.css` is imported by `.storybook/preview.tsx`; if atoms render without it (e.g. embedded somewhere else), import it once in the consuming app (`import "@riprap/ui/tokens.css"` — see `apps/landing/src/index.css`).

### Dark mode doesn't toggle

The palette is driven by a `data-mode="dark"` attribute (Storybook toolbar sets it on a wrapper). If you wrap kit components yourself, set `data-mode` on an ancestor — the tokens cascade.

### Vitest picks up nothing / runs the wrong environment

Tests require `environment: "jsdom"` — configured in `packages/ui/vite.config.ts` and `apps/landing/vitest.config.ts`. If you add a package with tests, add the same config; don't rely on globals.

### Port conflicts (5173 / 6006 busy)

```bash
pnpm --filter @riprap/landing exec vite --port 5180
pnpm --filter @riprap/ui exec storybook dev -p 6007
```

### Type errors after moving/renaming kit exports

`@riprap/ui` is consumed as TypeScript source through the `exports` map (no build step between packages). Renames propagate instantly — and so do breakages. After touching `src/index.ts`, run `pnpm build` from the root; `tsc -b` in every package catches stale imports.

## Repository Map

| Path               | What it is                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `meta/PROJECT.md`  | The why and the what — read this first                                                                 |
| `meta/primitives/` | The illustration spec this kit implements (atoms, composition grammar, data stories)                   |
| `meta/marketing/`  | The approved marketing package; landing copy lives in `03-website-copy/landing-page.md`                |
| `meta/Breakpoint/` | The Blade Pool policy document (tiers, exclusions, claims rules)                                       |
| `meta/specs/`      | Protocol specs — `EVENT-MUTUAL.md` is the contract `programs/hanse` implements                         |
| `meta/naming.md`   | Naming decisions (Riprap locked, `riprap.xyz`, `@riprapxyz`)                                           |
| `packages/ui/`     | The illustration primitive kit                                                                         |
| `apps/landing/`    | The static landing page                                                                                |
| `programs/pool/`   | Anchor program `pool` — the three-track mutual-pool primitive                                          |
| `programs/hanse/`  | Anchor program `hanse` — event-mutual orchestrator (`meta/specs/EVENT-MUTUAL.md`)                      |
| `packages/pool/`   | `@riprap/pool` — Codama client generated from `programs/pool`                                          |
| `packages/hanse/`  | `@riprap/hanse` — Codama client generated from `programs/hanse`                                        |
| `apps/cli/`        | `@riprap/cli` — `riprap` operator CLI (single-signer; `hanse:claim-payout` co-signs via `--co-signer`) |
| `apps/docs/`       | ADRs and fleet bean files                                                                              |
| `tests/`           | `@riprap/tests` — jest e2e against a Surfpool surfnet (skips offline)                                  |
| `AGENTS.md`        | Instructions for coding agents working in this repo                                                    |
