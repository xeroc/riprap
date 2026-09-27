// VerdictStep.tsx — wizard step 3 VERDICT (ADJUDICATION-DASHBOARD §4/§5,
// copy doc § /app/adjudicate step 3): the amount as filed (mono — the
// chain clamps the tier, the cap is the chain's job), the policy pack's
// verdictNote restating overpriced ⇒ Deny (the policy §4 tier-max
// exclusion lands here, not in the checklist), and the binary choice.
// Option labels come from the filed recipe constant — hanse-opt/v1:
// Approve = 0, Deny = 1 (programs/hanse/src/instructions/file_claim.rs
// ::option_label; deterministic, no filer salt) — never authored in code.
// No third option, no amount edit. Back free; a choice advances to COMMIT
// carrying its option index (the reveal preimage pairs it with the salt).

import { Button, usd } from "@riprap/ui";
import { Settle } from "../components/Settle";
import { microToUsd } from "../pool/mutual";

/** hanse-opt/v1 (spec §5, file_claim.rs::option_label): the option recipe
 * every riprap claim files with. The surface labels the options from this
 * constant and cites it; Approve = 0, Deny = 1. */
export const VERDICT_OPTIONS = [
  { index: 0, label: "Approve" },
  { index: 1, label: "Deny" },
] as const;

/** A committed choice — an index into VERDICT_OPTIONS / the on-chain
 * option list (Approve = 0, Deny = 1). */
export type VerdictChoice = 0 | 1;

/**
 * The step body. The session shell supplies the as-filed claim amount
 * (micro USDC — null renders the kit's {{PARAM}} placeholder until the
 * chain answers), the pack's verdictNote, and the step-boundary
 * callbacks; onDone carries the chosen option index.
 */
export function VerdictStep({
  amountMicro,
  note,
  onBack,
  onDone,
}: {
  amountMicro: bigint | null;
  note: string;
  onBack: () => void;
  onDone: (choice: VerdictChoice) => void;
}) {
  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <p data-num className="font-mono text-body text-ink">
        Requested: {amountMicro === null ? "{{PARAM}}" : usd(microToUsd(amountMicro))} USDC
      </p>
      <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        {note}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {VERDICT_OPTIONS.map((option) => (
          <Button key={option.index} onClick={() => onDone(option.index)}>
            {option.label}
          </Button>
        ))}
      </div>
    </Settle>
  );
}
