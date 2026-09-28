// OutcomeStep.tsx — wizard step 6 OUTCOME (ADJUDICATION-DASHBOARD §4/§8,
// copy doc § /app/adjudicate step 6): the per-seat reveals, the tally, the
// ruling stamp, the fee direction for the claim, this seat's pay, and the
// closing line — review ends with the dispute. On outcome the step clears
// every session artifact (§8): the documents ticks, the checklist answers,
// and the salt bridge, all keyed to this dispute.
//
// Labels never render a third option: rows and ruling read the hanse-opt/v1
// recipe through VERDICT_OPTIONS (Approve = 0, Deny = 1); unrevealed seats
// count for neither and show the em dash. Copy source: copy doc §
// /app/adjudicate step 6; fee direction verbatim with the wizard's REVIEW.

import { AddressChip, BadgeStamp, Button, usd } from "@riprap/ui";
import type { Round } from "@useaccord/sdk";
import { useEffect } from "react";
import { Settle } from "../components/Settle";
import { microToUsd } from "../pool/mutual";
import { clearDocumentsAnswers } from "./DocumentsStep";
import { clearPolicyAnswers } from "./PolicyStep";
import { tallyOf } from "./useSeats";
import { VERDICT_OPTIONS, type VerdictChoice } from "./VerdictStep";
import { clearSaltBridge } from "./vote";

/** The option label for a revealed seat (recipe constant; NO_VOTE → dash). */
function choiceLabel(reveal: bigint): string {
  if (reveal !== 0n && reveal !== 1n) return "—";
  return VERDICT_OPTIONS[Number(reveal)].label;
}

/** The ruling stamps (copy doc § step 6: `Approved` / `Denied` — past
 * tense, distinct from the recipe's option labels). */
const RULING_STAMPS = ["Approved", "Denied"] as const;
/**
 * The step body. The session shell supplies the live Round read (panel +
 * reveals), the ruling (round result / dispute finalRuling once finalized;
 * null renders {{PARAM}} — the outcome screen shows once ruling exists),
 * this seat's own revealed choice (for the slashing line), the seat's fee
 * credit (a live read; null renders {{PARAM}}), and the §8 storage keys to
 * clear. Terminal — no forward nav; back returns to the session.
 */
export function OutcomeStep({
  round,
  ruling,
  thisChoice,
  feeEarnedMicro,
  clearKeys,
  onBack,
}: {
  round: Round;
  ruling: VerdictChoice | null;
  thisChoice: VerdictChoice | null;
  feeEarnedMicro: bigint | null;
  clearKeys: { documents: string; policy: string; bridge: string };
  onBack: () => void;
}) {
  // §8: answers and the salt bridge clear with the outcome — once, on
  // mount (the outcome is terminal; re-entry reads nothing).
  useEffect(() => {
    clearDocumentsAnswers(clearKeys.documents);
    clearPolicyAnswers(clearKeys.policy);
    clearSaltBridge(clearKeys.bridge);
  }, [clearKeys]);

  const tally = tallyOf(round);
  const slashed = ruling !== null && thisChoice !== null && thisChoice !== ruling;

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <div className="flex max-w-xl flex-col gap-2" data-slot="seat-reveals">
        {round.jurors.slice(0, round.jurorCount).map((juror, i) => (
          <p key={juror} data-num className="font-mono text-sm text-body">
            <AddressChip address={juror} /> — {choiceLabel(round.reveals[i] ?? 0n)}
          </p>
        ))}
      </div>
      <p data-num className="font-mono text-sm text-ink">
        {tally.approve} approve · {tally.deny} deny
      </p>
      <h3>
        <BadgeStamp data-num>{ruling === null ? "{{PARAM}}" : RULING_STAMPS[ruling]}</BadgeStamp>
      </h3>
      <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        Denied: the fee is kept. Approved: refunded with the payment. Failed adjudication: returned.
      </p>
      <p data-num className="font-mono text-sm text-ink">
        This seat paid {feeEarnedMicro === null ? "{{PARAM}}" : usd(microToUsd(feeEarnedMicro))}{" "}
        USDC.
      </p>
      {slashed && (
        <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          Ruled against the coherent majority — stake lost to the jurors who ruled with it.
        </p>
      )}
      <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        Review ends with this dispute — the evidence is deleted after the ruling's retention window.
      </p>
      <div>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </Settle>
  );
}
