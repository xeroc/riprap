// #/app/file-claim — the payout-request wizard (CLAIM-WIZARD v1, copy doc §
// /app/file-claim): wallet gate → step 0 preflight (chain gates only) →
// incident → amount → evidence → manifest → review → sign → publish →
// filed. The sign step builds ONE hanse::file_claim tx via
// @riprap/hanse's buildFileClaim and sends it through the shared
// sendInstruction seam; a nonce race (another member filed first) refetches
// the nonce, rebuilds, and re-signs exactly once — NEVER re-sent after
// success. Publish delivers the encrypted manifest (POST) + documents
// (per-file PUT, independent retry, 409 = hard stop) per ADR-0031. The
// draft (localStorage, fields + hashes only) clears once the claim is filed.
// Every string is copy-doc verbatim; numbers come from chain reads; mono
// numerals throughout.

import { buildFileClaim, fetchMaybeMutual, findClaimPda } from "@riprap/hanse";
import { Button, HexBackdrop, SectionBand, TextLink, usd } from "@riprap/ui";
import { useCluster, useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { findAccordStatePda, findDisputePda } from "@useaccord/sdk";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Settle } from "../../components/Settle";
import { SiteNav } from "../../components/SiteNav";
import { formatUtc, microToUsd, poolTiers, resolveMutualAddress } from "../../pool/mutual";
import { useClusterRpc, useHanseEnv } from "../../shared/rpc";
import { describeError, sendInstruction } from "../../shared/transaction";
import { AppNavControls, ClusterSwitch, ConnectWalletButton } from "../controls";
import { intakeDocument } from "./documents";
import {
  type ClaimDraft,
  clearDraft,
  type DocSlot,
  emptyDraft,
  loadDraft,
  saveDraft,
} from "./draft";
import { operatorPubFromKey, postManifest, putDocument } from "./evidence";
import { recordDelivery } from "./evidenceRecord";
import { buildClaimManifest, CLAIM_DOCUMENT_PATHS } from "./manifest";
import {
  type DocRowStatus,
  EmergencyBanner,
  type SignPhase,
  type SlotIntake,
  StepAmount,
  StepEvidence,
  StepFiled,
  StepIncident,
  StepManifest,
  StepPublish,
  StepReview,
  StepSign,
} from "./steps";
import { type PreflightBlock, type PreflightPass, useClaimPreflight } from "./useClaimPreflight";
import { useEvidenceOperator } from "./useEvidenceOperator";

/** Steps this page owns — 0 gate, 1–5 collect, 6 sign, 7 publish, 8 filed. */
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** The five canonical paths, policy §7 order — the manifest module's list. */
const DOC_PATHS = CLAIM_DOCUMENT_PATHS;

/** What the sign step hands to publish + filed. */
interface FiledResult {
  signature: string;
  claim: Address;
  dispute: Address;
  nonce: bigint;
}

/** Synchronous manifest.yaml download — must ride a user gesture. */
function downloadManifest(yaml: string): void {
  const blob = new Blob([yaml], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "manifest.yaml";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** 64-hex sha256 → 32 bytes — the on-chain evidence_hash (§7). */
function hexToBytes32(hex: string): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Date → `2026-11-15T18:05:00Z` (seconds precision, Z) — the manifest §5
 * stamps (serializeClaimManifest rejects millisecond ISO strings). */
function isoSeconds(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

/** Date → `2026-11-15` (UTC calendar date) — the title's incident date. */
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The wallet gate for a deep link with no wallet (copy doc § /app/file-claim Frame). */
function WizardGate() {
  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)]">
          Payout request
        </h1>
      </Settle>
      <Settle delay={60}>
        <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          Connect the wallet you joined with. Filing needs its signature.
        </p>
      </Settle>
      <Settle delay={120}>
        <ConnectWalletButton size="lg" data-participate label="Connect a wallet" />
      </Settle>
    </div>
  );
}

