/**
 * `riprap hanse:show` — read-only mutual dump: phase, frozen settlement
 * ratio, obligations + fee refunds, claim counters, the three lifecycle
 * timestamps, pool + subaccord links, and the live treasury balance
 * (pool:show pattern).
 */
import { Flags } from "@oclif/core";
import { fetchMutual, type Mutual } from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import type { Address, Commitment, Rpc, SolanaRpcApi } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt, isoFromUnixSeconds } from "../../lib/format";

export interface MutualView {
  mutual: Mutual;
  pool: Address;
  subaccord: Address;
  treasury: Address;
  treasuryBalance: bigint;
}

export async function buildMutualView(
  rpc: Rpc<SolanaRpcApi>,
  mutualAddress: Address,
  commitment: Commitment,
): Promise<MutualView> {
  const { data: mutual } = await fetchMutual(rpc, mutualAddress);
  const treasury = await findAssociatedTokenAddress(mutual.depositMint, mutual.pool);
  const { value } = await rpc.getTokenAccountBalance(treasury, { commitment }).send();
  return {
    mutual,
    pool: mutual.pool,
    subaccord: mutual.subaccord,
    treasury,
    treasuryBalance: BigInt(value.amount),
  };
}

export default class HanseShow extends ChainCommand {
  static summary = "Mutual account dump + frozen ratio + live treasury balance";

  static description =
    "Reads the mutual account: lifecycle phase, the settlement ratio frozen " +
    "by settle-pool (1_000_000_000 = full pay), obligations + fee refunds, " +
    "claims filed/resolved, the deposits/claims/pull deadlines, the pool + " +
    "subaccord links, and the live treasury balance.";

  static examples = ["<%= config.bin %> hanse:show --mutual 9xQe…"];

  static flags = {
    ...chainFlags,
    mutual: Flags.string({ description: "Mutual account address", required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseShow);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const view = await buildMutualView(
      ctx.rpc as Rpc<SolanaRpcApi>,
      flags.mutual as Address,
      ctx.commitment,
    );

    const m = view.mutual;
    this.emitRead(
      { ...m, treasury: view.treasury, treasuryBalance: view.treasuryBalance },
      {
        primary: flags.mutual,
        human: [
          `phase       : ${m.phase === 0 ? "Active" : m.phase === 1 ? "Settled" : "Dissolved"}`,
          `pool        : ${view.pool}`,
          `subaccord   : ${view.subaccord}`,
          `deposits    : ${m.depositMint === m.feeMint ? m.depositMint : `${m.depositMint} (fee ${m.feeMint})`}`,
          `ratio_1e9   : ${groupBigInt(m.ratio1e9)} / 1_000_000_000`,
          `obligations : ${groupBigInt(m.obligations)}  fee refunds: ${groupBigInt(m.feeRefunds)}`,
          `claims      : ${m.claimsFiled} filed / ${m.claimsResolved} resolved`,
          `deposits end ${isoFromUnixSeconds(m.depositsCloseAt)} · claims end ${isoFromUnixSeconds(m.claimsCloseAt)}`,
          `pull closes : ${isoFromUnixSeconds(m.pullCloseAt) ?? "— (not settled)"}`,
          `treasury    : ${view.treasury} — ${groupBigInt(view.treasuryBalance)}`,
        ],
      },
    );
  }
}
