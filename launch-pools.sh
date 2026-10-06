#!/usr/bin/env bash
# launch-pools.sh — launch the 8 Breakpoint pools (everything except Blade Pool)
# onto MAINNET, per apps/landing/src/mutuals/data.ts and the policy/terms docs
# in meta/Breakpoint/.
#
# Parameters locked in the 2026-10-06 grill round (see SETUP.BLADE-POOL.md for
# the lifecycle; mainnet Blade = the precedent this mirrors):
#   - filing fee F = (min_jury_size + 1) × fee_per_juror ≈ 20% of the smallest
#     honest success per pool (Blade mainnet: $200 on a $1,000 smallest tier)
#   - min_stake = entry fee per pool (Mert: $20, slash-dominance equality)
#   - alpha_bps = 10000 (100%, uniform with deployed Blade)
#   - windows 48h/24h/24h/48h, J=3, max_appeals 2 (ladder 3→7→15), reveal 2/3,
#     max_draw_attempts 3 — byte-identical to deployed mainnet Blade
#   - deposits close 2026-11-15T08:00:00Z (doors), claims close
#     2026-11-27T23:59:59Z (conference end + 10d lag, end of day) — as deployed
#
# POLICY HASHES ARE PLACEHOLDERS BY DESIGN. Each pool is skipped unless its
# POLICY_HASH_<SLUG> env var carries the sha256 of the FINAL, published policy
# doc (first 64 hex chars of `sha256sum`). Review and freeze each doc first:
# the hash is immutable on-chain; a post-init doc edit means a new mutual.
#
# USAGE
#   export RIPRAP_KEYPAIR_PATH=/path/to/operator.json   # becomes the IMMUTABLE
#       authority (payout pass-gate cranker) — dedicated ops keypair, not a personal key
#   export RIPRAP_RPC_URL=https://api.mainnet-beta.solana.com
#   export POLICY_HASH_CHAIRMAGEDDON=$(sha256sum "meta/Breakpoint/Micro Mutual — Chairmageddon - Policy.md" | cut -c1-64)
#   ... one POLICY_HASH_<SLUG> per pool you are launching today ...
#   ./launch-pools.sh            # interactive: dry-run + per-pool confirm + send
#   DRY_RUN=1 ./launch-pools.sh  # pre-flight + dry-run only, no sends
#   YES=1 ./launch-pools.sh      # no per-pool confirmation prompts
#
# OPS REMINDER (grill decision 5, accept + monitor): the honest-stake base is
# the majority-capture defense. At deposits-close (2026-11-15T08:00Z) check
# staker counts per pool; if thin (< ~20 stakers or stake base < 2× capped
# liability), the operator joins + stakes to close the gap.

set -euo pipefail
cd "$(dirname "$0")"

RPC="${RIPRAP_RPC_URL:-https://api.mainnet-beta.solana.com}"
USDC_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
EVIDENCE_OPERATOR="evidb4PuV34bca3YGyLg3Q9bcDJ9USPBiHYuf97XjrK" # = deployed Blade
DEPOSITS_CLOSE_ISO="2026-11-15T08:00:00Z"
CLAIMS_CLOSE_ISO="2026-11-27T23:59:59Z"
REVIEW_WINDOW=172800   # 48h
COMMIT_WINDOW=86400    # 24h
REVEAL_WINDOW=86400    # 24h
APPEAL_WINDOW=172800   # 48h
MAX_APPEALS=2          # ladder 3 → 7 → 15
MIN_JURY_SIZE=3
REVEAL_THRESHOLD_BPS=6666
MAX_DRAW_ATTEMPTS=3
ALPHA_BPS=10000

DEPOSITS_CLOSE_TS="$(date -u -d "$DEPOSITS_CLOSE_ISO" +%s)"
CLAIMS_CLOSE_TS="$(date -u -d "$CLAIMS_CLOSE_ISO" +%s)"
NOW_TS="$(date -u +%s)"

