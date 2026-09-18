---
# riprap-v78i
title: TopNav actions slot + JurorUpsellDialog + tests + story
status: completed
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T14:05:48Z
parent: riprap-rckz
---

TopNav gains actions?: ReactNode (brand/links unchanged). JurorUpsellDialog: open/onOk/minStake props, copy supplied by the page (kit stays copy-free), OK-only, settle motion, minStake mono.

## Summary of Changes

- `TopNav` gains `actions?: React.ReactNode` — rendered inside the right-side cluster before Sign In (`data-slot="top-nav-actions"`); brand/links/signIn/cta untouched. New story `WithActions` dogfoods the kit: ClusterSelect + AddressChip in the slot.
- `JurorUpsellDialog` — OK-only, copy-free: `open/onOk/minStake/title/body/okLabel?`. Title+body render verbatim from props (the copy doc owns the words); `minStake` renders in mono-number-lg with `data-num` on a strong hairline number plate (radius 0); `showCloseButton={false}` so OK is the only button — Escape and overlay dismissal also map to `onOk`. Settle-by-opacity via the kit Dialog; reduced-motion collapses to the final state.
- Tests: `juror.test.tsx` (5: copy verbatim, mono-plate law, single OK button + onOk, Escape = onOk, closed renders nothing) and a TopNav actions-slot test in `chrome.test.tsx` (slot renders controls, links stay mono). Kit suite 165 green; `pnpm -r run build` + `test` green; touched files biome-clean.
- Browser-verified against the built Storybook: dialog shows "$10" in JetBrains Mono 32px/600 on a #1e2126 hairline plate, exactly one OK button, OK closes; TopNav slot sits between links and CTA at 44px controls and the cluster picker switches (devnet→localnet) in place.
