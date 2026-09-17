/**
 * `riprap pool:crank` — permissionless liquidation crank: pays one
 * depositor its money-weighted share of the frozen treasury base, exactly
 * once. The cranker pays transaction fees and receives nothing. The payee
 * is the position's residual owner: the depositor's owner, or the sponsor
 * recorded as residual beneficiary at first deposit — exactly one canonical
 * ATA passes the on-chain check.
 */
import { Flags } from "@oclif/core";
import {
  fetchMaybeDepositorByOwner,
  findAssociatedTokenAddress,
  getCrankInstructionAsync,
} from "@riprap/pool";
import type { Address, Rpc, SolanaRpcApi } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { resolvePoolMint } from "../../lib/pool-resolve";

/** Pubkey::default() on-chain — an unset residual beneficiary. */
const NO_BENEFICIARY = "11111111111111111111111111111111" as Address;

export default class PoolCrank extends ChainCommand {
  static summary = "Pay one depositor its money-weighted share (permissionless)";

  static description =
    "Pays --owner's floored money-weighted share (depositor total × frozen " +
    "liquidation balance ÷ pool total) into the residual payee's canonical " +
    "ATA — the owner's, or the sponsor's when the position was funded by one " +
    "(the beneficiary recorded at first deposit) — then marks the position " +
    "settled. Anyone can crank; the cranker only pays fees. Requires the " +
    "pool to be liquidated.";

  static examples = ["<%= config.bin %> pool:crank --pool 9xQe… --owner 9xQe…"];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    owner: Flags.string({
      description: "Owner of the depositor position to pay",
      required: true,
    }),
    mint: Flags.string({
      description: "Pool mint override — skips the pool-account fetch (offline --dry-run)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolCrank);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const pool = flags.pool as Address;
    const owner = flags.owner as Address;
    const mint = await resolvePoolMint(ctx.rpc, pool, flags.mint);
    const treasury = await findAssociatedTokenAddress(mint, pool);

    // Residual payee: the recorded beneficiary when the position was
    // sponsor-funded, else the owner. Tolerates an offline --dry-run (no
    // validator): falls back to the owner's ATA.
    let payee = owner;
    try {
      const maybe = await fetchMaybeDepositorByOwner(ctx.rpc as Rpc<SolanaRpcApi>, {
        pool,
        owner,
      });
      if (maybe.exists && maybe.data.residualBeneficiary !== NO_BENEFICIARY) {
        payee = maybe.data.residualBeneficiary;
      }
    } catch {
      // offline --dry-run without a position to read — owner's ATA is right.
    }
    const destination = await findAssociatedTokenAddress(mint, payee);

    const instruction = await getCrankInstructionAsync({
      pool,
      cranker: ctx.signer,
      owner,
      destination,
      treasury,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool, owner, payee });
  }
}
