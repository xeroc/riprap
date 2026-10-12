// Recovery.tsx — the claim restore surface (`#/app/file-claim/:pool/restore/:nonce`,
// copy doc § /app/file-claim RESTORE, 2026-10-12): the read-only replay of a
// filed claim. The operator's public manifest endpoint is read FIRST; when it
// holds nothing, the kept manifest.yaml uploads manually. Either way the
// chain is the gate — sha256(manifest) == Dispute.evidence_hashes[0] — and
// the verified bytes parse into the read-only facts. Re-delivery re-attaches
// the bytes (the manifest carries hashes only) and runs the PUBLISH table:
// manifest row first, 🔒/spinner phases, per-row retry — a same-hash
// re-delivery is a 201 no-op, a divergent file 409s naturally. No signing,
// no sending: the dispute already exists on-chain.

import { AddressChip, BadgeStamp, Button, buttonVariants, usd } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { fetchDispute, fetchSubaccordMaybe } from "@useaccord/sdk";
import { useEffect, useRef, useState } from "react";
import { parseClaimManifest } from "../../adjudicate/package";
import { microToUsd } from "../../pool/mutual";
import type { ClusterRpc } from "../../shared/rpc";
import { intakeDocument, sha256Hex } from "./documents";
import { fetchManifest, operatorPubFromKey, postManifest, putDocument } from "./evidence";
import { recordDelivery } from "./evidenceRecord";
import type { DocSlot } from "./flow";
import type { ClaimManifestInput, ManifestSlot } from "./manifest";
import { type DocRowStatus, MANIFEST_ROW, StepPublish } from "./steps";
import { resolveEvidenceOperator } from "./useEvidenceOperator";

type RestoreState =
  | { phase: "fetching" } // reading the operator's stored manifest
  | { phase: "upload"; note?: string } // nothing readable stored — manual upload
  | { phase: "verifying" }
  | { phase: "mismatch" } // fetched or uploaded manifest is not this claim's
  | { phase: "review" } // read-only facts + attach-for-redelivery
  | { phase: "delivering" } // the PUBLISH table
  | { phase: "done" }
  | { phase: "error"; message: string };

