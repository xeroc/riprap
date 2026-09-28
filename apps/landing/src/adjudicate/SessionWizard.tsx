// SessionWizard.tsx — the lock-step voting session (ADJUDICATION-DASHBOARD
// §4, copy doc § /app/adjudicate session): seven completion-gated steps,
// fails closed. Back-navigation free at any time; forward opens only
// through the next complete step — unverified evidence blocks step 1, an
// unanswered checklist blocks step 3, an unmade verdict blocks commit
// (spec §4 gates, restated as this machine's only law).
//
// The wizard owns the step machine and the step-0 package gate; every
// other screen is the landed step component. Data arrives by props — the
// session shell reads the chain (Round, Dispute, Claim) and runs the
// step-0 verifier (fetchJurorPackage); nothing here fetches. §8
// persistence rides the step modules' own keys (documents answers,
// checklist answers, salt bridge) — the machine re-derives completeness
// from those stores on every render, so a reload lands on the first
// incomplete step (HANDOFF §6: commit done then reload → reveal).
//
// Copy source: copy doc § /app/adjudicate steps 0 (the package gate's
// honest states) + session frame.

import { Button } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { NO_VOTE, type Round } from "@useaccord/sdk";
import { useState } from "react";

import { Settle } from "../components/Settle";
import { CommitStep } from "./CommitStep";
import {
  type DocumentSlot,
  DocumentsStep,
  documentsAnswersKey,
  documentsComplete,
} from "./DocumentsStep";
import { OutcomeStep } from "./OutcomeStep";
import { checklistComplete, loadPolicyAnswers, PolicyStep, policyAnswersKey } from "./PolicyStep";
import type { PackageVerification } from "./package";
import type { AdjudicationPolicy } from "./policy";
import { RevealStep } from "./RevealStep";
import { type VerdictChoice, VerdictStep } from "./VerdictStep";
import { saltBridgeKey } from "./vote";

/** The package gate's input: the verifier's result, the no-key honest
 * state (spec §5 — terminal until the founder's registration interface
 * lands), or null while the delivery is being fetched. */
export type PackageState = PackageVerification | { state: "no-key" } | null;

/** The step-0 gate (copy doc § step 0): honest states, fails closed —
 * `failed` is the terminal do-not-vote; nothing renders past it. */
function PackageGate({
  verification,
  manifestSha256,
  onRetry,
  onDone,
}: {
  verification: PackageState;
  manifestSha256: string | null;
  onRetry: () => void;
  onDone: () => void;
}) {
  if (verification === null) {
    return (
      <p data-num className="font-mono text-sm text-muted-foreground">
        Fetching your evidence delivery…
      </p>
    );
  }
  switch (verification.state) {
    case "no-key":
      return (
        <div className="flex max-w-xl flex-col gap-2" data-slot="no-delivery-key">
          <p className="text-ink [font:var(--riprap-body-md)]">No delivery key in this browser.</p>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
            Evidence is encrypted to a delivery key registered for your wallet. This browser doesn't
            hold it.
          </p>
        </div>
      );
    case "pending":
      return (
        <div className="flex max-w-xl flex-col gap-2" data-slot="round-incomplete">
          <p className="text-ink [font:var(--riprap-body-md)]">
            The round's evidence isn't complete yet.
          </p>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
            Jurors never see half a case.
          </p>
          <div>
            <Button variant="outline" className="w-24" onClick={onRetry}>
              Try again
            </Button>
          </div>
        </div>
      );
    case "failed":
      return (
        <div className="flex max-w-xl flex-col gap-2" data-slot="do-not-vote">
          <p className="text-ink [font:var(--riprap-body-md)]">Do not vote.</p>
          <p data-num className="break-all font-mono text-sm text-muted-foreground">
            {verification.reason}
          </p>
        </div>
      );
    case "no-evidence":
      return (
        <div className="flex max-w-xl flex-col gap-2" data-slot="no-evidence">
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
            No evidence was delivered for this round.
          </p>
          <div>
            <Button onClick={onDone}>Continue</Button>
          </div>
        </div>
      );
    case "verified":
      return (
        <div className="flex max-w-xl flex-col gap-3" data-slot="package-verified">
          <p data-num className="break-all font-mono text-sm text-ink" title={manifestSha256 ?? ""}>
            Package verified — sha256 {manifestSha256 ?? "{{PARAM}}"}
          </p>
          <div>
            <Button onClick={onDone}>Continue</Button>
          </div>
        </div>
      );
  }
}

/**
 * The composed session. The shell supplies the seat (mutual, subaccord,
 * dispute, round PDA + live Round read, wallet), the policy pack, the
 * step-0 package state (+ retry), the verified document slots, the live
 * seam reads (as-filed amount, fee credit, ruling — null renders the
 * kit's {{PARAM}} placeholders), and the clock second (the shell runs the
 * 1s tick only while a window is live, spec §2).
 */
