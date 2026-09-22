// #/app/file-claim — the payout-request wizard (CLAIM-WIZARD v1, copy doc §
// /app/file-claim): wallet gate → step 0 preflight (chain gates only) →
// incident → amount → evidence → manifest → review. Steps 6–8 (sign,
// publish, filed) land with the next lane bean; this page owns the machine
// and the draft (localStorage, form fields + hashes only — CLAIM-WIZARD §4).
// Every string is copy-doc verbatim; numbers come from the chain reads in
// useClaimPreflight, never constants; numerals mono.

import { findClaimPda } from "@riprap/hanse";
import { Button, HexBackdrop, SectionBand, TextLink, usd } from "@riprap/ui";
import { useCluster, useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { findDisputePda } from "@useaccord/sdk";
import { useEffect, useRef, useState } from "react";

import { Settle } from "../../components/Settle";
import { SiteNav } from "../../components/SiteNav";
import { formatUtc, microToUsd, poolTiers, resolveMutualAddress } from "../../pool/mutual";
import { useClusterRpc } from "../../shared/rpc";
import { AppNavControls, ClusterSwitch, ConnectWalletButton } from "../AppPage";
import { intakeDocument } from "./documents";
import { type ClaimDraft, type DocSlot, emptyDraft, loadDraft, saveDraft } from "./draft";
import { buildManifest, manifestEntries } from "./manifest";
import {
  EmergencyBanner,
  type SlotIntake,
  StepAmount,
  StepEvidence,
  StepIncident,
  StepManifest,
  StepReview,
} from "./steps";
import { type PreflightBlock, type PreflightPass, useClaimPreflight } from "./useClaimPreflight";
import { useEvidenceOperator } from "./useEvidenceOperator";

/** Steps this page owns — 6/7/8 (sign/publish/filed) join with their bean. */
type Step = 0 | 1 | 2 | 3 | 4 | 5;

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

/** The wizard machine: step 0 gates, steps 1–5 collect, one draft, one buffer. */
function Wizard({ wallet }: { wallet: Address }) {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const mutualAddress = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const clusterRpc = useClusterRpc();

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
  // hash, and download (CLAIM-WIZARD §5: never re-serialize).
  const enterManifest = async () => {
    if (pass === null || tier === null || mutualAddress === undefined) return;
    const nonce = pass.mutual.claimNonce;
    const [claim] = await findClaimPda({ mutual: mutualAddress, nonce });
    const [dispute] = await findDisputePda({ filer: mutualAddress, nonce });
    const amountMicro = BigInt(Math.round(Number.parseFloat(draft.amountUsdc) * 1_000_000));
    const built = await buildManifest({
      dispute,
      subaccord: pass.mutual.subaccord,
      mutual: mutualAddress,
      member: wallet,
      claim,
      filedAt: new Date(),
      incidentAt: new Date(draft.incidentAt),
      incidentPlace: draft.incidentPlace,
      requestedAmountUsdc: amountMicro,
      tier: tier.name,
      contributionUsdc: pass.mutual.tiers[pass.member.tier].contribution,
      entries: manifestEntries(draft.docs),
    });
    setManifest(built);
    setStep(4);
  };

  const incidentIso =
    draft.incidentAt === "" ? "{{PARAM}}" : new Date(draft.incidentAt).toISOString();

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
