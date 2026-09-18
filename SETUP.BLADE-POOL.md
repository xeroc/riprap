# SETUP.BLADE-POOL.md — Riprap: Blade Pool @ Breakpoint 2026

Operator runbook: bring up the Blade Pool mutual on **devnet** or **mainnet** with the `riprap` CLI, from pre-flight to dissolution. Instance surface for the pilot (15–17 Nov 2026, Olympia Convention Centre, London); platform behavior is defined in `meta/specs/EVENT-MUTUAL.md`, pilot numbers in its §12 (frozen 2026-08-31), tier economics in the policy doc §5. Every number below cites its source.

Lifecycle you are driving:

```
deploy check → hanse:initialize → seed jurors (accord stake)
     → hanse:join × N members        [deposits close 2026-11-15 08:00 UTC]
     → hanse:file-claim / settle-claim   (incident window; accord adjudicates)
     → hanse:settle-pool             [claims close 2026-12-01 18:00 UTC, all claims resolved]
     → hanse:claim-payout × claimants (claimant + admin co-sign)
     → hanse:dissolve                [pull window closes ≈ settle + 180d]
     → pool:crank × members          (residual exits; mutual permanently dissolved)
```

---

## 1. Prerequisites

### 1.1 Programs on the target cluster

Three programs must be deployed and live before anything else:

| Program | Address (baked into the SDKs) | Built from |
|---|---|---|
| `pool` | `63EvHuWaMRSZhD9EPXd7UeW5YFFv41GQUHpv7LpY6wm1` | this repo, `programs/pool` |
| `hanse` | `DTSwUuWC1SpZP8LcJ1EJ4HtUxAczqwrsgqNYnR1QXK3p` | this repo, `programs/hanse` |
| `accord` | `cordhVoshqRV6kzGBmM89A66wuusJGsDCvLMHPLyKed` | sibling repo, rev `ba91bd8b8b374091c174909b115688ffb9b231ff` (`programs/hanse/Cargo.toml` pin) |

The CLI derives every PDA against these addresses — they come from `packages/{pool,hanse}/generated/` and `@useaccord/sdk`, not from flags. Therefore:

- **Deploy with the existing keypairs** (`target/deploy/{pool,hanse}-keypair.json`) so the on-chain program ids match the baked-in addresses, or
- **New keypairs → new ids**: fill `[programs.devnet]` / `[programs.mainnet]` in `Anchor.toml`, redeploy, re-run `pnpm --filter @riprap/pool codegen && pnpm --filter @riprap/hanse codegen`, rebuild. The accord pin must stay at the rev above.

Verify reachability from the CLI's point of view:

```bash
pnpm --filter @riprap/cli build
node apps/cli/bin/run.js config:show --rpc <RPC>
node apps/cli/bin/run.js config:balance --rpc <RPC>
```

`config:show` prints the resolved rpc/ws/wallet and the program ids it will target; `config:balance` confirms the wallet can pay fees.

### 1.2 Wallets

| Wallet | Used for | Notes |
|---|---|---|
| **Operator/admin keypair** | `hanse:initialize` | Becomes the mutual's immutable `authority`: the payout pass-gate co-signer and the only key that can propose `set-subaccord-param` (EVENT-MUTUAL §2.10). Not recoverable or transferable later — use a dedicated operations keypair (target: Squads 2/3 multisig per §12 "Upgrade authority"), never a personal key. |
| **Member keypairs** | `hanse:join`, `hanse:file-claim`, `hanse:claim-payout` | One per member; each is its own claim key. |
| **Sponsor keypair (optional)** | `hanse:join --sponsor` | Pays a member's contribution, receives the residual; claim rights stay the member's. |

Every wallet needs SOL for fees/rent. The initializer additionally pays rent for the Mutual, Pool, and fee-float accounts; each joiner (or their sponsor) pays Member + Depositor rent.

### 1.3 Token (USDC)

Single-asset v1: `--deposit-mint` must equal `--fee-mint`, classic SPL Token only, no Token-2022 (security review 2026-09-18; EVENT-MUTUAL §7).

- **Mainnet**: USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (6 decimals).
- **Devnet**: pick/create a 6-decimal test mint and distribute it — the tier math below assumes 6 decimals. Set `{{USDC_MINT}}` accordingly.

### 1.4 Gates before mainnet

