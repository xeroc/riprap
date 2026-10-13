// useEvidenceOperator — operator discovery per CLAIM-WIZARD §8: the
// subaccord's `evidence_operator` (decoded by the caller via @useaccord/sdk)
// points at the operator's program-metadata PDA (program
// ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S, non-canonical seeds
// [accord_program_id, operator_authority, "evidence-op\0\0\0\0\0"]), whose
// account data is JSON {name, url, encryption_key} — the documented
// curation-less fallback. Resolved once per session (infinite staleTime);
// the URL is health-checked against the daemon's /healthz. The resolution
// shape matches the future curation path — a pointer change, not code.

import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";

import type { ClusterRpc } from "../../shared/rpc";

// The parked metadata-PDA resolution (below, in resolveEvidenceOperator's
// TODO block) used to carry these: the program-metadata program
// (ProgM6JCCvbYkfKqJYHePx4xx7rh8Lyv7nk7S), the accord program
// (cordhVoshqRV6kzGBmM89A66wuusJGsDCvLMHPLyKed), the "evidence-op" seed
// zero-padded to 16 bytes, and the OperatorMetadata JSON body — restored
// with the block when on-chain operator details land.

export interface EvidenceOperator {
  name: string;
  url: string;
  /** The operator's encryption public key as stored — the target for
   * @useaccord/sdk/evidence claimantEncrypt (the publish step). */
  encryptionKey: string;
  /** /healthz answered — the wizard surfaces it; publish retries either way. */
  healthy: boolean;
}

export async function resolveEvidenceOperator(
  clusterRpc: ClusterRpc,
  operatorAuthority: Address,
): Promise<EvidenceOperator> {
  const isDevnet = clusterRpc.endpoint.includes("devnet");
  const url = `https://api${isDevnet ? ".devnet" : ""}.useaccord.xyz`;
  return {
    name: isDevnet ? "devnet" : "mainnet",
    url,
    encryptionKey: operatorAuthority,
    healthy: await pingOperator(url),
  };
  /* TODO: later, when we store the operator details on chain, we can use METADATA PROGRAM_METADATA
  const addressEncoder = getAddressEncoder();
  const [pda] = await getProgramDerivedAddress({
    programAddress: PROGRAM_METADATA_ADDRESS,
    seeds: [
      addressEncoder.encode(ACCORD_PROGRAM_ADDRESS),
      addressEncoder.encode(operatorAuthority),
      EVIDENCE_OP_SEED,
    ],
  });
  const account = await fetchEncodedAccount(clusterRpc.rpc, pda);
  if (!account.exists) {
    throw new Error(
      `no program-metadata account for operator ${shortenAddress(operatorAuthority)}`,
    );
  }
  // the encoded account carries its bytes — the body is UTF-8 JSON
  const parsed = JSON.parse(new TextDecoder().decode(account.data)) as Partial<OperatorMetadata>;
  if (typeof parsed.name !== "string" || typeof parsed.url !== "string") {
    throw new Error("operator metadata is not the expected JSON shape");
  }
  return {
    name: parsed.name,
    url: parsed.url,
    encryptionKey: typeof parsed.encryption_key === "string" ? parsed.encryption_key : "",
    healthy: await pingOperator(parsed.url),
  };
   */
}

/** GET {url}/healthz — 200 ⇒ healthy; anything else ⇒ not (no throw). */
export async function pingOperator(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/healthz`);
    return response.ok;
  } catch {
    return false;
  }
}

export type EvidenceOperatorQuery =
  | { state: "off" } // no RPC or no operator address yet
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; operator: EvidenceOperator };

export function useEvidenceOperator(
  clusterRpc: ClusterRpc | null,
  operatorAuthority: Address | null,
): EvidenceOperatorQuery {
  const query = useQuery({
    queryKey: ["evidence-operator", clusterRpc?.endpoint, operatorAuthority],
    queryFn: () => {
      console.log(".");
      if (!clusterRpc || operatorAuthority === null) {
        throw new Error("evidence-operator prerequisites disappeared mid-flight");
      }
      const x = resolveEvidenceOperator(clusterRpc, operatorAuthority);
      console.log(x);
      return x;
    },
    enabled: clusterRpc !== null && operatorAuthority !== null,
    staleTime: Infinity, // once per session (CLAIM-WIZARD §8)
    retry: 1,
  });

  if (!clusterRpc || operatorAuthority === null) return { state: "off" };
  if (query.isPending) return { state: "loading" };
  if (query.isError) return { state: "error" };
  return { state: "ready", operator: query.data };
}