/** Step 0 — the preflight gate: hook states, honest copy, no fields. */
function PreflightGate({ onPass }: { onPass: () => void }) {
  const preflight = useClaimPreflight();
  useEffect(() => {
    if (preflight.state === "pass") onPass();
  }, [preflight.state, onPass]);

  if (preflight.state === "not-found") {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-live">
        <p className="text-ink [font:var(--riprap-body-md)]">Not live on this cluster</p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          The Blade Pool isn't deployed on this network. Switch networks to find it.
        </p>
        <ClusterSwitch />
      </div>
    );
  }
  if (preflight.state === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">
          {preflight.source === "membership"
            ? "Couldn't read your membership."
            : "Couldn't reach the cluster."}
        </p>
        <Button variant="outline" className="w-44" onClick={preflight.retry}>
          Try again
        </Button>
      </div>
    );
  }
  if (preflight.state === "blocked") {
    return <BlockedState block={preflight.block} />;
  }
  // loading and the pass instant before onPass advances
  return (
    <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
      Checking your membership, the claims window, and the juror fee.
    </p>
  );
}

/** The blocked kinds — each its copy-doc state (§ /app/file-claim step 0). */
function BlockedState({ block }: { block: PreflightBlock }) {
  switch (block.kind) {
    case "not-member":
      return (
        <div className="flex max-w-3xl flex-col gap-2" data-slot="not-a-member">
          <p className="text-ink [font:var(--riprap-body-md)]">This wallet isn't in the pool.</p>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Membership opens on{" "}
            <TextLink href="#/2026-breakpoint-blade-pool">the pool page</TextLink>.
          </p>
        </div>
      );
    case "no-rights-stake":
      return (
        <div className="flex max-w-3xl flex-col gap-2" data-slot="no-rights-stake">
          <p className="text-ink [font:var(--riprap-body-md)]">
            No rights stake left on this membership.
          </p>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            It cannot file a payout request.
          </p>
        </div>
      );
    case "claim-open":
      return (
        <div className="flex max-w-3xl flex-col gap-2" data-slot="claim-open">
          <p className="text-ink [font:var(--riprap-body-md)]">You already have an open claim.</p>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            One open claim per member. Follow it on{" "}
            <TextLink href="#/app">the app surface</TextLink>.
          </p>
        </div>
      );
    case "window-closed":
      return (
        <div className="flex max-w-3xl flex-col gap-2" data-slot="window-closed">
          <p className="text-ink [font:var(--riprap-body-md)]">
            The claims window closed{" "}
            <span data-num className="font-mono">
              {formatUtc(block.closedAt)}
            </span>
            .
          </p>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Payout requests are no longer accepted for this pool.
          </p>
        </div>
      );
    case "fee-short": {
      const shortfall = block.feeMicro - block.balanceMicro;
      return (
        <div className="flex max-w-3xl flex-col gap-2" data-slot="fee-short">
          <p className="text-ink [font:var(--riprap-body-md)]">
            Juror fee short by{" "}
            <span data-num className="font-mono">
              {usd(microToUsd(shortfall))}
            </span>{" "}
            USDC.
          </p>
          <p className="max-w-[42rem] leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
            Filing pre-pays{" "}
            <span data-num className="font-mono">
              {usd(microToUsd(block.feeMicro))}
            </span>{" "}
            USDC —{" "}
            <span data-num className="font-mono">
              {block.minJurySize}
            </span>{" "}
            jurors at{" "}
            <span data-num className="font-mono">
              {usd(microToUsd(block.feePerJuror))}
            </span>{" "}
            USDC each — from this wallet's USDC, plus a little SOL for rent and fees.
          </p>
        </div>
      );
    }
    case "no-sol":
      return (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]" data-slot="no-sol">
          You'll also need SOL for network fees.
        </p>
      );
  }
}

