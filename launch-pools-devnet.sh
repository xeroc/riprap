#!/usr/bin/env bash
# launch-pools.sh — launch the 8 Breakpoint pools (everything except Blade Pool)
# onto MAINNET. Plain CLI calls, all parameters hard-coded, in the same shape
# as the SETUP.BLADE-POOL.md §4.2 example block.
#
# Prerequisites (SETUP.BLADE-POOL.md §1–§2):
#   export RIPRAP_KEYPAIR_PATH=/path/to/operator.json  # becomes the IMMUTABLE
#       authority (payout pass-gate cranker) — dedicated ops keypair, not a personal key
#
# Every command below ends in --dry-run (builds + prints the instruction,
# signs nothing). To SEND: delete the --dry-run line, run again, record the
# printed mutual address, then verify:
#   pnpm --filter @riprap/cli dev hanse:show --mutual <MUTUAL> --rpc https://api.devnet.solana.com
# Afterwards pin each mutual pubkey into apps/landing/src/mutuals/data.ts.
#
# ── Parameter provenance (verified 2026-10-07) ────────────────────────────────
# Entry/payout tiers and adjudication fees: each pool's policy/terms doc §5/§7
# in meta/Breakpoint/ (all final 2026-10-07). On-chain filing fee =
# (min_jury_size + 1) × fee_per_juror (file_claim.rs, ADR-0030), so
# fee-per-juror = policy fee ÷ 4 with J=3 — each block's numbers reproduce the
# doc's stated fee exactly:
#   Chairmageddon $8  NGMI $4  Coffee $4  OnlyFriends $4
#   Raj/Lily/Toly $8  Mert $40
# min-stake = max(entry fee, 2 × fee-per-juror) — the chain's slash-dominance
# gate (α·min_stake ≥ 2·fpj); Mert is the only pool bumped ($10 → $20).
# Everything else is byte-identical to the DEPLOYED mainnet Blade mutual
# (DtjVEhcr… / subaccord 6GZuBhcc…, read back 2026-10-07):
#   α 10000 (100%) · windows 48h/24h/24h/48h · J=3 · max-appeals 2 (3→7→15)
#   reveal 6666 · max-draw 3 · evidence operator evidb4…
#   deposits close 1794729600 = 2026-11-15T08:00Z (doors, §12)
#   claims   close 1795823999 = 2026-11-27T23:59:59Z (conference end + 10d,
#   end of day — every policy doc §2: "closes 10 days after the conference ends")
# Seeds: 0 = Blade mainnet, 1 = Blade devnet — these pools take 2–9.
# USDC mainnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU (6 decimals:
# $X → X_000000 raw).
#
# POLICY HASH: --policy-hash takes the sha256 of the FINAL, published policy
# doc — immutable on-chain; a post-init doc edit means a new mutual. Each
# block hashes the doc file inline; freeze + publish each doc first.

cd "$(dirname "$0")"

# ── 1. Chairmageddon · seed 2 · $10 / up to $40 · fee $8 (fpj $2) ────────────
pnpm --filter @riprap/cli dev hanse:initialize \
  --seed 2 \
  --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
  --tier 10000000:40000000 --tier 10000000:40000000 --tier 10000000:40000000 \
  --policy-hash "$(sha256sum "meta/Breakpoint/Micro Mutual — Chairmageddon - Policy.md" | cut -c1-64)" \
  --deposits-close-at $(date +%s -u -d "2026-11-15T08:00:00") \
  --claims-close-at $(date +%s -u -d "2026-11-27T23:59:59") \
  --min-stake 10000000 --alpha-bps 10000 \
  --review-window 172800 --commit-window 86400 --reveal-window 86400 \
  --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 2000000 \
  --reveal-threshold-bps 6666 --max-draw-attempts 3 \
  --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
  --rpc https://api.devnet.solana.com \
  --dry-run

