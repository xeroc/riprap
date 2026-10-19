// steps.tsx — the #/create wizard's DEPLOY / PUBLISH / VERIFY step bodies
// (copy doc § /create; every string verbatim from there). DEPLOY builds one
// initialize_mutual through @riprap/hanse and sends it via the shared
// sendInstruction seam (wallet signs, pays rent + fees); PUBLISH PUTs the
// exact doc bytes at the derived ref (hash-gated proof mode) with an
// explicit skip; VERIFY reads the bytes back and hands the pool link.

import {
  findAssociatedTokenAddress,
  findFeeFloatPda,
  findMutualPda,
  findMutualSubaccordPda,
  findPoolPda,
  findSasCredentialPda,
  findSasSchemaPda,
  getInitializeMutualInstructionAsync,
  SAS_PROGRAM_ADDRESS,
} from "@riprap/hanse";
import { BadgeStamp, Button, TextLink } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { Link2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { ConnectWalletButton } from "../app/controls";
import { Settle } from "../components/Settle";
import { sha256Hex } from "../pool/domainRef";
import { useClusterEvidenceOperator, useEvidenceDaemonUrl } from "../pool/evidenceServer";
import { useHanseEnv } from "../shared/rpc";
import { describeError, sendInstruction } from "../shared/transaction";
import {
  type Deployed,
  preimageHex,
  putDocument,
  subaccordArgs,
  tierArgs,
  verifyDocument,
  windowArgs,
} from "./deploy";
import type { CreateDraft } from "./draft";

type DeployPhase = "review" | "building" | "wallet-signing" | "confirming";
type PublishState = "idle" | "uploading" | "done" | { failed: string };
type VerifyState = "reading" | "match" | "mismatch" | "unreachable";

/** hex → 32 bytes (the policy-hash hex this file carries around). */
function hexToBytes32(hex: string): Uint8Array {
  return Uint8Array.from({ length: 32 }, (_, i) =>
    Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16),
  );
}

/** Copy-link button — the ShareRow pattern (clipboard + icon, no address
 * shortening: the pool URL is meant to be copied whole). */
function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      aria-label="Copy link"
      onClick={() => {
        navigator.clipboard
          ?.writeText(url)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            // clipboard denied — the URL renders beside the button anyway
          });
      }}
    >
      <Link2Icon className="size-4" />
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

// ─── DEPLOY ─────────────────────────────────────────────────────────────────

/** The anchors row the review shows (the preview's exact values, frozen). */
function DeployAnchors({ hash, ref, seed }: { hash: string; ref: string; seed: bigint }) {
  return (
    <div className="flex flex-col gap-2" data-slot="deploy-anchors">
      <p data-num className="break-all font-mono text-sm text-ink">
        sha256 {hash}
      </p>
      <p data-num className="break-all font-mono text-sm text-ink">
        domain ref {ref}
      </p>
      <p data-num className="break-all font-mono text-sm text-ink">
        seed {seed.toString()}
      </p>
    </div>
  );
}