/** The wizard machine: gate → collect → one signature → delivery → filed. */
function Wizard({ wallet }: { wallet: Address }) {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const mutualAddress = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const clusterRpc = useClusterRpc();
  const hanseEnv = useHanseEnv();

  const preflight = useClaimPreflight();
  const pass: PreflightPass | null = preflight.state === "pass" ? preflight.pass : null;
  // Operator discovery resolves once per session, whatever step renders it
  // (CLAIM-WIZARD §8) — hoisted so the hook order never moves.
  const operator = useEvidenceOperator(clusterRpc, pass?.evidenceOperator ?? null);

  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<ClaimDraft>(() =>
    mutualAddress === undefined ? emptyDraft() : loadDraft(mutualAddress),
  );
  const [intakes, setIntakes] = useState<Record<string, SlotIntake>>({});
  /** Upload bytes per canonical path — session memory only, never persisted. */
  const fileBytes = useRef(new Map<string, Uint8Array>());
  const [manifest, setManifest] = useState<{ yaml: string; sha256: string } | null>(null);

  // sign/publish/filed machine state
  const [signPhase, setSignPhase] = useState<SignPhase>("building");
  const [nonceRace, setNonceRace] = useState(false);
  const [filed, setFiled] = useState<FiledResult | null>(null);
  const [docRows, setDocRows] = useState<Record<string, DocRowStatus>>({});
  const [conflictPath, setConflictPath] = useState<string | undefined>(undefined);
  const [operatorDown, setOperatorDown] = useState(false);

  const tier =
    pass === null
      ? null
      : poolTiers(pass.mutual)[Math.min(pass.member.tier, poolTiers(pass.mutual).length - 1)];

  // Draft persistence: field changes land in localStorage (fields + hashes
  // only — file bytes never).
  useEffect(() => {
    if (mutualAddress !== undefined) saveDraft(mutualAddress, draft);
  }, [mutualAddress, draft]);

  const patch = (changes: Partial<ClaimDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const attach = async (slot: DocSlot, file: File) => {
    try {
      const result = await intakeDocument(slot, file);
      fileBytes.current.set(slot.path, result.bytes);
      setIntakes((current) => ({
        ...current,
        [slot.path]: { sha256: result.sha256, fileName: result.fileName },
      }));
      // functional update: a fast re-attach loop must not drop sibling slots
      setDraft((current) => ({
        ...current,
        docs: {
          ...current.docs,
          [slot.path]: { sha256: result.sha256, fileName: result.fileName },
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't read that file.";
      setIntakes((current) => ({
        ...current,
        [slot.path]: { sha256: "", fileName: file.name, error: message },
      }));
    }
  };

  // Entering step 2: default the amount to the tier cap (copy doc § AMOUNT).
  const enterAmount = () => {
    if (draft.amountUsdc === "" && tier !== null) patch({ amountUsdc: String(tier.cap) });
    setStep(2);
  };

  // Entering step 4: build the manifest ONCE — one buffer feeds preview,
  // hash, signature, and delivery (CLAIM-WIZARD §5: never re-serialize).
  const enterManifest = async () => {
    if (pass === null || tier === null || mutualAddress === undefined) return;
    const nonce = pass.mutual.claimNonce;
    const [claim] = await findClaimPda({ mutual: mutualAddress, nonce });
    const [dispute] = await findDisputePda({ filer: mutualAddress, nonce });
    const amountMicro = BigInt(Math.round(Number.parseFloat(draft.amountUsdc) * 1_000_000));
    const incidentAt = new Date(draft.incidentAt);
    const built = await buildClaimManifest({
      dispute,
      subaccord: pass.mutual.subaccord,
      filer: mutualAddress, // §5: the filer is the mutual PDA
      mutual: mutualAddress,
      member: wallet,
      claim,
      filedAt: isoSeconds(new Date()),
      title: `Payout request — knife assault, ${isoDate(incidentAt)}`,
      claimContext: {
        incidentAt: isoSeconds(incidentAt),
        incidentPlace: draft.incidentPlace,
        requestedAmountUsdc: amountMicro,
        tier: tier.name,
        contributionUsdc: pass.mutual.tiers[pass.member.tier].contribution,
      },
      // all five attached — step 3 gates Continue on the complete set
      entries: DOC_PATHS.map((path) => ({ path, sha256: draft.docs[path]?.sha256 ?? "" })),
    });
    setManifest({ yaml: built.yaml, sha256: built.sha256Hex });
    setStep(4);
  };

  /** One build+send attempt at a given nonce. Throws on failure. */
  const attemptSign = async (nonce: bigint): Promise<FiledResult> => {
    if (hanseEnv === null || pass === null || manifest === null || mutualAddress === undefined) {
      throw new Error("signing prerequisites disappeared mid-flight");
    }
    const [dispute] = await findDisputePda({ filer: mutualAddress, nonce });
    const [accordState] = await findAccordStatePda();
    const build = await buildFileClaim({
      mutual: {
        address: mutualAddress,
        claimNonce: nonce,
        pool: pass.mutual.pool,
        subaccord: pass.mutual.subaccord,
        feeMint: pass.mutual.feeMint,
      },
      subaccord: { minJurySize: pass.minJurySize, feePerJuror: pass.feePerJuror },
      claimant: hanseEnv.signer,
      requested: BigInt(Math.round(Number.parseFloat(draft.amountUsdc) * 1_000_000)),
      evidenceHash: hexToBytes32(manifest.sha256),
      dispute,
      accordState,
    });
    setSignPhase("wallet-signing");
    const signature = await sendInstruction(
      hanseEnv.rpc,
      hanseEnv.rpcSubscriptions,
      hanseEnv.signer,
      [build.instruction],
      () => setSignPhase("confirming"),
    );
    return { signature, claim: build.claim, dispute: build.dispute, nonce: build.nonce };
  };

  /**
   * The sign step (copy doc § SIGN): one tx; a nonce race (another member
   * filed first — the Claim-PDA init fails) refetches the nonce, rebuilds,
   * and re-signs EXACTLY once. NEVER re-sent after success: `filed` gates
   * every re-entry.
   */
  const signAndFile = async () => {
    if (filed !== null || manifest === null || pass === null || clusterRpc === null) return;
    setStep(6);
    setSignPhase("building");
    setNonceRace(false);
    try {
      const result = await attemptSign(pass.mutual.claimNonce);
      setFiled(result);
      void deliverEvidence(result);
    } catch (err) {
      try {
        // nonce race? the chain's nonce moved under us — rebuild + re-sign once
        if (mutualAddress === undefined) throw err;
        const fresh = await fetchMaybeMutual(clusterRpc.rpc, mutualAddress);
        const moved = fresh.exists && fresh.data.claimNonce !== pass.mutual.claimNonce;
        if (!moved) throw err;
        setNonceRace(true);
        setSignPhase("building");
        const result = await attemptSign(fresh.data.claimNonce);
        setFiled(result);
        void deliverEvidence(result);
      } catch (raceErr) {
        toast.error(describeError(raceErr));
        setStep(5);
      }
    }
  };

  /**
   * The publish step (copy doc § PUBLISH, ADR-0031): manifest POST first,
   * then per-file PUTs — independent ECIES, per-file retry, 409 hard stop.
   * Runs only after a landed tx (delivery retries never re-send the claim).
   */
  const deliverEvidence = async (result: FiledResult) => {
    setStep(7);
    if (manifest === null || pass === null || mutualAddress === undefined) return;
    if (operator.state !== "ready") {
      setOperatorDown(true);
      setDocRows(Object.fromEntries(DOC_PATHS.map((path) => [path, "failed" as const])));
      return;
    }
    const endpoint = operator.operator.url;
    const operatorPub = operatorPubFromKey(operator.operator.encryptionKey);
    setOperatorDown(false);

    let posted: "posted" | "conflict";
    try {
      posted = await postManifest({
        endpoint,
        subaccord: pass.mutual.subaccord,
        dispute: result.dispute,
        manifest: new TextEncoder().encode(manifest.yaml),
        operatorPub,
      });
    } catch (error) {
      // a 400 here is loud (unknown schema — never silently degraded); any
      // failure leaves delivery retryable from the app surface
      setOperatorDown(true);
      toast.error(error instanceof Error ? error.message : "Couldn't reach the operator.");
      setDocRows(Object.fromEntries(DOC_PATHS.map((path) => [path, "failed" as const])));
      return;
    }
    if (posted === "conflict") {
      // a different manifest is already stored for this dispute — the wrong
      // manifest for this claim; nothing to retry
      setConflictPath("manifest.yaml");
      return;
    }

    let delivered = 0;
    for (const path of DOC_PATHS) {
      const bytes = fileBytes.current.get(path);
      if (bytes === undefined) {
        setDocRows((current) => ({ ...current, [path]: "failed" }));
        continue;
      }
      setDocRows((current) => ({ ...current, [path]: "delivering" }));
      try {
        const outcome = await putDocument({
          endpoint,
          subaccord: pass.mutual.subaccord,
          dispute: result.dispute,
          path,
          bytes,
          operatorPub,
          onRetry: () => setDocRows((current) => ({ ...current, [path]: "retrying" })),
        });
        if (outcome === "conflict") {
          setConflictPath(path); // hard stop — wrong document under this path
          setDocRows((current) => ({ ...current, [path]: "failed" }));
          return;
        }
        delivered += 1;
        setDocRows((current) => ({ ...current, [path]: "delivered" }));
      } catch {
        setDocRows((current) => ({ ...current, [path]: "failed" }));
        setOperatorDown(true);
      }
    }
    if (delivered === DOC_PATHS.length) {
      setStep(8);
      if (mutualAddress !== undefined) {
        clearDraft(mutualAddress);
        recordDelivery(mutualAddress, result.nonce); // the #/app evidence line
      }
    }
  };

  const incidentIso =
    draft.incidentAt === "" ? "{{PARAM}}" : new Date(draft.incidentAt).toISOString();

  const publishRows = DOC_PATHS.map((path) => ({ path, status: docRows[path] ?? "pending" }));
  const deliveredCount = DOC_PATHS.filter((path) => docRows[path] === "delivered").length;

  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="wizard">
      <EmergencyBanner />
      {pass === null || tier === null ? (
        // Step 0 — and the honest re-gate if the chain state moved under an
        // open wizard: the flow never collects past an invalid gate.
        <PreflightGate onPass={() => setStep(1)} />
      ) : step === 1 ? (
        <StepIncident
          draft={draft}
          onChange={patch}
          onBack={() => setStep(0)}
          onContinue={enterAmount}
        />
      ) : step === 2 ? (
        <StepAmount
          draft={draft}
          tier={tier}
          onChange={patch}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      ) : step === 3 ? (
        <StepEvidence
          draft={draft}
          intakes={intakes}
          onAttach={attach}
          onAttest={(checked) => patch({ samePerson: checked })}
          onBack={() => setStep(2)}
          onContinue={() => void enterManifest()}
        />
      ) : step === 4 && manifest !== null ? (
        <StepManifest
          yaml={manifest.yaml}
          sha256={manifest.sha256}
          onDownload={() => downloadManifest(manifest.yaml)}
          onBack={() => setStep(3)}
          onContinue={() => {
            // submit-start copy (browser-gesture rule): the same click that
            // advances delivers the recovery artifact.
            downloadManifest(manifest.yaml);
            setStep(5);
          }}
        />
      ) : step === 5 ? (
        <StepReview
          draft={draft}
          tier={tier}
          feeMicro={pass.feeMicro}
          minJurySize={pass.minJurySize}
          feePerJuror={pass.feePerJuror}
          incidentIso={incidentIso}
          operator={operator}
          canSign={manifest !== null && hanseEnv !== null && filed === null}
          onBack={() => setStep(4)}
          onSign={() => void signAndFile()}
        />
      ) : step === 6 ? (
        <StepSign phase={signPhase} nonceRace={nonceRace} />
      ) : step === 7 && filed !== null ? (
        <StepPublish
          operatorName={operator.state === "ready" ? operator.operator.name : "{{PARAM}}"}
          rows={publishRows}
          conflictPath={conflictPath}
          unreachable={operatorDown}
        />
      ) : step === 8 && filed !== null && manifest !== null ? (
        <StepFiled
          nonce={filed.nonce}
          claim={filed.claim}
          dispute={filed.dispute}
          delivered={deliveredCount}
          feeUsd={usd(microToUsd(pass.feeMicro))}
          onDownload={() => downloadManifest(manifest.yaml)}
        />
      ) : (
        <PreflightGate onPass={() => setStep(1)} />
      )}
    </div>
  );
}

export function FileClaimPage() {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <>
      <SiteNav actions={<AppNavControls />} />
      <main>
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="file-claim"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            {connected && account !== null ? <Wizard wallet={account} /> : <WizardGate />}
          </SectionBand>
        </div>
      </main>
    </>
  );
}
