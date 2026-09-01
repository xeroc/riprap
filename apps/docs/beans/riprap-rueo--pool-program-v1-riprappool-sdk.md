---
# riprap-rueo
title: Pool program v1 + @riprap/pool SDK
status: completed
type: milestone
priority: high
created_at: 2026-09-01T05:12:50Z
updated_at: 2026-09-01T07:25:04Z
---

Anchor program 'pool' (generic three-track mutual-pool primitive) + Codama TS SDK packages/pool @riprap/pool. Localnet/LiteSVM only. Full HANDOFF below.

## HANDOFF

### 1. Happy Path
1. init(mint, seed, rates x3, authorities x3) creates Pool PDA + treasury ATA (pool-owned, NO swig per ADR-0001)
2. deposit(track, amount) x N members — SPL transfer depositor ATA -> treasury, stakes minted at track rate
3. spend(amount, destination) — rights_authority signed push transfer (adjudication door)
4. liquidate() — ownership_authority signed, Open -> Liquidated
5. crank(depositor) permissionless x N — pays floor(balance x user_total / pool_total), marks Settled

### 2. Data Contract
- Program: programs/pool, crate 'pool', Anchor 1.0.2, Agave 3.x localnet, declare_id from target/deploy/pool-keypair.json
- Ixs: init, deposit(track enum Ownership/Rights/Yield, amount u64), spend(amount, destination), liquidate(), crank(depositor), update_authority(track, new)
- Seeds: Pool = ['pool', seed u64]; Depositor = ['depositor', pool, owner]
- Pool state: mint, state Open|Liquidated, ownership_rate/rights_rate/yield_rate u64 (0 = closed), authorities x3 Pubkey, total_amount u128
- Depositor state: owner, total_amount u64, ownership/rights/yield stake u128, settled bool
- SDK: packages/pool 'riprap' name @riprap/pool, codama.json -> ../../target/idl/pool.json, @solana/kit ^7, generated/ committed

### 3. Edge Cases & Constraints
- NO swig in v1 (ADR-0001). Treasury = pool PDA ATA. Do not add swig CPI.
- Rate 0 = track CLOSED (deposit reverts). Never 'donation' semantics.
- Liquidation is MONEY-weighted (total deposits), never stake-weighted — rates must not distort refunds (CONTEXT.md: Money-weighted share).
- Two doors only: spend (rights authority) and crank (post-liquidation). No third exit.
- Tier prices NEVER here (10/20/40 = mutual layer). No hardcoded mints. Components render props; unknown = {{PARAM}}.
- Checked math everywhere; u128 for share computation; overflow-checks = true in release profile.
- crank idempotence: settled depositor reverts. deposit/spend revert when not Open.

### 4. Business Logic (pseudo-code)
deposit: require Open; rate = track rate; require rate > 0; stake = amount*rate (checked); transfer user ATA->treasury; depositor.total += amount; depositor.stake[track] += stake; pool.total += amount.
spend: require rights_authority.is_signer && Open; transfer treasury->destination amount (checked).
liquidate: require ownership_authority.is_signer && Open; state = Liquidated.
crank: require Liquidated && !settled; bal = treasury.amount; pay = bal * depositor.total / pool.total (u128 floor); transfer treasury->depositor ATA; settled = true.
update_authority: current track authority signs; swap pubkey.

### 5. Definition of Done
- [ ] cargo test green: inline unit + LiteSVM full lifecycle incl. revert cases
- [ ] anchor build -> target/idl/pool.json; codama codegen committed; vitest helpers green
- [ ] pnpm verify green repo-wide; AGENTS.md gate updated to include anchor build + cargo test
- [ ] Events emitted on every instruction (Deposit, Spent, Liquidated, CrankPaid, AuthorityUpdated)

### 6. Test Matrix
- Given Open pool rights_rate=1, When deposit 20 USDC, Then depositor.total=20e6, rights_stake=20e6, treasury +20e6
- Given rights_rate=0, When deposit(Rights), Then revert TrackClosed
- Given Liquidated, When deposit|spend, Then revert
- Given non-authority, When spend|liquidate|update_authority, Then revert
- Given deposits 10/20/40 + spend 2000, When crank all, Then payouts = floor(share x remaining), sum <= balance, double-crank reverts
- Given authorities, When update_authority(rights, K2), Then K2 can spend and K1 cannot

### 7. Open Questions
- Swig re-introduction when mutual program lands (see ADR-0001 migration path)
- Depositor account close / rent reclaim skipped in v1
- Devnet/mainnet deploy deferred (localnet only)