export function SessionWizard({
  mutual,
  subaccord,
  dispute,
  roundAddress,
  round,
  wallet,
  policy,
  verification,
  manifestSha256,
  slots,
  amountMicro,
  feeEarnedMicro,
  ruling,
  nowSec,
  onRetry,
  onExit,
}: {
  mutual: Address;
  subaccord: Address;
  dispute: Address;
  roundAddress: Address;
  round: Round;
  wallet: Address;
  policy: AdjudicationPolicy;
  verification: PackageState;
  manifestSha256: string | null;
  slots: DocumentSlot[];
  amountMicro: bigint | null;
  feeEarnedMicro: bigint | null;
  ruling: VerdictChoice | null;
  nowSec: bigint;
  onRetry: () => void;
  onExit: () => void;
}) {
  const documentsKey = documentsAnswersKey(mutual, dispute, round.roundIdx);
  const policyKey = policyAnswersKey(mutual, dispute, round.roundIdx);
  const seatIdx = round.jurors.indexOf(wallet);
  const hasCommitted =
    seatIdx >= 0 &&
    round.commits[seatIdx] !== undefined &&
    round.commits[seatIdx].some((b) => b !== 0);
  const hasRevealed = seatIdx >= 0 && round.reveals[seatIdx] !== NO_VOTE;

  const [choice, setChoice] = useState<VerdictChoice | null>(null);

  const packageOpen =
    verification !== null &&
    (verification.state === "verified" || verification.state === "no-evidence");
  const stepComplete = [
    packageOpen,
    slots.length === 0 || documentsComplete(slots, documentsKey),
    checklistComplete(
      [...policy.coverageCriteria, ...policy.exclusions],
      loadPolicyAnswers(policyKey),
    ),
    choice !== null,
    hasCommitted,
    hasRevealed,
    true,
  ];

  const [current, setCurrent] = useState(() => {
    // A fresh mount (or reload) lands on the first incomplete step — the
    // §8 stores carry the answers, the chain carries commit/reveal, so
    // the machine resumes exactly where the juror left off (HANDOFF §6).
    const incomplete = stepComplete.findIndex((complete) => !complete);
    return incomplete === -1 ? 6 : incomplete;
  });

  /** A step's own completion is vouched by its onDone firing (each step
   * gates its own Continue); the machine only re-checks the steps BEFORE
   * it — persisted answers + chain flags, none of which move in this
   * handler. This is the lock-step law without stale-closure ceilings. */
  const advanceFrom = (step: number) => {
    if (stepComplete.slice(0, step).every((complete) => complete)) {
      setCurrent(step + 1);
    }
  };
  const back = () => {
    if (current > 0) {
      setCurrent(current - 1);
    } else {
      onExit();
    }
  };

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="wizard">
      {current === 0 && (
        <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="step-0">
          <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
            The evidence is checked against the hash the claim filed before anything renders.
          </p>
          <PackageGate
            verification={verification}
            manifestSha256={manifestSha256}
            onRetry={onRetry}
            onDone={() => advanceFrom(0)}
          />
          <div>
            <Button variant="outline" onClick={back}>
              Back
            </Button>
          </div>
        </div>
      )}
      {current === 1 && (
        <div data-slot="step-1">
          <DocumentsStep
            slots={slots}
            storageKey={documentsKey}
            onBack={back}
            onDone={() => advanceFrom(1)}
          />
        </div>
      )}
      {current === 2 && (
        <div data-slot="step-2">
          <PolicyStep
            criteria={policy.coverageCriteria}
            exclusions={policy.exclusions}
            storageKey={policyKey}
            onBack={back}
            onDone={() => advanceFrom(2)}
          />
        </div>
      )}
      {current === 3 && (
        <div data-slot="step-3">
          <VerdictStep
            amountMicro={amountMicro}
            note={policy.verdictNote}
            onBack={back}
            onDone={(c) => {
              setChoice(c);
              advanceFrom(3);
            }}
          />
        </div>
      )}
      {current === 4 && (
        <div data-slot="step-4">
          <CommitStep
            subaccord={subaccord}
            dispute={dispute}
            roundAddress={roundAddress}
            roundIdx={round.roundIdx}
            wallet={wallet}
            choice={choice ?? 0}
            revealEnd={round.revealEnd}
            hasCommitted={hasCommitted}
            onBack={back}
            onDone={() => advanceFrom(4)}
          />
        </div>
      )}
      {current === 5 && (
        <div data-slot="step-5">
          <RevealStep
            subaccord={subaccord}
            dispute={dispute}
            roundAddress={roundAddress}
            roundIdx={round.roundIdx}
            wallet={wallet}
            round={round}
            nowSec={nowSec}
            hasRevealed={hasRevealed}
            onBack={back}
            onDone={() => advanceFrom(5)}
          />
        </div>
      )}
      {current === 6 && (
        <div data-slot="step-6">
          <OutcomeStep
            round={round}
            ruling={ruling}
            thisChoice={choice}
            feeEarnedMicro={feeEarnedMicro}
            clearKeys={{
              documents: documentsKey,
              policy: policyKey,
              bridge: saltBridgeKey(dispute, round.roundIdx, wallet),
            }}
            onBack={back}
          />
        </div>
      )}
    </Settle>
  );
}
