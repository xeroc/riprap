// usePolicyDoc — the anchored cover terms, read from the Accord evidence
// daemon's public domain CAS (`GET /domains/{domain_ref}`, ADR-0027 / SPEC.md).
// The ref is derived client-side from the mutual (HANSE_DOMAIN_SPEC_UPLOAD §1)
// — sha256("hanse:subaccord" ‖ seed.le64 ‖ policy_hash) — so the bytes served
// are exactly the bytes the on-chain mutual pins. 404 is a STATE (not an
// error): "not published yet", with the upload path as the remedy. The states
// are exhaustive — no fallback text, ever (kit data law).

import type { Mutual } from "@riprap/hanse";
import { useQuery } from "@tanstack/react-query";

import { domainRefHex, toHex } from "./domainRef";

/**
 * Evidence-daemon base URL. Default is the production host; tests and local
 * dev point it at a local daemon via VITE_EVIDENCE_URL.
 */
export function evidenceBaseUrl(): string {
  const override = import.meta.env.VITE_EVIDENCE_URL as string | undefined;
  return override ?? "https://api.useaccord.xyz";
}

export type PolicyDocQuery =
  | { state: "idle" } // mutual not answered yet — nothing to derive from
  | { state: "loading" }
  | { state: "ready"; text: string; ref: string }
  | { state: "missing"; ref: string } // 404 — not uploaded yet
  | { state: "error"; retry: () => void };

export function usePolicyDoc(mutual: Mutual | null): PolicyDocQuery & { refetch: () => void } {
  const seed = mutual?.seed ?? null;
  const policyHashHex = mutual ? toHex(mutual.policyHash) : null;
  const base = evidenceBaseUrl();

  const query = useQuery({
    queryKey: ["policy-doc", base, seed === null ? null : seed.toString(), policyHashHex],
    queryFn: async () => {
      if (mutual === null) throw new Error("policy-doc prerequisites disappeared mid-flight");
      const ref = await domainRefHex(mutual.seed, mutual.policyHash);
      const response = await fetch(`${base}/domains/${ref}`);
      if (response.status === 404) return { status: "missing" as const, ref };
      if (!response.ok) throw new Error(`evidence server answered ${response.status}`);
      return { status: "found" as const, text: await response.text(), ref };
    },
    enabled: mutual !== null,
    retry: 1,
  });

  const baseState: PolicyDocQuery =
    mutual === null
      ? { state: "idle" }
      : query.isPending
        ? { state: "loading" }
        : query.isError
          ? { state: "error", retry: () => void query.refetch() }
          : query.data?.status === "found"
            ? { state: "ready", text: query.data.text, ref: query.data.ref }
            : { state: "missing", ref: query.data?.ref ?? "" };
  return { ...baseState, refetch: () => void query.refetch() };
}