export function DeployStep({
  walletConnected,
  walletAddress,
  draft,
  blocking,
  doc,
  hash,
  ref,
  seed,
  onFix,
  onDeployed,
}: {
  walletConnected: boolean;
  walletAddress: string | null;
  draft: CreateDraft;
  /** The first gate that still rejects, with the screen that owns it. */
  blocking: { label: string; line: string } | null;
  /** The exact previewed bytes — frozen into the deployed record. */
  doc: string;
  hash: string;
  ref: string;
  seed: bigint;
  onFix: () => void;
  onDeployed: (deployed: Deployed) => void;
}) {
  const hanseEnv = useHanseEnv();
  const clusterOperator = useClusterEvidenceOperator();
  const [phase, setPhase] = useState<DeployPhase>("review");
  const [error, setError] = useState<string | null>(null);

  // The invalid state: the first blocking gate line (copy doc — the chain
  // fails with the same words, so the wizard shows them first).
  if (blocking !== null) {
    return (
      <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" delay={180}>
        <h2 tabIndex={-1} className="focus:outline-none">
          <BadgeStamp>Deploy</BadgeStamp>
        </h2>
        <div className="flex max-w-xl flex-col items-start gap-2" data-slot="deploy-blocked">
          <p className="text-ink [font:var(--riprap-body-md)]">{blocking.line}</p>
          <Button variant="outline" onClick={onFix}>
            Fix it in the {blocking.label.toLowerCase()} step.
          </Button>
        </div>
      </Settle>
    );
  }

  if (!walletConnected || walletAddress === null) {
    return (
      <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" delay={180}>
        <h2 tabIndex={-1} className="focus:outline-none">
          <BadgeStamp>Deploy</BadgeStamp>
        </h2>
        <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          Deploying needs a wallet — the pool is created by one signature from it.
        </p>
        <ConnectWalletButton size="lg" data-participate label="Connect a wallet" />
      </Settle>
    );
  }

  const deploy = async () => {
    if (hanseEnv === null) {
      setError("Couldn't reach the cluster.");
      return;
    }
    setError(null);
    setPhase("building");
    try {
      const hashBytes = hexToBytes32(hash);
      const [mutual] = await findMutualPda({ seed });
      const [pool] = await findPoolPda({ seed });
      const treasury = await findAssociatedTokenAddress(draft.advanced.mint as Address, pool);
      const [subaccord] = await findMutualSubaccordPda({
        creator: walletAddress as Address,
        seed,
        policyHash: hashBytes,
      });
      const [feeFloat] = await findFeeFloatPda({
        mutual,
        feeMint: draft.advanced.mint as Address,
      });
      const [credential] = await findSasCredentialPda({ mutual });
      const [schema] = await findSasSchemaPda({ credential });
      const instruction = await getInitializeMutualInstructionAsync({
        authority: hanseEnv.signer,
        rentPayer: hanseEnv.signer,
        mutual,
        pool,
        treasury,
        subaccord,
        credential,
        schema,
        depositMint: draft.advanced.mint as Address,
        feeMint: draft.advanced.mint as Address,
        feeFloat,
        seed,
        tiers: tierArgs(draft.def),
        policyHash: hashBytes,
        ...windowArgs(draft.def),
        subaccordArg: subaccordArgs(draft.advanced, (clusterOperator || walletAddress) as Address),
        sasProgram: SAS_PROGRAM_ADDRESS,
      });
      setPhase("wallet-signing");
      const signature = await sendInstruction(
        hanseEnv.rpc,
        hanseEnv.rpcSubscriptions,
        hanseEnv.signer,
        [instruction],
        () => setPhase("confirming"),
      );
      onDeployed({ signature, mutual, subaccord, seed, ref, hash, doc });
    } catch (err) {
      setError(describeError(err));
      setPhase("review");
    }
  };

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" delay={180}>
      <h2 tabIndex={-1} className="focus:outline-none">
        <BadgeStamp>Deploy</BadgeStamp>
      </h2>
      <DeployAnchors hash={hash} ref={ref} seed={seed} />
      <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
        Your wallet pays the rent for the pool&apos;s on-chain accounts plus the transaction fee,
        and confirms the exact cost before signing.
      </p>
      {phase === "review" ? (
        <Button data-participate onClick={() => void deploy()}>
          Deploy the pool
        </Button>
      ) : (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]" data-slot="deploy-phase">
          {phase === "building"
            ? "Building the transaction…"
            : phase === "wallet-signing"
              ? "Waiting for your wallet…"
              : "Confirming…"}
        </p>
      )}
      {error !== null ? (
        <div className="flex max-w-xl flex-col gap-2" data-slot="deploy-error">
          <p className="text-ink [font:var(--riprap-body-md)]">{error}</p>
          <Button variant="outline" className="w-28" onClick={() => void deploy()}>
            Try again
          </Button>
        </div>
      ) : null}
    </Settle>
  );
}

// ─── PUBLISH ────────────────────────────────────────────────────────────────