# # ── 2. NGMI Hairline · seed 3 · $10 / up to $200 · fee $4 (fpj $1) ───────────
# pnpm --filter @riprap/cli dev hanse:initialize \
#   --seed 3 \
#   --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
#   --tier 10000000:200000000 --tier 10000000:200000000 --tier 10000000:200000000 \
#   --policy-hash "$(sha256sum "meta/Breakpoint/Micro Mutual — NGMI Hairline - Policy.md" | cut -c1-64)" \
#   --deposits-close-at 1794729600 \
#   --claims-close-at 1795823999 \
#   --min-stake 10000000 --alpha-bps 10000 \
#   --review-window 172800 --commit-window 86400 --reveal-window 86400 \
#   --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 1000000 \
#   --reveal-threshold-bps 6666 --max-draw-attempts 3 \
#   --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
#   --rpc https://api.devnet.solana.com \
#   --dry-run
#
# # ── 3. Coffee Apocalypse · seed 4 · $10 / up to $25 · fee $4 (fpj $1) ────────
# pnpm --filter @riprap/cli dev hanse:initialize \
#   --seed 4 \
#   --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
#   --tier 10000000:25000000 --tier 10000000:25000000 --tier 10000000:25000000 \
#   --policy-hash "$(sha256sum "meta/Breakpoint/Micro Mutual — Coffee Apocalypse - Policy.md" | cut -c1-64)" \
#   --deposits-close-at 1794729600 \
#   --claims-close-at 1795823999 \
#   --min-stake 10000000 --alpha-bps 10000 \
#   --review-window 172800 --commit-window 86400 --reveal-window 86400 \
#   --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 1000000 \
#   --reveal-threshold-bps 6666 --max-draw-attempts 3 \
#   --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
#   --rpc https://api.devnet.solana.com \
#   --dry-run
#
# # ── 4. OnlyFriends · seed 5 · $50 / up to $500 (10 × $50) · fee $4 (fpj $1) ──
# pnpm --filter @riprap/cli dev hanse:initialize \
#   --seed 5 \
#   --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
#   --tier 50000000:500000000 --tier 50000000:500000000 --tier 50000000:500000000 \
#   --policy-hash "$(sha256sum "meta/Breakpoint/Micro Bounty — OnlyFriends - Terms.md" | cut -c1-64)" \
#   --deposits-close-at 1794729600 \
#   --claims-close-at 1795823999 \
#   --min-stake 50000000 --alpha-bps 10000 \
#   --review-window 172800 --commit-window 86400 --reveal-window 86400 \
#   --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 1000000 \
#   --reveal-threshold-bps 6666 --max-draw-attempts 3 \
#   --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
#   --rpc https://api.devnet.solana.com \
#   --dry-run
#
# # ── 5. Operation Keep Raj Warm · seed 6 · $5 / up to $50 · fee $8 (fpj $2) ───
# pnpm --filter @riprap/cli dev hanse:initialize \
#   --seed 6 \
#   --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
#   --tier 5000000:50000000 --tier 5000000:50000000 --tier 5000000:50000000 \
#   --policy-hash "$(sha256sum "meta/Breakpoint/Micro Bounty — Operation Keep Raj Warm - Terms.md" | cut -c1-64)" \
#   --deposits-close-at 1794729600 \
#   --claims-close-at 1795823999 \
#   --min-stake 5000000 --alpha-bps 10000 \
#   --review-window 172800 --commit-window 86400 --reveal-window 86400 \
#   --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 2000000 \
#   --reveal-threshold-bps 6666 --max-draw-attempts 3 \
#   --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
#   --rpc https://api.devnet.solana.com \
#   --dry-run
#
# # ── 6. Lily's Liquid Lifeline · seed 7 · $5 / up to $50 · fee $8 (fpj $2) ────
# pnpm --filter @riprap/cli dev hanse:initialize \
#   --seed 7 \
#   --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
#   --tier 5000000:50000000 --tier 5000000:50000000 --tier 5000000:50000000 \
#   --policy-hash "$(sha256sum "meta/Breakpoint/Micro Bounty — Lily's Liquid Lifeline - Terms.md" | cut -c1-64)" \
#   --deposits-close-at 1794729600 \
#   --claims-close-at 1795823999 \
#   --min-stake 5000000 --alpha-bps 10000 \
#   --review-window 172800 --commit-window 86400 --reveal-window 86400 \
#   --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 2000000 \
#   --reveal-threshold-bps 6666 --max-draw-attempts 3 \
#   --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
#   --rpc https://api.devnet.solana.com \
#   --dry-run
#
# # ── 7. Toly Needs His Fuel · seed 8 · $5 / up to $50 · fee $8 (fpj $2) ───────
# pnpm --filter @riprap/cli dev hanse:initialize \
#   --seed 8 \
#   --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
#   --tier 5000000:50000000 --tier 5000000:50000000 --tier 5000000:50000000 \
#   --policy-hash "$(sha256sum "meta/Breakpoint/Micro Bounty — Toly Needs His Fuel - Terms.md" | cut -c1-64)" \
#   --deposits-close-at 1794729600 \
#   --claims-close-at 1795823999 \
#   --min-stake 5000000 --alpha-bps 10000 \
#   --review-window 172800 --commit-window 86400 --reveal-window 86400 \
#   --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 2000000 \
#   --reveal-threshold-bps 6666 --max-draw-attempts 3 \
#   --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
#   --rpc https://api.devnet.solana.com \
#   --dry-run
#
# # ── 8. Mert of the Year · seed 9 · $10 / up to $1000 · fee $40 (fpj $10) ─────
# # min-stake $20 (not the $10 entry): slash-dominance needs α·min_stake ≥ 2·fpj
# # = 2 × $10 — the one pool where the entry fee is below the floor.
# pnpm --filter @riprap/cli dev hanse:initialize \
#   --seed 9 \
#   --deposit-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --fee-mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
#   --tier 10000000:1000000000 --tier 10000000:1000000000 --tier 10000000:1000000000 \
#   --policy-hash "$(sha256sum "meta/Breakpoint/Micro Bounty — Mert of the Year - Terms.md" | cut -c1-64)" \
#   --deposits-close-at 1794729600 \
#   --claims-close-at 1795823999 \
#   --min-stake 20000000 --alpha-bps 10000 \
#   --review-window 172800 --commit-window 86400 --reveal-window 86400 \
#   --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 10000000 \
#   --reveal-threshold-bps 6666 --max-draw-attempts 3 \
#   --evidence-operator evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK \
#   --rpc https://api.devnet.solana.com \
#   --dry-run
#
# # OPS REMINDER (grill decision, accept + monitor): the honest-stake base is the
# # majority-capture defense. At deposits-close (2026-11-15T08:00Z) check staker
# # counts per pool; if thin (< ~20 stakers or stake base < 2× capped liability),
# # the operator joins + stakes to close the gap.
