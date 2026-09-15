/**
 * `riprap hanse:quote` — PURE, offline: what claim-payout would pay at the
 * settlement ratio implied by the given treasury and obligations. The
 * accord `accumulator:*` pattern — no wallet, no rpc, exact integer math
 * (EVENT-MUTUAL §8 is the worked example; base units, two-stage flooring).
 */
import { Flags } from "@oclif/core";

import { BaseCommand, riprapBaseFlags } from "../../lib/base-command";
import { groupBigInt } from "../../lib/format";
import { quotePayout, settlementRatio } from "../../lib/hanse-quote";
import { toBigInt } from "../../lib/pool-args";

export default class HanseQuote extends BaseCommand {
  static summary = "Pure payout quote at the settlement ratio (offline, §8 math)";

  static description =
    "Computes what hanse:claim-payout would pay, offline: ratio_1e9 = " +
    "min(1e9, treasury ÷ (obligations + fee_refunds)), then payout = " +
    "floor(claim_amount × ratio) + floor(fee_paid × ratio) — each term " +
    "floored, exactly like the on-chain u128 math. The optional " +
    "--contribution resolves the saturating rights-stake burn " +
    "min(payout, contribution). Worked example (EVENT-MUTUAL §8): " +
    "treasury 20_000_000_000, 15 claims of 2_000_000_000 + fees 15_000_000 " +
    "→ ratio 661_703_887, payout 1_333_333_332 ($1,323.41 + $9.93).";

  static examples = [
    "<%= config.bin %> hanse:quote --claim-amount 2000000000 --fee-paid 15000000 --treasury 20000000000 --obligations 30000000000 --fee-refunds 225000000 --contribution 20000000",
  ];

  static flags = {
    ...riprapBaseFlags,
    "claim-amount": Flags.string({
      description: "Approved claim amount (raw units)",
      required: true,
    }),
    "fee-paid": Flags.string({ description: "Filing fee paid (raw units)", required: true }),
    treasury: Flags.string({
      description: "Treasury balance at settlement (raw units)",
      required: true,
    }),
    obligations: Flags.string({
      description: "Σ approved claim amounts (raw units)",
      required: true,
    }),
    "fee-refunds": Flags.string({ description: "Σ approved fees (raw units)", required: true }),
    contribution: Flags.string({
      description: "Member contribution — resolves the saturating burn min(payout, contribution)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseQuote);
    this.applyOutput(flags);

    const treasury = toBigInt("treasury", flags.treasury, 64);
    const obligations = toBigInt("obligations", flags.obligations, 64);
    const feeRefunds = toBigInt("fee-refunds", flags["fee-refunds"], 64);
    const quote = quotePayout({
      claimAmount: toBigInt("claim-amount", flags["claim-amount"], 64),
      feePaid: toBigInt("fee-paid", flags["fee-paid"], 64),
      ratio1e9: settlementRatio(treasury, obligations, feeRefunds),
      contribution:
        flags.contribution === undefined
          ? undefined
          : toBigInt("contribution", flags.contribution, 64),
    });

    this.emitRead(
      { ...quote },
      {
        human: [
          `ratio_1e9 : ${groupBigInt(quote.ratio1e9)} / 1_000_000_000`,
          `claim part: ${groupBigInt(quote.claimPart)}`,
          `fee refund: ${groupBigInt(quote.feePart)}`,
          `payout    : ${groupBigInt(quote.payout)}`,
          `burn      : ${quote.burn === undefined ? "— (no --contribution)" : groupBigInt(quote.burn)}`,
        ],
      },
    );
  }
}
