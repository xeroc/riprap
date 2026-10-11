// #/app/file-claim[/:pool] — the payout-request wizard (CLAIM-WIZARD v1,
// copy doc § /app/file-claim): wallet gate → step 0 preflight (chain gates
// only) → incident → amount → evidence → manifest → review → sign →
// publish → filed. The pool is the route id (`#/app/file-claim/<pool>`),
// else the static-map pool (legacy deep links + the env-bound surfnet) —
// its ClaimFlow pack drives every pool-specific string and slot, its
// listing the tier names, its resolved address every chain read. The sign
// step builds ONE hanse::file_claim tx via @riprap/hanse's buildFileClaim
// and sends it through the shared sendInstruction seam; a nonce race
// (another member filed first) refetches the nonce, rebuilds, and re-signs
// exactly once — NEVER re-sent after success. Publish delivers the
// encrypted manifest (POST) + documents (per-file PUT, independent retry,
// 409 = hard stop) per ADR-0031. The draft (localStorage, fields + hashes
// only) clears once the claim is filed. Every string is pack/copy-doc
// verbatim; numbers come from chain reads; mono numerals throughout.

import { buildFileClaim, fetchMaybeMutual } from "@riprap/hanse";
import { Button, HexBackdrop, SectionBand, TextLink, usd } from "@riprap/ui";
import { useCluster, useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { findAccordStatePda, findDisputePda } from "@useaccord/sdk";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";
import { Settle } from "../../components/Settle";
import { SiteNav } from "../../components/SiteNav";
import { poolByRouteId, poolRoute } from "../../mutuals/data";
import type { MutualListing } from "../../mutuals/types";
import {
  formatUtc,
  microToUsd,
  poolTiers,
  resolvePoolAddress,
  TIER_NAMES,
} from "../../pool/mutual";
import { useClusterRpc, useHanseEnv } from "../../shared/rpc";
import { describeError, sendInstruction } from "../../shared/transaction";
import { ClusterSwitch, ConnectWalletButton } from "../controls";
import { intakeDocument, intakeUrl } from "./documents";
import { type ClaimDraft, clearDraft, emptyDraft, loadDraft, saveDraft } from "./draft";
import { operatorPubFromKey, postManifest, putDocument } from "./evidence";
import { recordDelivery } from "./evidenceRecord";
import type { ClaimFlow, DocSlot } from "./flow";
import { claimFlowFor } from "./flows/index";
import { buildClaimManifest } from "./manifest";
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

/** What the sign step hands to publish + filed. */
interface FiledResult {
  signature: string;
  claim: Address;
  dispute: Address;
  nonce: bigint;
}

/**
 * One serialized manifest (CLAIM-WIZARD §5, ADR-0003 — address-free, so
 * nonce-invariant). The buffer is atomic: the tx's evidence hash, the
 * operator POST, and the downloaded recovery file all read from this one
 * object, never a re-serialization.
 */
interface ManifestBuffer {
  yaml: string;
  sha256: string;
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

/** Step 0 — the preflight gate: hook states, honest copy, no fields. The
 *  pool's name and detail route parameterize the shared states (a deep
 *  link that names no pool never renders here — the Wizard redirects). */
function PreflightGate({
  mutual,
  poolName,
  poolHref,
  onPass,
}: {
  mutual?: Address;
  poolName: string;
  poolHref: string;
  onPass: () => void;
}) {
  const preflight = useClaimPreflight(mutual);
  useEffect(() => {
    if (preflight.state === "pass") onPass();
  }, [preflight.state, onPass]);

  if (preflight.state === "not-found") {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-live">
        <p className="text-ink [font:var(--riprap-body-md)]">Not live on this cluster</p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          {poolName} isn't deployed on this network. Switch networks to find it.
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
    return <BlockedState block={preflight.block} poolHref={poolHref} />;
  }
  // loading and the pass instant before onPass advances
  return (
    <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
      Checking your membership, the claims window, and the adjudication fee.
    </p>
  );
}

function BlockedState({ block, poolHref }: { block: PreflightBlock; poolHref: string }) {
  switch (block.kind) {
    case "not-member":
      return (
        <div className="flex max-w-3xl flex-col gap-2" data-slot="not-a-member">
          <p className="text-ink [font:var(--riprap-body-md)]">This wallet isn't in the pool.</p>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Membership opens on <TextLink href={poolHref}>the pool page</TextLink>.
          </p>
        </div>
      );
    case "cap-exhausted":
      return (
        <div className="flex max-w-3xl flex-col gap-2" data-slot="cap-exhausted">
          <p className="text-ink [font:var(--riprap-body-md)]">Your tier cap is used up.</p>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            This membership has already requested its maximum payout. Follow your claims on{" "}
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
            Adjudication fee short by{" "}
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
            USDC from this wallet's USDC, plus a little SOL for rent and fees.
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

/** The wizard machine: gate → collect → one signature → delivery → filed,
 *  for ONE pool — `pool` is its route id (`pubkey ?? slug`, the row's
 *  deep link); unknown ids and flow-less pools fall back to the app
 *  surface (the joined-pools table). */
function Wizard({ wallet, pool }: { wallet: Address; pool?: string }) {
  const clusters = useCluster();
  const listing: MutualListing | undefined = pool !== undefined ? poolByRouteId(pool) : undefined;
  const flow: ClaimFlow | null = claimFlowFor(listing);
  const invalidPool = listing === undefined || flow === null;
  // undefined ⇒ the static map — harmless when invalid: we navigate away at
  // render, before any step shows.
  const mutualAddress = invalidPool ? undefined : resolvePoolAddress(listing, clusters);
  const tierNames = listing !== undefined ? listing.tiers.map((t) => t.name) : TIER_NAMES;
  const docPaths = flow !== null ? flow.documentSlots.map((s) => s.path) : [];
  /** File slots only — url slots have no document to PUT; the manifest
   *  itself (raw link under the slot's key) is their delivery. */
  const filePaths =
    flow !== null ? flow.documentSlots.filter((s) => s.url === undefined).map((s) => s.path) : [];

  const clusterRpc = useClusterRpc();
  const hanseEnv = useHanseEnv();

  const preflight = useClaimPreflight(mutualAddress);
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
  const [manifest, setManifest] = useState<ManifestBuffer | null>(null);

  // sign/publish/filed machine state
  const [signPhase, setSignPhase] = useState<SignPhase>("building");
  const [nonceRace, setNonceRace] = useState(false);
  const [filed, setFiled] = useState<FiledResult | null>(null);
  const [docRows, setDocRows] = useState<Record<string, DocRowStatus>>({});
  const [conflictPath, setConflictPath] = useState<string | undefined>(undefined);
  const [operatorDown, setOperatorDown] = useState(false);

  // Draft persistence: field changes land in localStorage (fields + hashes
  // only — file bytes never).
  useEffect(() => {
    if (mutualAddress !== undefined) saveDraft(mutualAddress, draft);
  }, [mutualAddress, draft]);

  const tiers = pass === null ? null : poolTiers(pass.mutual, tierNames);
  const tier =
    pass === null || tiers === null ? null : tiers[Math.min(pass.member.tier, tiers.length - 1)];
  /** The REMAINING cap (chain truth): tier max − cap_used — concurrent
   * filings share the cumulative cap (multi-claim amendment). */
  const capUsdc = pass === null ? 0 : Number(pass.capRemainingMicro) / 1_000_000;
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

  /** Url-slot intake — same machinery as attach: bytes in session memory,
   *  hash + link in the draft (the URL's UTF-8 is the slot's document). */
  const attachUrl = async (slot: DocSlot, url: string) => {
    try {
      const result = await intakeUrl(slot, url);
      fileBytes.current.set(slot.path, result.bytes);
      setIntakes((current) => ({
        ...current,
        [slot.path]: { sha256: result.sha256, fileName: result.fileName },
      }));
      setDraft((current) => ({
        ...current,
        docs: {
          ...current.docs,
          [slot.path]: { sha256: result.sha256, fileName: result.fileName, url },
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't read that link.";
      setIntakes((current) => ({
        ...current,
        [slot.path]: { sha256: "", fileName: url, error: message },
      }));
    }
  };

  const patch = (changes: Partial<ClaimDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  // Entering step 2: default the amount to the remaining cap (copy doc §
  // AMOUNT — concurrent filings clamp to what the membership has left).
  const enterAmount = () => {
    if (draft.amountUsdc === "" && tier !== null) patch({ amountUsdc: String(capUsdc) });
    setStep(2);
  };

  /** Serialize the manifest — address-free (ADR-0003): the buffer carries
   * no nonce-derived data, so a filing race never touches it. One buffer
   * feeds preview, hash, signature, POST, and download — never a second
   * serialization of the same claim. */
  const buildManifest = async (): Promise<ManifestBuffer> => {
    if (pass === null || tier === null || mutualAddress === undefined || flow === null) {
      throw new Error("manifest prerequisites disappeared mid-flight");
    }
    const amountMicro = BigInt(Math.round(Number.parseFloat(draft.amountUsdc) * 1_000_000));
    const incidentAt = new Date(draft.incidentAt);
    const built = await buildClaimManifest(
      {
        subaccord: pass.mutual.subaccord,
        filer: mutualAddress, // §5: the filer is the mutual PDA
        mutual: mutualAddress,
        member: wallet,
        filedAt: isoSeconds(new Date()),
        title: flow.manifestTitle(isoDate(incidentAt)),
        claimContext: {
          incidentAt: isoSeconds(incidentAt),
          incidentPlace: draft.incidentPlace,
          requestedAmountUsdc: amountMicro,
          tier: tier.name,
          contributionUsdc: pass.mutual.tiers[pass.member.tier].contribution,
        },
        // every slot attached — step 3 gates Continue on the complete set.
        // A url-slot's entry carries the RAW link (no file exists).
        entries: flow.documentSlots.map((slot) =>
          slot.url === undefined
            ? { path: slot.path, sha256: draft.docs[slot.path]?.sha256 ?? "" }
            : {
                url: draft.docs[slot.path]?.url ?? "",
                sha256: draft.docs[slot.path]?.sha256 ?? "",
              },
        ),
      },
      flow.documentSlots, // the pool's policy §7 slots (ADR-0031 daemon set)
    );
    return { yaml: built.yaml, sha256: built.sha256Hex };
  };

  // Entering step 4: build the manifest once (CLAIM-WIZARD §5: never
  // re-serialize — the buffer is nonce-invariant, so nothing that happens
  // at signing can invalidate it or the member's step-4 download).
  const enterManifest = async () => {
    if (pass === null) return;
    const built = await buildManifest();
    setManifest(built);
    setStep(4);
  };

  /** One build+send attempt at `nonce` — the dispute PDA is the tx's
   * business (chain addressing), never the manifest's. */
  const attemptSign = async (buf: ManifestBuffer, nonce: bigint): Promise<FiledResult> => {
    if (hanseEnv === null || pass === null || mutualAddress === undefined) {
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
      evidenceHash: hexToBytes32(buf.sha256),
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
   * filed first — the Claim-PDA init fails) refetches the nonce and re-signs
   * the SAME manifest at the fresh nonce, EXACTLY once — the manifest is
   * address-free (ADR-0003), so the evidence hash and the member's step-4
   * download are valid regardless. NEVER re-sent after success: `filed`
   * gates every re-entry.
   */
  const signAndFile = async () => {
    if (filed !== null || manifest === null || pass === null || clusterRpc === null) return;
    setStep(6);
    setSignPhase("building");
    setNonceRace(false);
    const attemptedAt = pass.mutual.claimNonce;
    try {
      const result = await attemptSign(manifest, attemptedAt);
      setFiled(result);
      void deliverEvidence(result, manifest);
    } catch (err) {
      try {
        // nonce race? the chain's nonce moved under the attempt — re-sign
        // the same buffer at the fresh nonce, once
        if (mutualAddress === undefined) throw err;
        const fresh = await fetchMaybeMutual(clusterRpc.rpc, mutualAddress);
        const moved = fresh.exists && fresh.data.claimNonce !== attemptedAt;
        if (!moved) throw err;
        setNonceRace(true);
        setSignPhase("building");
        const result = await attemptSign(manifest, fresh.data.claimNonce);
        setFiled(result);
        void deliverEvidence(result, manifest);
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
   * Posts the buffer the claim was filed with — keyed at `result.dispute`,
   * the LANDED one (chain addressing is tx-side, ADR-0003).
   */
  const deliverEvidence = async (result: FiledResult, buf: ManifestBuffer) => {
    setStep(7);
    if (pass === null || mutualAddress === undefined) return;
    if (operator.state !== "ready") {
      setOperatorDown(true);
      setDocRows(Object.fromEntries(docPaths.map((path) => [path, "failed" as const])));
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
        manifest: new TextEncoder().encode(buf.yaml),
        operatorPub,
      });
    } catch (error) {
      // a 400 here is loud (unknown schema — never silently degraded); any
      // failure leaves delivery retryable from the app surface
      setOperatorDown(true);
      toast.error(error instanceof Error ? error.message : "Couldn't reach the operator.");
      setDocRows(Object.fromEntries(docPaths.map((path) => [path, "failed" as const])));
      return;
    }
    if (posted === "conflict") {
      // a different manifest is already stored for this dispute — the wrong
      // manifest for this claim; nothing to retry
      setConflictPath("manifest.yaml");
      return;
    }
    // url slots ride the manifest — the POST above delivered their raw link
    const urlPaths = docPaths.filter((path) => !filePaths.includes(path));
    if (urlPaths.length > 0) {
      setDocRows(Object.fromEntries(urlPaths.map((path) => [path, "delivered" as const])));
    }

    let delivered = 0;
    for (const path of filePaths) {
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
    if (delivered === filePaths.length) {
      setStep(8);
      if (mutualAddress !== undefined) {
        clearDraft(mutualAddress);
        // the #/app evidence line — the claim's full slot set (files + urls)
        recordDelivery(mutualAddress, result.nonce, docPaths);
      }
    }
  };

  const incidentIso =
    draft.incidentAt === "" ? "{{PARAM}}" : new Date(draft.incidentAt).toISOString();

  const publishRows = docPaths.map((path) => ({ path, status: docRows[path] ?? "pending" }));
  const deliveredCount = docPaths.filter((path) => docRows[path] === "delivered").length;

  if (invalidPool) return <Navigate to="/app" replace />;

  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="wizard">
      <EmergencyBanner spec={flow.emergency ?? null} />
      {pass === null || tier === null ? (
        // Step 0 — and the honest re-gate if the chain state moved under an
        // open wizard: the flow never collects past an invalid gate.
        <PreflightGate
          mutual={mutualAddress}
          poolName={listing.name}
          poolHref={poolRoute(listing)}
          onPass={() => setStep(1)}
        />
      ) : step === 1 ? (
        <StepIncident
          checks={flow.screenChecks}
          wherePlaceholder={flow.wherePlaceholder}
          narrativePlaceholder={flow.narrativePlaceholder}
          exclusionsLine={flow.exclusionsLine}
          draft={draft}
          onChange={patch}
          onBack={() => setStep(0)}
          onContinue={enterAmount}
        />
      ) : step === 2 ? (
        <StepAmount
          draft={draft}
          capUsdc={capUsdc}
          onChange={patch}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      ) : step === 3 ? (
        <StepEvidence
          slots={flow.documentSlots}
          intro={flow.evidenceIntro}
          attachAllNote={flow.attachAllNote}
          samePersonStatement={flow.samePersonStatement}
          draft={draft}
          intakes={intakes}
          onAttach={attach}
          onAttachUrl={attachUrl}
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
          capUsdc={capUsdc}
          feeMicro={pass.feeMicro}
          incidentIso={incidentIso}
          operatorAddress={pass.evidenceOperator}
          canSign={manifest !== null && hanseEnv !== null && filed === null}
          onBack={() => setStep(4)}
          onSign={() => void signAndFile()}
        />
      ) : step === 6 ? (
        <StepSign phase={signPhase} nonceRace={nonceRace} />
      ) : step === 7 && filed !== null ? (
        <StepPublish
          operatorAddress={pass.evidenceOperator}
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
          total={flow.documentSlots.length}
          feeUsd={usd(microToUsd(pass.feeMicro))}
          onDownload={() => downloadManifest(manifest.yaml)}
        />
      ) : (
        <PreflightGate
          mutual={mutualAddress}
          poolName={listing.name}
          poolHref={poolRoute(listing)}
          onPass={() => setStep(1)}
        />
      )}
    </div>
  );
}

export function FileClaimPage({ pool }: { pool?: string }) {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <>
      <SiteNav inApp />
      <main>
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="file-claim"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            {connected && account !== null ? (
              <Wizard wallet={account} pool={pool} />
            ) : (
              <WizardGate />
            )}
          </SectionBand>
        </div>
      </main>
    </>
  );
}
