/**
 * `riprap config:show` — print the resolved CLI environment + payer balance.
 * Validates the chain context (rpc, keypair, program ids) end-to-end; the
 * natural "does my config work?" smoke command.
 */
import { POOL_PROGRAM_ADDRESS } from "@riprap/pool";

import { ChainCommand } from "../../lib/base-command";
import { groupBigInt, truncateAddress } from "../../lib/format";
import { resolveKeypairPath } from "../../lib/wallet";

export default class ConfigShow extends ChainCommand {
  static summary = "Print resolved rpc, keypair, program ids, and payer SOL balance";

  static description =
    "Resolves the active configuration from flags + env ($RIPRAP_RPC_URL, " +
    "$RIPRAP_KEYPAIR_PATH / $ANCHOR_WALLET) and queries the payer's SOL balance. " +
    "Use this to confirm the CLI can reach the validator and load the wallet.";

  static examples = ["<%= config.bin %> config:show"];

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigShow);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const { value: lamports } = await ctx.rpc
      .getBalance(ctx.signer.address, { commitment: ctx.commitment })
      .send();

    const walletPath = resolveKeypairPath(flags.keypair);
    const data = {
      rpc: flags.rpc,
      ws: ctx.ws,
      walletPath,
      authority: ctx.signer.address,
      poolProgramId: POOL_PROGRAM_ADDRESS,
      hanseProgramId: null, // @riprap/hanse not in this workspace yet; joins via its bean
      commitment: ctx.commitment,
      balanceLamports: lamports,
      balanceSol: Number(lamports) / 1e9,
    };

    this.emitRead(data, {
      primary: ctx.signer.address,
      human: [
        `rpc        : ${flags.rpc}`,
        `ws         : ${ctx.ws}`,
        `keypair    : ${walletPath}`,
        `authority  : ${truncateAddress(ctx.signer.address)}`,
        `pool       : ${truncateAddress(POOL_PROGRAM_ADDRESS)}`,
        `hanse      : not installed (@riprap/hanse absent from this build)`,
        `commitment : ${ctx.commitment}`,
        `balance    : ${groupBigInt(lamports)} lamports (◎ ${data.balanceSol})`,
      ],
    });
  }
}