Per §12 runtime path: devnet e2e green (claim → appeal → settle → pull) → mainnet go/no-go ≈ Nov 1, and the counsel checkpoint on cover terms + landing copy (EVENT-MUTUAL §11) must be cleared first. Do not initialize on mainnet ahead of those.

---

## 2. CLI environment

Flags per command or env vars (full table: `apps/cli/README.md` § Configuration):

```bash
export RIPRAP_RPC_URL="https://api.devnet.solana.com"     # mainnet: https://api.mainnet-beta.solana.com
export RIPRAP_KEYPAIR_PATH="/path/to/operator.json"       # 64-uint8 keypair JSON
```

- `--rpc/-r`, `--ws/-w`, `--keypair/-k`, `--commitment` (default `confirmed`).
- `--dry-run` builds and prints the instruction (accounts + data hex) without signing — **use it before every send**.
- `--json` for machine-readable output (bigints as decimal strings); `--quiet` for signature-only.

Shorthand below: `riprap` = `node apps/cli/bin/run.js` (built) or `pnpm --filter @riprap/cli dev` (source).

---

## 3. Frozen pilot parameters (EVENT-MUTUAL §12)

Ready-to-paste values. USDC = 6 decimals, so `$X` → `X_000000` raw.

| Parameter | Value | Raw | Source |
|---|---|---|---|
| `--tier` (Basic) | $10 entry / $1,000 max payout | `10000000:1000000000` | policy §5 |
| `--tier` (Standard) | $20 / $2,000 | `20000000:2000000000` | policy §5 |
| `--tier` (Premium) | $40 / $4,000 | `40000000:4000000000` | policy §5 |
| `--deposits-close-at` | 2026-11-15 08:00 UTC (doors at Olympia; join is pre-registration only) | `1794729600` | §12 |
| `--claims-close-at` | 2026-12-01 18:00 UTC (coverage end Nov 17 18:00 + 14d lag) | `1796148000` | §12 |
| `--min-jury-size` | 3 | `3` | §12 |
| `--fee-per-juror` | 5 USDC (filing fee = 3 × 5 = 15 USDC) | `5000000` | §12 |
| `--min-stake` | 10 USDC | `10000000` | §12 |
| `--review-window` | 48h | `172800` | §12 |
| `--commit-window` | 12h | `43200` | §12 |
| `--reveal-window` | 12h | `43200` | §12 |
| `--appeal-window` | 48h | `172800` | §12 |
| `--max-appeals` | 2 (ladder 3 → 7 → 15) | `2` | §12 |
| `--alpha-bps` | 10% | `1000` | §12 (pending accord domain-bound check) |
| `--reveal-threshold-bps` | 2/3 | `6666` | accord default |
| `--max-draw-attempts` | 3 | `3` | CLI example / accord bounds |
| pull window | 180 days | — | **not a flag** — hardcoded on-chain (`PULL_WINDOW_SECS`, security review 2026-09-18) |
| `--seed` | any unused u64 | your pick | PDA seed; collision ⇒ pick another |
| `--evidence-operator` | operator pubkey of the encrypted-evidence pipeline | `{{EVIDENCE_OPERATOR_PUBKEY}}` | EVENT-MUTUAL §9, §11 |

Timeline sanity (§12): a claim filed at the last minute (Dec 1) resolves through the full ladder ≈ Dec 16 → settlement ≈ Dec 16 → pulls close ≈ 2027-06-14 — inside the fixed 180-day window with margin.

---

## 4. Create the mutual

### 4.1 Freeze the cover terms and hash them

`--policy-hash` is the sha256 of the cover-terms document — the reference jurors adjudicate against (EVENT-MUTUAL §6, §9). Freeze the exact bytes first, then:

```bash
sha256sum "meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md"
# → first 64 hex chars are --policy-hash ({{POLICY_HASH}})
```

Publish those exact bytes at the URL members/jurors are pointed at. Changing the doc after init changes nothing on-chain — the hash is immutable — so a post-init edit means a new mutual, not an edit.

### 4.2 Dry-run (offline — initialize is pure PDA math)