cli() { node apps/cli/bin/run.js "$@" --rpc "$RPC"; }
usdc() { echo $(( $1 * 1000000 )); } # 6-decimal USDC: dollars → raw

# Seeds: 0 = Blade mainnet, 1 = Blade devnet (BXGcC19c…) — new pools take 2–9.
POOLS=(
  "chairmageddon|Chairmageddon|2|10|40|2|10|Micro Mutual — Chairmageddon - Policy.md"
  "ngmi-hairline|NGMI Hairline|3|10|200|1|10|Micro Mutual — NGMI Hairline - Policy.md"
  "coffee-apocalypse|Coffee Apocalypse|4|10|25|1|10|Micro Mutual — Coffee Apocalypse - Policy.md"
  "onlyfriends|OnlyFriends|5|50|500|1|50|Micro Bounty — OnlyFriends - Terms.md"
  "keep-raj-warm|Operation Keep Raj Warm|6|5|50|2|5|Micro Bounty — Operation Keep Raj Warm - Terms.md"
  "lilys-liquid-lifeline|Lily's Liquid Lifeline|7|5|50|2|5|Micro Bounty — Lily's Liquid Lifeline - Terms.md"
  "toly-needs-his-fuel|Toly Needs His Fuel|8|5|50|2|5|Micro Bounty — Toly Needs His Fuel - Terms.md"
  "mert-of-the-year|Mert of the Year|9|10|1000|10|20|Micro Bounty — Mert of the Year - Terms.md"
)

hash_var_for() { echo "POLICY_HASH_$(echo "$1" | tr '[:lower:]-' '[:upper:]_')"; }

echo "═══════════════════════════════════════════════════════════════════"
echo " riprap launch-pools.sh — 8 Breakpoint pools (not Blade) → MAINNET"
echo "═══════════════════════════════════════════════════════════════════"
echo " rpc                : $RPC"
echo " deposits close     : $DEPOSITS_CLOSE_ISO ($DEPOSITS_CLOSE_TS)"
echo " claims close       : $CLAIMS_CLOSE_ISO ($CLAIMS_CLOSE_TS)"
echo " windows r/c/rv/ap  : ${REVIEW_WINDOW}s/${COMMIT_WINDOW}s/${REVEAL_WINDOW}s/${APPEAL_WINDOW}s"
echo " jury               : J=$MIN_JURY_SIZE appeals=$MAX_APPEALS (3→7→15) reveal=${REVEAL_THRESHOLD_BPS}bps α=${ALPHA_BPS}bps"
echo

# ── Pre-flight: dates + config sanity ────────────────────────────────────────
[ "$CLAIMS_CLOSE_TS" -gt "$DEPOSITS_CLOSE_TS" ] || { echo "FATAL: claims_close ≤ deposits_close"; exit 1; }
[ "$DEPOSITS_CLOSE_TS" -gt "$NOW_TS" ] || { echo "FATAL: deposits_close is in the past — pre-registration window gone"; exit 1; }
[ -n "${RIPRAP_KEYPAIR_PATH:-}" ] || { echo "FATAL: RIPRAP_KEYPAIR_PATH not set — this keypair becomes the immutable mutual authority"; exit 1; }
command -v node >/dev/null || { echo "FATAL: node not found"; exit 1; }
[ -f apps/cli/bin/run.js ] || { echo "FATAL: CLI not built — run: pnpm --filter @riprap/cli build"; exit 1; }

cli config:show
echo

