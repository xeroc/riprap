/**
 * `riprap hanse:show` — read-only mutual dump: every decoded field of the
 * account — authority, pool + subaccord links, the SAS juror circle, mints,
 * policy hash, the three tiers, windows + pull window, seed, phase,
 * settlement economics, claim counters, nonce, bump, reserved padding —
 * plus the derived treasury ATA and its live balance (pool:show pattern).
 */
import { Flags } from "@oclif/core";
import { fetchMutual, type Mutual, Phase } from "@riprap/hanse";
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

/** Human dump of a MutualView — every account field, in account-layout order. */
export function renderMutualLines(view: MutualView): string[] {
  const m = view.mutual;
  return [
    `discriminator: ${Buffer.from(m.discriminator).toString("hex")}`,
    `authority    : ${m.authority}`,
    `pool         : ${view.pool}`,
    `subaccord    : ${view.subaccord}`,
    `juror cred   : ${m.jurorCredential}`,
    `juror schema : ${m.jurorSchema}`,
    `mints        : deposit ${m.depositMint}${m.feeMint === m.depositMint ? " (fees too)" : ` · fee ${m.feeMint}`}`,
    `policy hash  : ${Buffer.from(m.policyHash).toString("hex")}`,
    `tiers        : ${m.tiers.map((t) => `${groupBigInt(t.contribution)} → ${groupBigInt(t.maxPayout)}`).join(" · ")}`,
    `deposits end : ${isoFromUnixSeconds(m.depositsCloseAt)} · claims end ${isoFromUnixSeconds(m.claimsCloseAt)}`,
    `pull window  : ${groupBigInt(m.pullWindow)} s · pull closes ${m.pullCloseAt === 0n ? "— (not settled)" : isoFromUnixSeconds(m.pullCloseAt)}`,
    `phase        : ${Phase[m.phase]}`,
    `seed         : ${m.seed}`,
    `ratio_1e9    : ${groupBigInt(m.ratio1e9)} / 1_000_000_000`,
    `obligations  : ${groupBigInt(m.obligations)} · fee refunds ${groupBigInt(m.feeRefunds)}`,
    `claims       : ${m.claimsFiled} filed / ${m.claimsResolved} resolved · claim nonce ${m.claimNonce}`,
    `bump         : ${m.bump}`,
    `padding      : ${m.padding.length} reserved bytes${m.padding.every((b) => b !== 0) ? " — NON-ZERO" : ""}`,
    `treasury     : ${view.treasury} — ${groupBigInt(view.treasuryBalance)}`,
  ];
}

export default class HanseShow extends ChainCommand {
  static summary = "Mutual account dump + frozen ratio + live treasury balance";

  static description =
    "Reads the mutual account and prints every decoded field: authority, " +
    "pool + subaccord links, the SAS juror credential/schema, mints, policy " +
    "hash, the three tiers, the deposits/claims windows + fixed pull " +
    "window, seed, phase, the settlement ratio frozen by settle-pool " +
    "(1_000_000_000 = full pay), obligations + fee refunds, claim " +
    "counters + nonce, bump, reserved padding — plus the derived treasury " +
    "ATA and its live balance.";

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
        human: renderMutualLines(view),
      },
    );
  }
}