```bash
riprap hanse:initialize \
  --seed {{SEED}} \
  --deposit-mint {{USDC_MINT}} --fee-mint {{USDC_MINT}} \
  --tier 10000000:1000000000 --tier 20000000:2000000000 --tier 40000000:4000000000 \
  --policy-hash {{POLICY_HASH}} \
  --deposits-close-at 1794729600 \
  --claims-close-at 1796148000 \
  --min-stake 10000000 --alpha-bps 1000 \
  --review-window 172800 --commit-window 43200 --reveal-window 43200 \
  --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 5000000 \
  --reveal-threshold-bps 6666 --max-draw-attempts 3 \
  --evidence-operator {{EVIDENCE_OPERATOR_PUBKEY}} \
  --dry-run
```

Inspect the printed accounts: the instruction must carry `hanse`, `pool`, and `accord` program ids matching §1.1.

### 4.3 Send

Same command without `--dry-run`, operator wallet loaded. This one transaction creates: the Mutual PDA `[mutual, seed]`, its pool (rights 1:1 under the `mutual_auth` PDA, ownership disabled), the stake-gated Subaccord (authority = the Mutual PDA), and the fee-float ATA. **Record the printed addresses** — every later command takes `--mutual`.

### 4.4 Verify

```bash
riprap hanse:show --mutual {{MUTUAL}}
```

Expect: `phase: Active`, both deadlines matching §3, `claims: 0 filed / 0 resolved`, `ratio_1e9: 0` (unset), treasury `0`.

---

## 5. Seed the juror pool

Riprap has no juror commands by design — staking **is** the availability decision; members stake into the Subaccord directly via the Accord (EVENT-MUTUAL §2.8, `programs/accord` tooling in the sibling checkout). Before the event:

- Each juror stakes ≥ `min_stake` = 10 USDC (§12).
- Convention: default juror stake = their tier contribution — the honest draw-weight base that scales ≈ 1:1 with the treasury (`specs/MAJORITY-EXPLOIT.md` §6 defense).
- Unstaking is blocked only while seated on a draw.

Do this on devnet with enough jurors to survive `--max-draw-attempts` 3 redraws; a dispute that cannot seat a panel fails after the redraw cap.

---

## 6. Members join

Open registration. Per member, from the member's own wallet:

```bash
riprap hanse:join --mutual {{MUTUAL}} --tier basic      # $10 / $1,000
riprap hanse:join --mutual {{MUTUAL}} --tier standard   # $20 / $2,000
riprap hanse:join --mutual {{MUTUAL}} --tier premium    # $40 / $4,000
```

- Deadline: `join` reverts after `--deposits-close-at` (2026-11-15 08:00 UTC) — joining after the event opens is structurally impossible (§2.7).
- Sponsored: `--sponsor /path/sponsor.json` — sponsor pays the contribution and receives the residual (frozen at join, immutable); payouts stay the member's.
- One tier per member per mutual; no stacking.
- Check a position: `riprap hanse:member --mutual {{MUTUAL}} [--member ATok…]`.

Target < 3,000 members (legal posture, unenforced — §12).

---

## 7. Incident → claim → adjudication

### 7.1 File (member's wallet)

```bash
riprap hanse:file-claim --mutual {{MUTUAL}} --amount {{REQUESTED_RAW}} --evidence {{EVIDENCE_MANIFEST_SHA256}}
```

- The requested amount is clamped on-chain to the member's tier max (§2.3); `--amount 2000000000` for a Standard max request.
- Filing fee = `min_jury_size × fee_per_juror` = **15 USDC**, auto-derived from the live subaccord and printed before send; it leaves the member's USDC ATA. Denied ⇒ fee stays with the jurors (anti-spam); approved ⇒ refunded inside the payout (§2.6).
- `--evidence` is the sha256 of the evidence manifest (PII stays off-chain, juror-only via the evidence operator — §9). This command needs RPC even for `--dry-run`.
- One Pending claim per member; the CLI prints the new Claim + Dispute addresses.

### 7.2 Settle each ruling (permissionless — any wallet can crank)

When the accord Dispute reaches Final/Failed:

```bash
riprap hanse:claim --mutual {{MUTUAL}} --claim {{CLAIM}}          # inspect status first
riprap hanse:settle-claim --claim {{CLAIM}}
```

Approve → obligations grow by the claim amount and the fee becomes refundable; Deny → closed, fee kept; Failed → accord's filer-fee refund is forwarded to the claimant. Appeals run on the accord side (permissionless, ladder 3 → 7 → 15); `settle-claim` simply waits for the final state.

---

## 8. Settlement

