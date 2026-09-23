// Recovery.tsx — the #/app claim-detail recovery surface (CLAIM-WIZARD §7,
// copy doc § /app "Claim rows, evidence + recovery"): re-upload the kept
// manifest.yaml → verify sha256(manifest) == Dispute.evidence_hashes[0] (a
// pure chain read — the wrap is gone) → re-attach + re-hash the five
// documents → re-POST the manifest (201 no-op) and re-PUT each file
// (idempotent; 409 = wrong file, surfaced). No operator trust, no server
// state — the manifest is the recovery artifact.

import { Button, buttonVariants } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { fetchDispute, fetchSubaccordMaybe } from "@useaccord/sdk";
import { useState } from "react";
import type { ClusterRpc } from "../../shared/rpc";
import { intakeDocument, sha256Hex } from "./documents";
import { DOC_SLOTS } from "./draft";
import { operatorPubFromKey, postManifest, putDocument } from "./evidence";
import { recordDelivery } from "./evidenceRecord";
import { resolveEvidenceOperator } from "./useEvidenceOperator";

type RecoveryState =
  | { phase: "idle" } // waiting for the manifest upload
  | { phase: "verifying" }
  | { phase: "mismatch" } // the manifest is not this claim's
  | { phase: "verified"; manifest: Uint8Array } // re-attach the five
  | { phase: "delivering"; rows: Record<string, string>; conflict?: string }
  | { phase: "done" }
  | { phase: "error"; message: string };

