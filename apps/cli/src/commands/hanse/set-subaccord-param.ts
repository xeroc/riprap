/**
 * `riprap hanse:set-subaccord-param` — demo-admin lever: proposes one
 * subaccord parameter update through the mutual PDA (authority-gated,
 * arms accord's 48h timelock). Mirrors useaccord lifecycle:propose-update,
 * including the executeAfterSlot readback after send.
 */
import { Flags } from "@oclif/core";
import { fetchMutual, getSetSubaccordParamInstruction } from "@riprap/hanse";
import type { Address } from "@solana/kit";
import { fetchPendingUpdate, findPendingUpdatePda } from "@useaccord/sdk";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt } from "../../lib/format";
import { parseSubaccordParam } from "../../lib/hanse-args";
import { toBigInt } from "../../lib/pool-args";

export default class HanseSetSubaccordParam extends ChainCommand {
  static summary = "Propose a subaccord param update (admin; arms 48h timelock)";

  static description =
    "Authority-gated (the mutual's initializer) proposal to update one of " +
    "the seven exposed subaccord parameters: MinStake, FeePerJuror, " +
    "AlphaBps, ReviewWindow, CommitWindow, RevealWindow, AppealWindow. The " +
    "mutual PDA signs the accord proposal; the wallet pays the " +
    "PendingUpdate rent. Arms the 48h on-chain timelock — the exact " +
    "execute slot is read back and printed; execute it with " +
    "useaccord lifecycle:execute-update once elapsed.";

  static examples = [
    "<%= config.bin %> hanse:set-subaccord-param --mutual 9xQe… --payload MinStake:20000000",
    "<%= config.bin %> hanse:set-subaccord-param --mutual 9xQe… --nonce 1 --payload AlphaBps:1500",
  ];

  static flags = {
    ...chainFlags,
    mutual: Flags.string({ description: "Mutual account address", required: true }),
    payload: Flags.string({
      description:
        "Update payload as Kind:value — MinStake:2000, FeePerJuror:5000000, " +
        "AlphaBps:1500, ReviewWindow:86400, CommitWindow:43200, " +
        "RevealWindow:43200, AppealWindow:172800",
      required: true,
    }),
    nonce: Flags.string({
      description: "Update nonce (u64); increments per proposal. Default 0.",
      default: "0",
    }),
    subaccord: Flags.string({
      description: "Subaccord override — skips the mutual fetch (offline --dry-run)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseSetSubaccordParam);
    this.applyOutput(flags);

    const param = parseSubaccordParam(flags.payload);
    const nonce = toBigInt("nonce", flags.nonce, 64);
    const mutual = flags.mutual as Address;

    const ctx = await this.loadChain(flags);
    const subaccord = flags.subaccord
      ? (flags.subaccord as Address)
      : (await fetchMutual(ctx.rpc, mutual)).data.subaccord;
    const [pendingUpdate] = await findPendingUpdatePda({ subaccord, nonce });

    const instruction = getSetSubaccordParamInstruction({
      authority: ctx.signer,
      rentPayer: ctx.signer,
      mutual,
      subaccord,
      pendingUpdate,
      nonce,
      param,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);

    // Read the armed timelock back so the operator knows when to execute
    // (useaccord lifecycle:propose-update pattern).
    const pending = await fetchPendingUpdate(ctx.rpc, pendingUpdate);
    this.emitSend(signature, {
      mutual,
      subaccord,
      pendingUpdate,
      executeAfterSlot: groupBigInt(pending.data.executeAfterSlot),
    });
  }
}