# ── Per-pool pre-flight: game-theory table + slash-dominance gate ────────────
# The chain enforces α·min_stake ≥ 2·fee_per_juror at create_subaccord
# (MIN_SLASH_FEE_RATIO, ADR-0029) — initialize reverts otherwise. Assert here
# so the failure is ours, in bash, before any tx.
echo "── Economic pre-flight (F = (J+1)·fpj filing fee; slash = α·min_stake) ──"
printf '%-22s %-6s %-8s %-6s %-6s %-9s %-10s %s\n' POOL ENTRY MAXPAY fpj FEE F/smallest slash≥2fpj policy-hash
for entry in "${POOLS[@]}"; do
  IFS='|' read -r slug name seed entry_usd maxpay_usd fpj_usd minstake_usd doc <<<"$entry"
  var="$(hash_var_for "$slug")"
  hash="${!var:-}"
  fee_usd=$(( (MIN_JURY_SIZE + 1) * fpj_usd ))
  smallest=$( [ "$slug" = "ngmi-hairline" ] && echo 20 || { [ "$slug" = "onlyfriends" ] && echo 50 || echo "$maxpay_usd"; } )
  slash_ok=$(( ALPHA_BPS * minstake_usd / 10000 >= 2 * fpj_usd )) # $ units; α=100%
  [ "$slash_ok" -eq 1 ] || { echo "FATAL: $slug fails slash-dominance (α·min_stake < 2·fpj) — chain would revert"; exit 1; }
  ratio=$(( fee_usd * 100 / smallest ))
  hash_state="SET"
  [ -z "$hash" ] && hash_state="PLACEHOLDER — pool will be SKIPPED"
  printf '%-22s $%-5s $%-7s $%-6s $%-6s %-9s %-10s %s\n' "$name" "$entry_usd" "$maxpay_usd" "$fpj_usd" "${fee_usd}" "${ratio}%" "ok" "$hash_state"
done
echo
echo "Current sha256 of each policy doc (compare after you finalize + publish):"
for entry in "${POOLS[@]}"; do
  IFS='|' read -r slug name seed entry_usd maxpay_usd fpj_usd minstake_usd doc <<<"$entry"
  [ -f "meta/Breakpoint/$doc" ] && echo "  $(sha256sum "meta/Breakpoint/$doc" | cut -c1-16)…  $doc" || echo "  MISSING     $doc"
done
echo

# ── Launch loop ──────────────────────────────────────────────────────────────
LOG="launch-addresses.log"
launched=0; skipped=0