export function Recovery({
  clusterRpc,
  mutual,
  subaccord,
  dispute,
  nonce,
  slots,
}: {
  clusterRpc: ClusterRpc;
  mutual: Address;
  subaccord: Address;
  dispute: Address;
  nonce: bigint;
  /** The pool's policy §7 slots (its ClaimFlow pack) — the attach rows. */
  slots: readonly DocSlot[];
}) {
  // url slots have no file to re-attach — their raw link rides the manifest
  // (re-POSTed on redelivery); only file slots re-PUT.
  const fileSlots = slots.filter((slot) => slot.url === undefined);
  const [state, setState] = useState<RestoreState>({ phase: "fetching" });
  const [files, setFiles] = useState(new Map<string, Uint8Array>());
  const [parsed, setParsed] = useState<ClaimManifestInput | null>(null);
  const [manifestSha, setManifestSha] = useState("");
  const [docRows, setDocRows] = useState<Record<string, DocRowStatus>>({});
  const [conflictPath, setConflictPath] = useState<string | undefined>(undefined);
  const [operatorDown, setOperatorDown] = useState(false);
  /** manifest bytes + row statuses outside React's render loop — the
   * completion check and per-row retry read the latest without racing. */
  const manifestBytes = useRef<Uint8Array | null>(null);
  const rowStatus = useRef<Record<string, DocRowStatus>>({});
  /** the resolved operator + its authority — one resolution per mount. */
  const operatorRef = useRef<{ url: string; encryptionKey: string } | null>(null);
  const [operatorAuthority, setOperatorAuthority] = useState<Address | null>(null);

  const setRow = (path: string, status: DocRowStatus) => {
    rowStatus.current[path] = status;
    setDocRows({ ...rowStatus.current });
  };
  const setRows = (paths: readonly string[], status: DocRowStatus) => {
    for (const path of paths) setRow(path, status);
  };

  /** The pool's manifest slots (its ClaimFlow pack) — the parse validates
   * entries against THIS pool's paths and url keys, never a fixed list. */
  const manifestSlots: ManifestSlot[] = slots.map((slot) => ({
    path: slot.path,
    url: slot.url,
  }));

  /** The gate either entry path runs: parse as this pool's shape, then
   * sha256(manifest) == the chain slot. Verified bytes are kept (re-delivery
   * POSTs them) and parsed into the read-only facts. An unparseable
   * manifest — stored or uploaded — falls back to the upload prompt with
   * the parse message (never a dead end); a hash miss is the hard mismatch. */
  const verify = async (bytes: Uint8Array): Promise<void> => {
    setState({ phase: "verifying" });
    let parsedManifest: ClaimManifestInput;
    try {
      parsedManifest = parseClaimManifest(bytes, manifestSlots);
    } catch (error) {
      setState({
        phase: "upload",
        note: error instanceof Error ? error.message : "Couldn't read that manifest.",
      });
      return;
    }
    try {
      const hash = await sha256Hex(bytes);
      const onChain = await fetchDispute(clusterRpc.rpc, dispute);
      const slot = onChain.data.evidenceHashes[0];
      const slotHex = slot === undefined ? "" : toHex(new Uint8Array(slot));
      if (hash !== slotHex) {
        setState({ phase: "mismatch" });
        return;
      }
      manifestBytes.current = bytes;
      setManifestSha(hash);
      setParsed(parsedManifest);
      setState({ phase: "review" });
    } catch (error) {
      setState({
        phase: "error",
        message: error instanceof Error ? error.message : "Couldn't verify the manifest.",
      });
    }
  };

  /** Entry: resolve the operator, read its stored manifest — held and
   * readable ⇒ verify straight into review; anything else (nothing stored,
   * or bytes this pool's shape can't parse) ⇒ the manual upload path. */
  const enter = async (): Promise<void> => {
    setState({ phase: "fetching" });
    try {
      const sub = await fetchSubaccordMaybe(clusterRpc.rpc, subaccord);
      if (!sub.exists) throw new Error("subaccord unreadable");
      const operator = await resolveEvidenceOperator(clusterRpc, sub.data.evidenceOperator);
      operatorRef.current = operator;
      setOperatorAuthority(sub.data.evidenceOperator);
      const stored = await fetchManifest({ endpoint: operator.url, subaccord, dispute });
      if (stored === null) {
        setState({ phase: "upload" });
        return;
      }
      await verify(stored);
    } catch (error) {
      setState({
        phase: "error",
        message: error instanceof Error ? error.message : "Couldn't reach the operator.",
      });
    }
  };
  useEffect(() => {
    void enter();
    // once per mount — the retry button is the explicit re-entry
  }, []);

  const onManifest = async (file: File) => {
    await verify(new Uint8Array(await file.arrayBuffer()));
  };

  /** POST the manifest and settle its row — shared by redelivery and every
   * retry path. False = failed or conflicted (hard stop; caller stops). */
  const deliverManifestRow = async (): Promise<boolean> => {
    const operator = operatorRef.current;
    const bytes = manifestBytes.current;
    if (operator === null || bytes === null) return false;
    try {
      const posted = await postManifest({
        endpoint: operator.url,
        subaccord,
        dispute,
        manifest: bytes,
        operatorPub: operatorPubFromKey(operator.encryptionKey),
        onPhase: (phase) => setRow(MANIFEST_ROW, phase),
      });
      if (posted === "conflict") {
        setConflictPath(MANIFEST_ROW);
        setRow(MANIFEST_ROW, "failed");
        return false;
      }
      setRow(MANIFEST_ROW, "delivered");
      setOperatorDown(false);
      // url slots ride the manifest — delivered with it
      setRows(
        slots.filter((s) => s.url !== undefined).map((s) => s.path),
        "delivered",
      );
      return true;
    } catch (error) {
      setOperatorDown(true);
      setRow(MANIFEST_ROW, "failed");
      setState({
        phase: "error",
        message: error instanceof Error ? error.message : "Couldn't reach the operator.",
      });
      return false;
    }
  };

  /** PUT one document and settle its row — shared by redelivery and retry. */
  const deliverFileRow = async (
    path: string,
    bytes: Uint8Array,
  ): Promise<"delivered" | "failed" | "conflict"> => {
    const operator = operatorRef.current;
    if (operator === null) return "failed";
    try {
      const outcome = await putDocument({
        endpoint: operator.url,
        subaccord,
        dispute,
        path,
        bytes,
        operatorPub: operatorPubFromKey(operator.encryptionKey),
        onPhase: (phase) => setRow(path, phase),
        onRetry: () => setRow(path, "uploading"),
      });
      if (outcome === "conflict") {
        setConflictPath(path); // hard stop — wrong document under this path
        setRow(path, "failed");
        return "conflict";
      }
      setRow(path, "delivered");
      return "delivered";
    } catch {
      setRow(path, "failed");
      setOperatorDown(true);
      return "failed";
    }
  };

  /** Every row delivered → record + done (idempotent). */
  const completeIfDelivered = () => {
    if (
      ![MANIFEST_ROW, ...slots.map((s) => s.path)].every(
        (p) => rowStatus.current[p] === "delivered",
      )
    )
      return;
    recordDelivery(
      mutual,
      nonce,
      slots.map((s) => s.path),
    );
    setState({ phase: "done" });
  };

  /** Redeliver: the manifest row first (a held identical manifest POSTs as a
   * 201 no-op), then every re-attached file. */
  const redeliver = async () => {
    if (state.phase !== "review") return;
    setState({ phase: "delivering" });
    if (!(await deliverManifestRow())) return;
    for (const slot of fileSlots) {
      const bytes = files.get(slot.path);
      if (bytes === undefined) {
        setRow(slot.path, "failed");
        continue;
      }
      const outcome = await deliverFileRow(slot.path, bytes);
      if (outcome === "conflict") return; // hard stop — nothing else runs
    }
    completeIfDelivered();
  };

  /** Per-row retry off the PUBLISH table — same shape as the wizard's: the
   * manifest row re-posts itself; a file row re-posts the manifest first
   * when its row never delivered. */
  const retryRow = async (path: string) => {
    if (conflictPath !== undefined) return;
    if (path === MANIFEST_ROW) {
      if (await deliverManifestRow()) completeIfDelivered();
      return;
    }
    if (rowStatus.current[MANIFEST_ROW] !== "delivered") {
      if (!(await deliverManifestRow())) return;
    }
    const bytes = files.get(path);
    if (bytes === undefined) {
      setRow(path, "failed");
      return;
    }
    const outcome = await deliverFileRow(path, bytes);
    if (outcome === "delivered") setOperatorDown(false);
    completeIfDelivered();
  };

  const attach = async (path: string, file: File) => {
    const slot = slots.find((s) => s.path === path);
    if (slot === undefined) return;
    const result = await intakeDocument(slot, file);
    setFiles((current) => new Map(current).set(path, result.bytes));
  };

  return (
    <div data-slot="recovery" className="flex max-w-3xl flex-col gap-(--riprap-space-md)">
      {state.phase === "fetching" ? (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading the manifest from the evidence operator…
        </p>
      ) : null}
      {state.phase === "error" ? (
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-error [font:var(--riprap-body-sm)]">{state.message}</p>
          <Button variant="outline" className="w-44" onClick={() => void enter()}>
            Try again
          </Button>
        </div>
      ) : null}
      {state.phase === "upload" || state.phase === "verifying" ? (
        <>
          <p className="text-body [font:var(--riprap-body-sm)]">
            The operator doesn't hold this claim's manifest.
          </p>
          {state.phase === "upload" && state.note !== undefined ? (
            <p data-num className="break-all font-mono text-xs text-error">
              {state.note}
            </p>
          ) : null}
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Re-upload your manifest.yaml
          </p>
          <label className={`${buttonVariants({ variant: "outline" })} w-fit`}>
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
      {state.phase === "review" && parsed !== null ? (
        <>
          <h1 data-num className="font-mono text-lg text-ink">
            <BadgeStamp>Claim #{nonce.toString()} — as filed</BadgeStamp>
          </h1>
          <dl className="flex max-w-3xl flex-col gap-2">
            <SummaryRow
              label="Requested"
              mono={usd(microToUsd(parsed.claimContext.requestedAmountUsdc))}
            />
            <SummaryRow label="Incident" mono={parsed.claimContext.incidentAt} />
            <SummaryRow label="Where" mono={parsed.claimContext.incidentPlace} />
            <SummaryRow label="Tier" mono={parsed.claimContext.tier} />
            <SummaryRow
              label="Contribution"
              mono={usd(microToUsd(parsed.claimContext.contributionUsdc))}
            />
          </dl>
          <p data-num className="break-all font-mono text-xs text-stone">
            manifest.yaml — sha256 {manifestSha}
          </p>
          <p data-num className="font-mono text-sm text-muted-foreground">
            <AddressChip address={dispute} />
          </p>
          <p className="text-body [font:var(--riprap-body-sm)]">
            Manifest verified against the claim — re-attach the five documents.
          </p>
          <ul className="flex flex-col">
            {parsed.entries.map((entry) => {
              // a url slot's entry carries the RAW link as its path —
              // show the link itself (EVIDENCE-FORMAT §2 out-of-band)
              const path = "path" in entry ? entry.path : entry.url;
              const isFile = "path" in entry;
              return (
                <li
                  key={path}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-hairline py-2"
                >
                  <span data-num className="break-all font-mono text-xs text-muted-foreground">
                    {path} — sha256 {entry.sha256}
                  </span>
                  {isFile ? (
                    <label className={buttonVariants({ variant: "outline" })}>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.png,.jpg,.jpeg,.heic,.heif,image/jpeg,image/png,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void attach(path, file);
                          e.target.value = "";
                        }}
                      />
                      {files.has(path) ? "Replace" : "Attach"}
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div>
            <Button disabled={files.size < fileSlots.length} onClick={() => void redeliver()}>
              Redeliver evidence
            </Button>
          </div>
        </>
      ) : null}
      {state.phase === "delivering" ? (
        <StepPublish
          operatorAddress={operatorAuthority ?? ("P".repeat(32) as Address)}
          rows={[
            { path: MANIFEST_ROW, status: docRows[MANIFEST_ROW] ?? "pending" },
            ...slots.map((s) => ({ path: s.path, status: docRows[s.path] ?? "pending" })),
          ]}
          conflictPath={conflictPath}
          unreachable={operatorDown}
          onRetry={(path) => void retryRow(path)}
        />
      ) : null}
      {state.phase === "done" ? (
        <p data-num className="font-mono text-sm text-ink">
          Evidence: delivered
        </p>
      ) : null}
    </div>
  );
}

/** The review facts row — label + mono value (labels verbatim with REVIEW). */
function SummaryRow({ label, mono }: { label: string; mono: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
      <dt className="text-muted-foreground [font:var(--riprap-body-sm)]">{label}</dt>
      <dd data-num className="font-mono text-sm text-ink">
        {mono}
      </dd>
    </div>
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
