---
# riprap-sa2w
title: shadcn select + ClusterSelect (props-driven) + tests + story
status: completed
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T14:05:48Z
parent: riprap-rckz
---

pnpm dlx shadcn@latest add select from packages/ui, restyle to DESIGN.md (0px radius, hairline, mono uppercase). ClusterSelect takes clusters/value/onValueChange — no connector import. Render test asserts labels come from props; law.test.ts stays green.

## Summary of Changes

- `pnpm dlx shadcn@latest add select` from `packages/ui` → `src/components/ui/select.tsx` restyled to DESIGN.md: rounded-none everywhere, hairline/hairline-strong borders, no shadow, no zoom (fade settle, matching dropdown-menu), tone-step item focus (`focus:bg-strong`), 44px default trigger (`data-[size=default]:h-11`), mono uppercase `SelectLabel`; fixed the registry's `import { cn } from "cn"` quirk to the relative `../../lib/utils`.
- `src/components/chrome/ClusterSelect.tsx` — props-driven (`clusters/value/onValueChange/disabled`), zero connector imports: mono-stamp trigger (uppercase CSS-case, labels verbatim from props), `cluster` prompt when unselected, ruled-plate list, check on the active item.
- Bug found during in-browser verification and fixed: `text-muted` maps to surface-strong (#1e2126 — a surface, not a text color) making placeholders/icons invisible; swapped to `text-muted-foreground` (#8a9096) in select.tsx, AddressChip's copy icon, and WalletDialog's `{{ADDRESS}}` placeholder. Browser-verified after fix: placeholder/chevron/icon rgb(138,144,150), selected value ink rgb(242,239,232).
- Tests: `cluster.test.tsx` — 5 render tests (labels from props incl. never-invented testnet, prompt state, onValueChange("mainnet-beta"), trigger law mono/uppercase/radius-0/hairline/44px, disabled non-open) with Radix Select jsdom stubs (ResizeObserver/pointer capture/scrollIntoView). Kit suite 159 green, `law.test.ts` green.
- Stories: `ClusterSelect.stories.tsx` (Default devnet / Unselected prompt); `build-storybook` green; `pnpm -r run build` + `pnpm -r run test` green; touched files biome-clean.