After **both**: `now ≥ 2026-12-01 18:00 UTC` and `claims filed == claims resolved`:

```bash
riprap hanse:settle-pool --mutual {{MUTUAL}}
```

Freezes `ratio_1e9 = min(1e9, treasury × 1e9 / (obligations + fee_refunds))` and sets `pull_close_at = now + 180d`. Sanity-check expectations offline first (§8 math, no RPC):

```bash
riprap hanse:quote --claim-amount 2000000000 --fee-paid 15000000 \
  --treasury {{TREASURY_RAW}} --obligations {{OBLIGATIONS_RAW}} --fee-refunds {{FEE_REFUNDS_RAW}} \
  --contribution 20000000
```

Then confirm on-chain: `riprap hanse:show --mutual {{MUTUAL}}` → `phase: Settled` + the frozen ratio.

---

## 9. Payouts (claimant + admin co-sign)

`hanse:claim-payout` is the one two-signer command: the claimant signs the pull, the mutual authority co-signs the Breakpoint pass gate (validated off-chain; §2.10/§12). Run with the claimant's wallet loaded and the admin key supplied:

```bash
riprap hanse:claim-payout --claim {{CLAIM}} --co-signer /path/to/operator.json
```

- Pays `floor(claim_amount × ratio) + floor(fee_paid × ratio)` into the claimant's USDC ATA and burns the matching rights stake — atomic, idempotent, repeatable until `pull_close_at`.
- Both keypair files must be readable by the process (claimant's machine with the admin key mounted, or the operator runs it with the claimant key). Omitting `--co-signer` defaults to self-signing — self-demo only, never production.
- Unpulled approved amounts revert to the residual after the window closes.

---

## 10. Dissolution + residual

After `pull_close_at` (settle-relative; ≈ 2027-06-14 for a Dec 16 settlement):

```bash
riprap hanse:dissolve --mutual {{MUTUAL}}     # permissionless; liquidates the pool, phase → Dissolved
```

Then every member (or their sponsor — the residual belongs to the sponsor when sponsored) pulls their share directly from the pool, once each:

```bash
riprap pool:crank --pool {{POOL}} --owner {{MEMBER_WALLET}}
```

Pays `floor(total_amount × liquidation_balance / pool.total_amount)` to the member's ATA — paid claimants were removed from the denominator by the burn (§2.5). Payouts already pulled are unaffected. After the last crank the mutual is empty and permanently dissolved: no funds remain, no third exit door exists.

---

## 11. Operator levers during the event

- **Subaccord params** (admin only; arms a 48h on-chain timelock — propose early):
  `riprap hanse:set-subaccord-param --mutual {{MUTUAL}} --payload MinStake:20000000 [--nonce N]`
  Exposable: `MinStake`, `FeePerJuror`, `AlphaBps`, `ReviewWindow`, `CommitWindow`, `RevealWindow`, `AppealWindow`. The printed `executeAfterSlot` tells you when the accord-side `lifecycle:execute-update` can land it.
- **Monitoring**: `hanse:show` (phase, ratio, obligations, counters, deadlines, live treasury), `hanse:member`, `hanse:claim`, `pool:show`, `pool:depositor`.
- **Nothing else is admin-gated** — money and lifecycle paths are permissionless by design. The authority's only powers are the payout pass-gate co-sign and subaccord param proposals.

---

## 12. Go/no-go checklist

- [ ] Programs `pool`/`hanse`/`accord` live on target cluster, ids = §1.1 table
- [ ] `config:show` clean; operator = dedicated ops keypair; SOL for rent on all wallets
- [ ] USDC mint chosen (mainnet `EPjF…TDt1v` / devnet 6-dec test mint)
- [ ] Cover terms frozen; `{{POLICY_HASH}}` = sha256 of the published bytes
- [ ] `hanse:initialize --dry-run` inspected → send → addresses recorded
- [ ] `hanse:show` matches §3 (deadlines, 3 tiers via `hanse:member`)
- [ ] Jurors staked (≥ 10 USDC each, convention = tier contribution)
- [ ] Members joined before 2026-11-15 08:00 UTC
- [ ] Claims filed/settled; `settle-pool` after 2026-12-01 18:00 UTC + zero pending
- [ ] Payouts co-signed and pulled before pull_close_at
- [ ] `dissolve` + per-member `pool:crank`; treasury ends at zero
