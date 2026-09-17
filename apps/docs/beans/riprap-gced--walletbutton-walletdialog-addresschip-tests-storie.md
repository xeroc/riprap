---
# riprap-gced
title: WalletButton + WalletDialog + AddressChip + tests + stories
status: completed
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T14:05:48Z
parent: riprap-rckz
---

Props-driven wallet picker on existing Dialog (connectors, onConnect(id), connected, address, onDisconnect) + mono shortened-address chip with copy affordance (data-num). Zero-connector render = disabled state. DESIGN.md styling; reduced-motion final state.

## Summary of Changes

- `packages/ui/src/components/chrome/AddressChip.tsx` — mono shortened-address chip (head…tail, base58 verbatim) with copy affordance: click copies the FULL address, check+`copied` settle-safe word swap (color-only transitions collapse under reduced motion), native `title` carries the full address, `data-num` on the chip, JetBrains Mono label token, hairline-strong border, radius 0, 44px tap zone. Exports `shortenAddress` for app reuse.
- `packages/ui/src/components/chrome/WalletDialog.tsx` — props-driven wallet picker on the kit Dialog (zero wallet-library imports): disconnected = one outline button per connector calling `onConnect(id)`; `connectors: []` renders the disabled `No wallets available` state; connected = `AddressChip` reuse + `Disconnect` footer; missing address renders the `{{ADDRESS}}` mono placeholder (kit data law).
- Stories: `AddressChip.stories.tsx`, `WalletDialog.stories.tsx` (Picker / Connected / NoWallets via a controlled Playground; sample address = devnet USDC mint per milestone riprap-9ehc).
- Tests: `wallet.test.tsx` — 8 render tests (shortening verbatim, mono/data-num/title, radius-0 + hairline law, full-address copy + copied feedback, onConnect(id) routing, zero-connector disabled, connected chip + disconnect, `{{ADDRESS}}` placeholder). Kit suite: 154 passed.
- Exported via `components/index.ts` → public API. Verified in a real browser against the built Storybook (all three dialog states + chip copy interaction, computed styles: 0px radius, no shadow, JetBrains Mono 600/12px/+0.8px). `pnpm --filter @riprap/ui run build`, `build-storybook`, `pnpm -r run build`, `pnpm -r run test` all green; my files biome-clean (pre-existing lint errors recorded as draft bean riprap-jiz5).
