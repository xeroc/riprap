/**
 * `riprap hanse:initialize` — create a mutual: Mutual PDA, its pool (CPI),
 * its subaccord (CPI), and the fee float ATA. All inputs explicit; the
 * loaded wallet is the initializer = demo admin (§2.10). Rent (mutual +
 * pool + fee float — not the subaccord, whose creator seeds its PDA) is
 * paid by the on-chain rent_payer account; the CLI wires that to this
 * wallet, so by default the initializer sponsors their own rent.
 *
 * Pilot values (devnet/mainnet): EVENT-MUTUAL §12 — tiers 10/1000 · 20/2000
 * · 40/4000 (6-dec raw), jury 3 × 5 fee, windows 48h/12h/12h/48h.
 */
import { Flags } from "@oclif/core";
import {
  findFeeFloatPda,
  findMutualPda,
  findMutualSubaccordPda,
  findPoolPda,
  getInitializeMutualInstructionAsync,
  type SubaccordConfigArgs,
  type TierArgs,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import type { Address } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { hexToBytes32, parseTierSpec } from "../../lib/hanse-args";
import { toBigInt } from "../../lib/pool-args";

export default class HanseInitialize extends ChainCommand {
  static summary = "Create a mutual (mutual + pool + subaccord + fee float)";

  static description =
    "Initializes an event mutual: Mutual PDA [mutual, seed], its pool (same " +
    "seed — rights 1:1 under the mutual_auth PDA, ownership disabled under " +
    "mutual_own), its Accord subaccord (creator = this wallet, authority = " +
    "the mutual PDA, stake-only jurors), and the fee float ATA. Exactly " +
    "three --tier flags, in Basic/Standard/Premium order. The payout pull " +
    "window is fixed on-chain at 180 days — no flag. Pilot numbers: " +
    "EVENT-MUTUAL §12.";

  static examples = [
    "<%= config.bin %> hanse:initialize --seed 7 --deposit-mint EPjF… --fee-mint EPjF… --tier 10000000:1000000000 --tier 20000000:2000000000 --tier 40000000:4000000000 --policy-hash <hex64> --deposits-close-at 1763174400 --claims-close-at 1793469600 --min-stake 10000000 --alpha-bps 1000 --review-window 172800 --commit-window 43200 --reveal-window 43200 --appeal-window 172800 --max-appeals 2 --min-jury-size 3 --fee-per-juror 5000000 --reveal-threshold-bps 6666 --max-draw-attempts 3 --evidence-operator 9xQe…",
  ];

  static flags = {
    ...chainFlags,
    seed: Flags.string({ description: "Mutual (and pool) PDA seed (u64)", required: true }),
    tier: Flags.string({
      description:
        "Cover tier as contribution:max-payout (u64 raw units) — exactly 3, in Basic/Standard/Premium order",
      multiple: true,
      required: true,
    }),
    "policy-hash": Flags.string({
      description: "Cover-terms document hash (64 hex chars, §9)",
      required: true,
    }),
    "deposits-close-at": Flags.string({
      description: "Join deadline, unix seconds (§2.7)",
      required: true,
    }),
    "claims-close-at": Flags.string({
      description: "Filing deadline, unix seconds (§2.7)",
      required: true,
    }),
    "deposit-mint": Flags.string({
      description:
        "Contribution + payout mint (USDC for the pilot); must equal --fee-mint — the program rejects mixed mints (single-asset MVP)",
      required: true,
    }),
    "fee-mint": Flags.string({
      description:
        "Juror-fee mint; must equal --deposit-mint. Classic SPL Token only (no Token-2022)",
      required: true,
    }),
    // ── Subaccord economics (mirrors useaccord lifecycle:create-subaccord) ──
    "min-stake": Flags.string({ description: "Minimum juror stake (raw units)", required: true }),
    "alpha-bps": Flags.integer({ description: "Slash factor in bps (10% = 1000)", required: true }),
    "review-window": Flags.string({
      description: "Evidence review window, seconds",
      required: true,
    }),
    "commit-window": Flags.string({ description: "Commit window, seconds", required: true }),
    "reveal-window": Flags.string({ description: "Reveal window, seconds", required: true }),
    "appeal-window": Flags.string({
      description: "Post-round appeal window, seconds (≥ 3600)",
      required: true,
    }),
    "max-appeals": Flags.integer({
      description: "Max appeals (0..3); ladder (J+1)·2^n − 1 must fit 31",
      required: true,
    }),
    "min-jury-size": Flags.integer({
      description: "Round-1 juror panel size (odd; pilot 3)",
      required: true,
    }),
    "fee-per-juror": Flags.string({
      description: "Per-juror filing fee (raw units; filing fee = min_jury_size × this)",
      required: true,
    }),
    "reveal-threshold-bps": Flags.integer({
      description: "Reveal-quorum fraction in bps (2/3 = 6666)",
      required: true,
    }),
    "max-draw-attempts": Flags.integer({
      description: "Per-round redraw cap before the dispute fails (1..10)",
      required: true,
    }),
    "evidence-operator": Flags.string({
      description: "Encrypted-evidence operator key (§9; v1: the operator's key)",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseInitialize);
    this.applyOutput(flags);

    if (flags.tier.length !== 3) {
      throw new Error(
        `Expected exactly 3 --tier flags (Basic/Standard/Premium), got ${flags.tier.length}.`,
      );
    }
    const tiers: TierArgs[] = flags.tier.map(parseTierSpec);
    const policyHash = hexToBytes32("policy-hash", flags["policy-hash"]);
    const seed = toBigInt("seed", flags.seed, 64);

    const ctx = await this.loadChain(flags);
    const [mutual] = await findMutualPda({ seed });
    const [pool] = await findPoolPda({ seed });
    const treasury = await findAssociatedTokenAddress(flags["deposit-mint"] as Address, pool);
    const [subaccord] = await findMutualSubaccordPda({
      creator: ctx.signer.address,
      seed,
      policyHash,
    });
    const [feeFloat] = await findFeeFloatPda({
      mutual,
      feeMint: flags["fee-mint"] as Address,
    });

    const subaccordConfig: SubaccordConfigArgs = {
      feePerJuror: toBigInt("fee-per-juror", flags["fee-per-juror"], 64),
      minStake: toBigInt("min-stake", flags["min-stake"], 64),
      alphaBps: flags["alpha-bps"],
      reviewWindow: toBigInt("review-window", flags["review-window"], 64),
      commitWindow: toBigInt("commit-window", flags["commit-window"], 64),
      revealWindow: toBigInt("reveal-window", flags["reveal-window"], 64),
      appealWindow: toBigInt("appeal-window", flags["appeal-window"], 64),
      maxAppeals: flags["max-appeals"],
      minJurySize: flags["min-jury-size"],
      revealThresholdBps: flags["reveal-threshold-bps"],
      maxDrawAttempts: flags["max-draw-attempts"],
      evidenceOperator: flags["evidence-operator"] as Address,
    };

    const instruction = await getInitializeMutualInstructionAsync({
      authority: ctx.signer,
      rentPayer: ctx.signer,
      mutual,
      pool,
      treasury,
      subaccord,
      depositMint: flags["deposit-mint"] as Address,
      feeMint: flags["fee-mint"] as Address,
      feeFloat,
      seed,
      tiers,
      policyHash,
      depositsCloseAt: toBigInt("deposits-close-at", flags["deposits-close-at"], 64),
      claimsCloseAt: toBigInt("claims-close-at", flags["claims-close-at"], 64),
      subaccordArg: subaccordConfig,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { mutual, pool, subaccord, feeFloat });
  }
}