export function PublishStep({
  deployed,
  onPublished,
  onSkipped,
}: {
  deployed: Deployed;
  onPublished: () => void;
  onSkipped: () => void;
}) {
  const daemonBase = useEvidenceDaemonUrl();
  const [state, setState] = useState<PublishState>("idle");

  const publish = async () => {
    setState("uploading");
    const hashBytes = hexToBytes32(deployed.hash);
    const result = await putDocument(
      fetch,
      daemonBase,
      deployed.ref,
      deployed.subaccord,
      preimageHex(deployed.seed, hashBytes),
      new TextEncoder().encode(deployed.doc),
    );
    if (result.ok) {
      setState("done");
      onPublished();
    } else {
      setState({ failed: result.line });
    }
  };

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" delay={180}>
      <h2 tabIndex={-1} className="focus:outline-none">
        <BadgeStamp>Publish</BadgeStamp>
      </h2>
      <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
        The pool is live. Publish its terms document — the hash-gated store takes the exact
        previewed bytes.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <TextLink href={`#/m/${deployed.mutual}`} className="font-mono text-xs">
          Mutual {deployed.mutual}
        </TextLink>
        <span data-num className="font-mono text-xs text-muted-foreground">
          tx {deployed.signature}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button data-participate onClick={() => void publish()} disabled={state === "uploading"}>
          Publish the document
        </Button>
        {state === "uploading" ? (
          <p
            data-num
            className="break-all font-mono text-xs text-muted-foreground"
            data-slot="publishing"
          >
            Publishing to {daemonBase}/domains/{deployed.ref}…
          </p>
        ) : null}
        {state === "done" ? <p data-slot="published">Published.</p> : null}
        {typeof state === "object" ? (
          <div className="flex max-w-xl flex-col gap-2" data-slot="publish-failed">
            <p className="text-ink [font:var(--riprap-body-md)]">{state.failed}</p>
            <Button variant="outline" className="w-24" onClick={() => void publish()}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex max-w-xl flex-col gap-2 border-t border-hairline pt-4">
        <Button variant="outline" size="sm" onClick={onSkipped}>
          Publish later
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The terms can be published any time from the pool page&apos;s terms panel with the
          downloaded document.
        </p>
      </div>
    </Settle>
  );
}

// ─── VERIFY ─────────────────────────────────────────────────────────────────

export function VerifyStep({ deployed, onDone }: { deployed: Deployed; onDone: () => void }) {
  const daemonBase = useEvidenceDaemonUrl();
  const [state, setState] = useState<VerifyState>("reading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await verifyDocument(
        fetch,
        daemonBase,
        deployed.ref,
        deployed.hash,
        sha256Hex,
      );
      if (!cancelled) setState(result.state);
    })();
    return () => {
      cancelled = true;
    };
  }, [daemonBase, deployed.ref, deployed.hash]);

  const poolUrl = `${window.location.origin}${window.location.pathname}#/m/${deployed.mutual}`;

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" delay={180}>
      <h2 tabIndex={-1} className="focus:outline-none">
        <BadgeStamp>Verify</BadgeStamp>
      </h2>
      {state === "reading" ? (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading the document back…
        </p>
      ) : state === "match" ? (
        <>
          <p className="text-ink [font:var(--riprap-body-md)]" data-slot="verified">
            The document reads back exact.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button data-participate asChild>
              <a href={`#/m/${deployed.mutual}`}>Open the pool page</a>
            </Button>
            <CopyLinkButton url={poolUrl} />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Share the pool page — its terms travel with it.
          </p>
        </>
      ) : state === "mismatch" ? (
        <p className="text-ink [font:var(--riprap-body-md)]" data-slot="verify-mismatch">
          The document at this address doesn&apos;t match the previewed bytes. Nothing was
          overwritten.
        </p>
      ) : (
        <p className="text-ink [font:var(--riprap-body-md)]">The daemon is unreachable.</p>
      )}
      <div>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </div>
    </Settle>
  );
}