export function Recovery({
  clusterRpc,
  mutual,
  subaccord,
  dispute,
  nonce,
}: {
  clusterRpc: ClusterRpc;
  mutual: Address;
  subaccord: Address;
  dispute: Address;
  nonce: bigint;
}) {
  const [state, setState] = useState<RecoveryState>({ phase: "idle" });
  const [files, setFiles] = useState(new Map<string, Uint8Array>());

  /** Step 1 — the manifest gates everything: sha256 must equal the chain slot. */
  const onManifest = async (file: File) => {
    setState({ phase: "verifying" });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hash = await sha256Hex(bytes);
    const onChain = await fetchDispute(clusterRpc.rpc, dispute);
    const slot = onChain.data.evidenceHashes[0];
    const slotHex = slot === undefined ? "" : toHex(new Uint8Array(slot));
    if (hash !== slotHex) {
      setState({ phase: "mismatch" });
      return;
    }
    setState({ phase: "verified", manifest: bytes });
  };

  /** Step 2 — re-attach + re-deliver: POST (no-op) then per-file PUTs. */
  const redeliver = async () => {
    if (state.phase !== "verified") return;
    setState({ phase: "delivering", rows: {} });
    try {
      const sub = await fetchSubaccordMaybe(clusterRpc.rpc, subaccord);
      if (!sub.exists) throw new Error("subaccord unreadable");
      const operator = await resolveEvidenceOperator(clusterRpc, sub.data.evidenceOperator);
      const operatorPub = operatorPubFromKey(operator.encryptionKey);
      const endpoint = operator.url;

      const posted = await postManifest({
        endpoint,
        subaccord,
        dispute,
        manifest: state.manifest,
        operatorPub,
      });
      if (posted === "conflict") {
        setState((current) =>
          current.phase === "delivering" ? { ...current, conflict: "manifest.yaml" } : current,
        );
        return;
      }

      const rows: Record<string, string> = {};
      for (const slot of DOC_SLOTS) {
        const bytes = files.get(slot.path);
        if (bytes === undefined) {
          rows[slot.path] = "failed";
          setState((current) => ({ ...current, rows: { ...rows } }));
          continue;
        }
        rows[slot.path] = "delivering";
        setState((current) => ({ ...current, rows: { ...rows } }));
        const outcome = await putDocument({
          endpoint,
          subaccord,
          dispute,
          path: slot.path,
          bytes,
          operatorPub,
          onRetry: () => {
            rows[slot.path] = "retrying";
            setState((current) => ({ ...current, rows: { ...rows } }));
          },
        });
        if (outcome === "conflict") {
          rows[slot.path] = "failed";
          setState((current) => ({ ...current, rows: { ...rows }, conflict: slot.path }));
          return;
        }
        rows[slot.path] = "delivered";
        setState((current) => ({ ...current, rows: { ...rows } }));
      }
      if (DOC_SLOTS.every((slot) => rows[slot.path] === "delivered")) {
        recordDelivery(mutual, nonce);
        setState({ phase: "done" });
      }
    } catch (error) {
      setState({
        phase: "error",
        message: error instanceof Error ? error.message : "Couldn't reach the operator.",
      });
    }
  };

  const attach = async (path: string, file: File) => {
    const slot = DOC_SLOTS.find((s) => s.path === path);
    if (slot === undefined) return;
    const result = await intakeDocument(slot, file);
    setFiles((current) => new Map(current).set(path, result.bytes));
  };

  return (
    <div data-slot="recovery" className="flex max-w-[36rem] flex-col gap-3 py-2">
      {state.phase === "idle" || state.phase === "verifying" ? (
        <>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Re-upload your manifest.yaml
          </p>
          <label className={buttonVariants({ variant: "outline" }) + " w-fit"}>
            <input
              type="file"
              className="sr-only"
              accept=".yaml,.yml,text/yaml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onManifest(file);
                e.target.value = "";
              }}
            />
            {state.phase === "verifying" ? "Verifying…" : "Choose manifest.yaml"}
          </label>
        </>
      ) : null}
      {state.phase === "mismatch" ? (
        <p className="text-error [font:var(--riprap-body-sm)]">
          This manifest doesn't match this claim.
        </p>
      ) : null}
      {state.phase === "verified" ? (
        <>
          <p className="text-body [font:var(--riprap-body-sm)]">
            Manifest verified against the claim — re-attach the five documents.
          </p>
          <ul className="flex flex-col">
            {DOC_SLOTS.map((slot) => (
              <li
                key={slot.path}
                className="flex items-center justify-between gap-4 border-b border-hairline py-2 first:border-t"
              >
                <span data-num className="font-mono text-sm text-ink">
                  {slot.path}
                </span>
                <label className={buttonVariants({ variant: "outline" })}>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg,.heic,.heif,image/jpeg,image/png,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void attach(slot.path, file);
                      e.target.value = "";
                    }}
                  />
                  {files.has(slot.path) ? "Replace" : "Attach"}
                </label>
              </li>
            ))}
          </ul>
          <div>
            <Button disabled={files.size < DOC_SLOTS.length} onClick={() => void redeliver()}>
              Redeliver evidence
            </Button>
          </div>
        </>
      ) : null}
      {state.phase === "delivering" ? (
        <>
          <ul className="flex flex-col">
            {DOC_SLOTS.map((slot) => (
              <li
                key={slot.path}
                className="flex items-baseline justify-between gap-4 border-b border-hairline py-2 first:border-t"
              >
                <span data-num className="font-mono text-sm text-ink">
                  {slot.path}
                </span>
                <span data-num className="font-mono text-xs text-stone">
                  {state.rows[slot.path] ?? "delivering"}
                </span>
              </li>
            ))}
          </ul>
          {state.conflict !== undefined ? (
            <p className="text-error [font:var(--riprap-body-sm)]">
              The operator already holds a different file under{" "}
              <span data-num className="font-mono">
                {state.conflict}
              </span>
              . Nothing was overwritten. Re-attach the exact document from this request.
            </p>
          ) : null}
        </>
      ) : null}
      {state.phase === "done" ? (
        <p data-num className="font-mono text-sm text-ink">
          Evidence: delivered
        </p>
      ) : null}
      {state.phase === "error" ? (
        <p className="text-error [font:var(--riprap-body-sm)]">{state.message}</p>
      ) : null}
    </div>
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
