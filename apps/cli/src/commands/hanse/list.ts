/**
 * `riprap hanse:list` — every mutual on the hanse program, via the SDK's
 * getProgramAccounts scan (server-side discriminator filter — the cranker's
 * discovery path, surfaced for operators). One line per mutual; `--json`
 * emits the decoded accounts.
 */
import { fetchAllMutuals } from "@riprap/hanse";
import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { isoFromUnixSeconds } from "../../lib/format";

export default class HanseList extends ChainCommand {
  static summary = "List every mutual on the hanse program (getProgramAccounts scan)";

  static description =
    "Scans the hanse program for Mutual accounts — the same discriminator-" +
    "filtered getProgramAccounts scan the cranker uses for discovery — and " +
    "prints one line per mutual: address, lifecycle phase, seed, claim " +
    "counters, and the deposits/claims windows.";

  static examples = ["<%= config.bin %> hanse:list"];

  static flags = { ...chainFlags };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseList);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const scanned = await fetchAllMutuals(ctx.rpc as Rpc<SolanaRpcApi>);

    const rows = scanned.map(({ address, data: m }) => ({
      address,
      seed: m.seed,
      phase: m.phase === 0 ? "Active" : m.phase === 1 ? "Settled" : "Dissolved",
      claims: `${m.claimsResolved}/${m.claimsFiled} resolved`,
      depositsCloseAt: m.depositsCloseAt,
      claimsCloseAt: m.claimsCloseAt,
      pool: m.pool,
      subaccord: m.subaccord,
    }));

    this.emitRead(rows, {
      primary: rows.map((r) => r.address).join("\n"),
      human: rows.map(
        (r) =>
          `${r.address}  ${r.phase.padEnd(9)} seed ${r.seed}  ${r.claims}  ` +
          `deposits end ${isoFromUnixSeconds(r.depositsCloseAt) ?? "—"} · claims end ${isoFromUnixSeconds(r.claimsCloseAt) ?? "—"}`,
      ),
    });
  }
}
