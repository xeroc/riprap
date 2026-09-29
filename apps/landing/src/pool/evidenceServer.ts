// evidenceServer — the Accord evidence daemon's base URL, per cluster
// (directive 2026-09-29): devnet → api.devnet.useaccord.xyz, mainnet →
// api.useaccord.xyz, localnet shares the devnet host (the same pilot daemon
// serves both) unless pinned. One URL per cluster, overridable per cluster —
// the daemon host is deployment config, never chain data; the evidence
// OPERATOR pubkey, by contrast, is always the on-chain subaccord read
// (sub.evidence_operator → program-metadata PDA) and is never hardcoded here.
import { useCluster } from "@solana/connector";

/** The three daemon hosts, one per selectable cluster. */
export interface EvidenceDaemonUrls {
  devnet: string;
  mainnet: string;
  localnet: string;
}

/** Env shape the resolver reads — `import.meta.env` in the app, a plain
 * record in tests (the functions stay env-free and node-test-clean). */
export type EvidenceDaemonEnv = Record<string, string | undefined>;

/** Resolve the per-cluster daemon URLs from env, defaults baked in:
 * devnet host for devnet, mainnet host for mainnet, and localnet sharing
 * the RESOLVED devnet value unless VITE_EVIDENCE_DAEMON_URL_LOCALNET pins
 * its own (so a devnet override redirects localnet too, per spec). */
export function evidenceDaemonUrlsFromEnv(env: EvidenceDaemonEnv): EvidenceDaemonUrls {
  const devnet = env.VITE_EVIDENCE_DAEMON_URL_DEVNET ?? "https://api.devnet.useaccord.xyz";
  return {
    devnet,
    mainnet: env.VITE_EVIDENCE_DAEMON_URL_MAINNET ?? "https://api.useaccord.xyz",
    localnet: env.VITE_EVIDENCE_DAEMON_URL_LOCALNET ?? devnet,
  };
}

/** The daemon URL for an active cluster id (`solana:mainnet` / `solana:localnet`
 * / default → devnet). No cluster yet (boot frame) and unknown ids fall to
 * devnet — the pilot's home network. */
export function evidenceDaemonUrlForCluster(
  clusterId: string | null | undefined,
  urls: EvidenceDaemonUrls,
): string {
  if (clusterId === "solana:mainnet" || clusterId === "solana:mainnet-beta") return urls.mainnet;
  if (clusterId === "solana:localnet") return urls.localnet;
  return urls.devnet;
}

/** The active cluster's daemon URL — the one consumers import. Lives on the
 * router-level ConnectorProvider (ADR-0007). */
export function useEvidenceDaemonUrl(): string {
  const { cluster } = useCluster();
  return evidenceDaemonUrlForCluster(
    cluster?.id,
    evidenceDaemonUrlsFromEnv(import.meta.env as unknown as EvidenceDaemonEnv),
  );
}