mutual_pda() { # seed → mutual PDA, seeds ["mutual", le-u64 seed] (packages/hanse/src/pdas.ts)
  (cd apps/cli && node --input-type=module -e "
import { address, getProgramDerivedAddress, getU64Encoder } from '@solana/kit';
const enc = getU64Encoder();
const [a] = await getProgramDerivedAddress({
  programAddress: address('rip6LwufCPcuDsCp2G184dBLGwpTTNcv3F2aKUbfpk6'),
  seeds: [new TextEncoder().encode('mutual'), enc.encode(BigInt('$1'))],
});
console.log(a);")
}

pda_exists() { # address → 0/1 (needs RPC)
  local code
  code=$(node --input-type=module -e "
const r = await fetch('$RPC', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getAccountInfo', params:['$1', {encoding:'base64'}] })});
const j = await r.json();
console.log(j.result && j.result.value ? 1 : 0);" 2>/dev/null) && echo "$code" || echo 0
}

for entry in "${POOLS[@]}"; do
  IFS='|' read -r slug name seed entry_usd maxpay_usd fpj_usd minstake_usd doc <<<"$entry"
  var="$(hash_var_for "$slug")"
  hash="${!var:-}"

  echo "───────────────────────────────────────────────────────────────────"
  if [ -z "$hash" ] && [ "${DRY_RUN:-0}" != "1" ]; then
    echo "SKIP $name — $var not set (policy doc not finalized/hashed yet)"
    skipped=$((skipped + 1)); continue
  fi
  [ -z "$hash" ] && hash="0000000000000000000000000000000000000000000000000000000000000000"
  # placeholder hashes only ever reach --dry-run, never a send

  tier="$(usdc "$entry_usd"):$(usdc "$maxpay_usd")" # flat pool: same tier ×3 slots
  fee_usd=$(( (MIN_JURY_SIZE + 1) * fpj_usd ))

  echo "▶ $name (seed $seed)"
  echo "  tier $entry_usd→$maxpay_usd USD ×3 · filing fee \$${fee_usd} · min_stake \$${minstake_usd} · α 100%"

  pda="$(mutual_pda "$seed")"
  if [ "$(pda_exists "$pda")" = "1" ]; then
    echo "  SKIP — mutual PDA $pda already exists (seed collision; pick another seed)"; skipped=$((skipped + 1)); continue
  fi
  echo "  mutual PDA (free): $pda"

  cli hanse:initialize \
    --seed "$seed" \
    --deposit-mint "$USDC_MINT" --fee-mint "$USDC_MINT" \
    --tier "$tier" --tier "$tier" --tier "$tier" \
    --policy-hash "$hash" \
    --deposits-close-at "$DEPOSITS_CLOSE_TS" \
    --claims-close-at "$CLAIMS_CLOSE_TS" \
    --min-stake "$(usdc "$minstake_usd")" --alpha-bps "$ALPHA_BPS" \
    --review-window "$REVIEW_WINDOW" --commit-window "$COMMIT_WINDOW" \
    --reveal-window "$REVEAL_WINDOW" --appeal-window "$APPEAL_WINDOW" \
    --max-appeals "$MAX_APPEALS" --min-jury-size "$MIN_JURY_SIZE" \
    --fee-per-juror "$(usdc "$fpj_usd")" \
    --reveal-threshold-bps "$REVEAL_THRESHOLD_BPS" \
    --max-draw-attempts "$MAX_DRAW_ATTEMPTS" \
    --evidence-operator "$EVIDENCE_OPERATOR" \
    --dry-run

  if [ "${DRY_RUN:-0}" = "1" ]; then echo "  (dry-run only — not sending)"; continue; fi

  if [ "${YES:-0}" != "1" ]; then
    read -r -p "  Launch $name on mainnet? [y/N] " answer
    case "$answer" in y|Y) ;; *) echo "  skipped by operator"; skipped=$((skipped + 1)); continue ;; esac
  fi

  out="$(cli hanse:initialize \
    --seed "$seed" \
    --deposit-mint "$USDC_MINT" --fee-mint "$USDC_MINT" \
    --tier "$tier" --tier "$tier" --tier "$tier" \
    --policy-hash "$hash" \
    --deposits-close-at "$DEPOSITS_CLOSE_TS" \
    --claims-close-at "$CLAIMS_CLOSE_TS" \
    --min-stake "$(usdc "$minstake_usd")" --alpha-bps "$ALPHA_BPS" \
    --review-window "$REVIEW_WINDOW" --commit-window "$COMMIT_WINDOW" \
    --reveal-window "$REVEAL_WINDOW" --appeal-window "$APPEAL_WINDOW" \
    --max-appeals "$MAX_APPEALS" --min-jury-size "$MIN_JURY_SIZE" \
    --fee-per-juror "$(usdc "$fpj_usd")" \
    --reveal-threshold-bps "$REVEAL_THRESHOLD_BPS" \
    --max-draw-attempts "$MAX_DRAW_ATTEMPTS" \
    --evidence-operator "$EVIDENCE_OPERATOR" \
    --json)"
  addr="$(echo "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).mutual))')"
  sig="$(echo "$out"  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).signature))')"
  echo "  ✓ confirmed: $sig"
  echo "  mutual: $addr"

  echo "── verify $name ──"
  cli hanse:show --mutual "$addr"
  echo "$(date -u +%FT%TZ) $slug seed=$seed mutual=$addr policy_hash=$hash sig=$sig" >>"$LOG"
  launched=$((launched + 1))
done

echo "───────────────────────────────────────────────────────────────────"
echo "done: $launched launched, $skipped skipped. Addresses appended to $LOG"
[ "$launched" -gt 0 ] && echo "NEXT: pin each mutual pubkey into apps/landing/src/mutuals/data.ts (poolRouteId)."
echo "OPS : at $DEPOSITS_CLOSE_ISO check per-pool staker counts (thin honest base = capture risk)."
