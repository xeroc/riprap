/**
 * `riprap pool:deposit` — deposit the pool's token into one track. The
 * wallet IS the depositor (payer = depositor, single-signer model); rent
 * for the depositor PDA can be sponsored from a second keypair via
 * --rent-payer, and the MONEY itself from a third via --sponsor — a
 * sponsor's funds assign the liquidation residual to the sponsor
 * (immutable, first deposit only). Stake is minted at the track's rate,
 * frozen at deposit.
 */
import { Flags } from "@oclif/core";
import { getDepositInstructionAsync } from "@riprap/pool";
import type { Address } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { TRACK_OPTIONS, toBigInt, trackFromName } from "../../lib/pool-args";
import { resolvePoolMint } from "../../lib/pool-resolve";
import { findAssociatedTokenAddress } from "../../lib/token";
import { loadKeypair } from "../../lib/wallet";

export default class PoolDeposit extends ChainCommand {
  static summary = "Deposit into one track (wallet = depositor)";

  static description =
    "Transfers --amount of the pool's token into the treasury and mints " +
    "track stake at the pool's rate (frozen at deposit time). One depositor " +
    "position per pool per party. --rent-payer sponsors the depositor PDA " +
    "rent from a separate keypair; --sponsor <keypair> pays the amount " +
    "itself and takes the position's liquidation residual (set at first " +
    "deposit, immutable after — paying implies no claim rights).";

  static examples = [
    "<%= config.bin %> pool:deposit --pool 9xQe… --track rights --amount 1000",
    "<%= config.bin %> pool:deposit --pool 9xQe… --track rights --amount 40 --sponsor /path/sponsor.json",
  ];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    track: Flags.string({
      description: "Track to deposit into",
      options: [...TRACK_OPTIONS],
      required: true,
    }),
    amount: Flags.string({ description: "Amount to deposit (u64, raw units)", required: true }),
    mint: Flags.string({
      description: "Pool mint override — skips the pool-account fetch (offline --dry-run)",
    }),
    "rent-payer": Flags.string({
      description: "Path to a keypair sponsoring the depositor PDA rent (optional)",
    }),
    sponsor: Flags.string({
      description:
        "Path to the funds sponsor's keypair — pays the deposit and receives " +
        "the liquidation residual of this position (optional, immutable once set)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolDeposit);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const pool = flags.pool as Address;
    const amount = toBigInt("amount", flags.amount, 64);
    const track = trackFromName(flags.track);
    const rentPayer = flags["rent-payer"] ? await loadKeypair(flags["rent-payer"]) : ctx.signer;
    const sponsor = flags.sponsor ? await loadKeypair(flags.sponsor) : undefined;

    const mint = await resolvePoolMint(ctx.rpc, pool, flags.mint);
    // Deposit source: the sponsor's ATA when sponsoring, else the wallet's.
    const ownerAta = await findAssociatedTokenAddress(
      mint,
      sponsor ? sponsor.address : ctx.signer.address,
    );
    const treasury = await findAssociatedTokenAddress(mint, pool);

    const instruction = await getDepositInstructionAsync({
      pool,
      owner: ctx.signer,
      funder: sponsor,
      rentPayer,
      ownerAta,
      treasury,
      track,
      amount,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool, track: flags.track, amount });
  }
}
