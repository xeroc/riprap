// steps.tsx — the wizard's step bodies 1–5 (CLAIM-WIZARD §4; copy doc §
// /app/file-claim steps INCIDENT/AMOUNT/EVIDENCE/MANIFEST/REVIEW — every
// string rendered verbatim from there). Step 0 (the preflight gate) lives in
// FileClaimPage — it renders hook states, not form fields. Kit chrome only;
// numbers render from chain reads (props, never invented); numerals mono.

import {
  AddressChip,
  BadgeStamp,
  Button,
  buttonVariants,
  Checkbox,
  Input,
  Label,
  Textarea,
  TextLink,
  usd,
} from "@riprap/ui";
import { Settle } from "../../components/Settle";
import { microToUsd, type PoolTier } from "../../pool/mutual";
import type { ClaimDraft, DocSlot } from "./draft";
import { DOC_SLOTS } from "./draft";

/** The emergency banner — leads every step (copy doc § /app/file-claim). */
export function EmergencyBanner() {
  return (
    <div
      data-slot="emergency-banner"
      className="flex max-w-3xl flex-col gap-2 border border-hairline bg-card px-4 py-3"
    >
      <p className="uppercase tracking-(--riprap-tracking-stamp) text-accent [font:var(--riprap-mono-label)]">
        First
      </p>
      <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">
        Get care and police first. In an emergency call{" "}
        <span data-num className="font-mono">
          999
        </span>{" "}
        (UK) or{" "}
        <span data-num className="font-mono">
          112
        </span>{" "}
        (EU). Report the assault as soon as you safely can — the police report is one of{" "}
        <TextLink href="#/2026-breakpoint-blade-pool">the five required proofs</TextLink>.
      </p>
    </div>
  );
}

/** The step rail stamp — `STEP n OF 5 — NAME` (uppercase mono law). */
export function StepStamp({ n, name }: { n: number; name: string }) {
  return (
    <h2>
      <BadgeStamp data-num>
        Step {n} of 5 — {name}
      </BadgeStamp>
    </h2>
  );
}

interface StepFrameProps {
  n: number;
  name: string;
  children: React.ReactNode;
}

/** Shared step frame: settle-in content under the rail stamp. */
export function StepFrame({ n, name, children }: StepFrameProps) {
  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <StepStamp n={n} name={name} />
      {children}
    </Settle>
  );
}

// --- shared nav -------------------------------------------------------------

/** Back + Continue; Continue settles disabled-until-complete (no fade). */
export function StepNav({
  complete,
  onBack,
  onContinue,
}: {
  complete: boolean;
  onBack?: () => void;
  onContinue?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={onBack}>
        Back
      </Button>
      <Button disabled={!complete} onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}

// --- step 1: INCIDENT -------------------------------------------------------

const SCREEN_FIELDS = [
  { key: "blade", label: "Another person used a knife or blade against me" },
  { key: "window", label: "It happened during the coverage window" },
  { key: "area", label: "It happened inside the covered area" },
  { key: "injury", label: "It caused bodily injury" },
] as const;

export function StepIncident({
  draft,
  onChange,
  onBack,
  onContinue,
}: {
  draft: ClaimDraft;
  onChange: (patch: Partial<ClaimDraft>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const screenComplete = SCREEN_FIELDS.every((f) => draft.screen[f.key]);
  const fieldsComplete =
    draft.incidentAt !== "" && draft.incidentPlace !== "" && draft.narrative !== "";
  return (
    <StepFrame n={1} name="Incident">
      <div className="flex max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="incident-when">When</Label>
          <Input
            id="incident-when"
            type="datetime-local"
            value={draft.incidentAt}
            onChange={(e) => onChange({ incidentAt: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="incident-where">Where</Label>
          <Input
            id="incident-where"
            placeholder="in or around the venue and the designated event area"
            value={draft.incidentPlace}
            onChange={(e) => onChange({ incidentPlace: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="incident-what">What happened</Label>
          <Textarea
            id="incident-what"
            rows={5}
            placeholder="free text — it feeds the statutory declaration"
            value={draft.narrative}
            onChange={(e) => onChange({ narrative: e.target.value })}
          />
        </div>
      </div>
      <div className="flex max-w-xl flex-col gap-3">
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Check what applies — a screen, not a verdict; the jury rules on the evidence.
        </p>
        {SCREEN_FIELDS.map((field) => (
          <label
            key={field.key}
            htmlFor={`screen-${field.key}`}
            className="flex items-start gap-3 text-body [font:var(--riprap-body-sm)]"
          >
            <Checkbox
              id={`screen-${field.key}`}
              checked={draft.screen[field.key]}
              onChange={(e) =>
                onChange({ screen: { ...draft.screen, [field.key]: e.target.checked } })
              }
            />
            <span>{field.label}</span>
          </label>
        ))}
        <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          Not covered: injuries you caused yourself, accidents, ordinary knife handling, consensual
          activities, incidents outside the window or area, distress without qualifying injury.
        </p>
      </div>
      <StepNav
        complete={screenComplete && fieldsComplete}
        onBack={onBack}
        onContinue={onContinue}
      />
    </StepFrame>
  );
}

// --- step 2: AMOUNT ---------------------------------------------------------

export function StepAmount({
  draft,
  tier,
  onChange,
  onBack,
  onContinue,
}: {
  draft: ClaimDraft;
  tier: PoolTier;
  onChange: (patch: Partial<ClaimDraft>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const amount = Number.parseFloat(draft.amountUsdc);
  const overCap = Number.isFinite(amount) && amount > tier.cap;
  const valid = Number.isFinite(amount) && amount > 0 && !overCap;
  return (
    <StepFrame n={2} name="Amount">
      <div className="flex max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Requested payout (USDC)</Label>
          <Input
            id="amount"
            inputMode="decimal"
            data-num
            aria-invalid={overCap || undefined}
            className="font-mono"
            value={draft.amountUsdc}
            onChange={(e) => onChange({ amountUsdc: e.target.value })}
          />
          <p data-num className="font-mono text-sm text-muted-foreground">
            Your cap: {usd(tier.cap)}
          </p>
          {overCap ? (
            <p className="text-error [font:var(--riprap-body-sm)]">
              Above your cap —{" "}
              <span data-num className="font-mono">
                {usd(tier.cap)}
              </span>{" "}
              USDC is the most this membership can request.
            </p>
          ) : null}
        </div>
        <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          The chain clamps the request to your cap. The jury sees the amount — an overpriced claim
          can be denied outright.
        </p>
      </div>
      <StepNav complete={valid} onBack={onBack} onContinue={onContinue} />
    </StepFrame>
  );
}

// --- step 3: EVIDENCE -------------------------------------------------------

/** Per-slot intake result — file bytes stay in the page's session map. */
export interface SlotIntake {
  sha256: string;
  fileName: string;
  error?: string;
}

export function StepEvidence({
  draft,
  intakes,
  onAttach,
  onAttest,
  onBack,
  onContinue,
}: {
  draft: ClaimDraft;
  intakes: Record<string, SlotIntake>;
  onAttach: (slot: DocSlot, file: File) => Promise<void>;
  onAttest: (checked: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const allAttached = DOC_SLOTS.every((slot) => intakes[slot.path] !== undefined);
  return (
    <StepFrame n={3} name="Evidence">
      <p className="max-w-xl leading-relaxed text-body [font:var(--riprap-body-sm)]">
        Five documents, in this order. All five are required — an incomplete set is not adjudicated.
      </p>
      <ul className="flex max-w-3xl flex-col">
        {DOC_SLOTS.map((slot) => {
          const intake = intakes[slot.path];
          return (
            <li
              key={slot.path}
              data-slot="evidence-slot"
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline py-3 first:border-t"
            >
              <span data-num className="w-64 font-mono text-sm text-ink">
                {slot.path}
              </span>
              <span className="text-muted-foreground [font:var(--riprap-body-sm)]">
                {slot.label}
              </span>
              <span className="ml-auto flex items-center gap-3">
                {intake && !intake.error ? (
                  <span data-num className="font-mono text-xs text-stone" title={intake.sha256}>
                    sha256 {intake.sha256.slice(0, 16)}…
                  </span>
                ) : null}
                <label className={buttonVariants({ variant: "outline" })}>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg,.heic,.heif,image/jpeg,image/png,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onAttach(slot, file);
                      e.target.value = "";
                    }}
                  />
                  {intake && !intake.error ? "Replace" : "Attach"}
                </label>
              </span>
              {intake?.error ? (
                <p className="w-full text-sm text-error [font:var(--riprap-body-sm)]">
                  {intake.error}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          JPEG, PNG, or PDF, up to 10 MiB each. HEIC photos are converted before hashing.
        </p>
        <label
          htmlFor="same-person"
          className="flex items-start gap-3 text-body [font:var(--riprap-body-sm)]"
        >
          <Checkbox
            id="same-person"
            checked={draft.samePerson}
            onChange={(e) => onAttest(e.target.checked)}
          />
          <span>
            The ticket, the ID, and the declaration must all be yours — the person named on this
            membership.
          </span>
        </label>
        {!allAttached || !draft.samePerson ? (
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Attach all five to continue.
          </p>
        ) : null}
      </div>
      <StepNav complete={allAttached && draft.samePerson} onBack={onBack} onContinue={onContinue} />
    </StepFrame>
  );
}

// --- step 4: MANIFEST -------------------------------------------------------

export function StepManifest({
  yaml,
  sha256,
  onDownload,
  onBack,
  onContinue,
}: {
  yaml: string;
  sha256: string;
  onDownload: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepFrame n={4} name="Manifest">
      <p className="max-w-xl leading-relaxed text-body [font:var(--riprap-body-sm)]">
        One file describes the whole request — read it before signing.
      </p>
      <pre
        data-slot="manifest-preview"
        className="max-w-3xl overflow-x-auto border border-hairline bg-card p-4 font-mono text-xs leading-relaxed text-body"
      >
        {yaml}
      </pre>
      <div className="flex max-w-3xl flex-col gap-3">
        <p data-slot="manifest-hash" data-num className="font-mono text-sm text-ink" title={sha256}>
          sha256 {sha256}
        </p>
        <div>
          <Button variant="outline" onClick={onDownload}>
            Download manifest.yaml
          </Button>
        </div>
        <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          This download is your recovery copy — keep it until the claim settles. It re-attaches your
          evidence if delivery ever fails.
        </p>
      </div>
      <StepNav complete onBack={onBack} onContinue={onContinue} />
    </StepFrame>
  );
}

// --- step 5: REVIEW ---------------------------------------------------------

function SummaryRow({ label, mono }: { label: string; mono: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-2 first:border-t">
      <dt className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
        {label}
      </dt>
      <dd data-num className="font-mono text-sm text-ink">
        {mono}
      </dd>
    </div>
  );
}

export function StepReview({
  draft,
  tier,
  feeMicro,
  minJurySize,
  feePerJuror,
  incidentIso,
  operatorAddress,
  canSign,
  onBack,
  onSign,
}: {
  draft: ClaimDraft;
  tier: PoolTier;
  feeMicro: bigint;
  minJurySize: number;
  feePerJuror: bigint;
  incidentIso: string;
  /** sub.evidence_operator — the operator IS this pubkey; presented truncated. */
  operatorAddress: string;
  /** Signing needs the signer env + operator resolution (or {{PARAM}} risk). */
  canSign: boolean;
  onBack: () => void;
  onSign: () => void;
}) {
  const amount = Number.parseFloat(draft.amountUsdc);
  return (
    <StepFrame n={5} name="Review">
      <div className="flex max-w-3xl flex-col gap-2">
        <p data-num className="font-mono text-base text-ink">
          Juror fee {usd(microToUsd(feeMicro))} USDC — {minJurySize} jurors at{" "}
          {usd(microToUsd(feePerJuror))} USDC each, pre-paid from your USDC.
        </p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Denied: the fee is kept. Approved: refunded with the payment. Failed adjudication:
          returned.
        </p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          You'll also need SOL for network fees.
        </p>
      </div>
      <dl className="flex max-w-3xl flex-col gap-2">
        <SummaryRow label="Requested" mono={Number.isFinite(amount) ? usd(amount) : "{{PARAM}}"} />
        <SummaryRow label="Your cap" mono={usd(tier.cap)} />
        <SummaryRow label="Incident" mono={incidentIso} />
        <SummaryRow label="Where" mono={draft.incidentPlace || "{{PARAM}}"} />
      </dl>
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          If approved claims exceed the pool, payouts are reduced proportionally — the pool never
          pays more than it holds.
        </p>
        <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          A denial can be appealed within the adjudication protocol — each round draws a fresh jury.
        </p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          One open claim per member.
        </p>
        <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          Evidence is encrypted for <AddressChipInline value={operatorAddress} />, the pool's
          evidence operator, and delivered there for the jury.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {/* copy doc § SIGN: the review's single action starts the wallet tx */}
        <Button disabled={!canSign} onClick={onSign}>
          Sign and file
        </Button>
      </div>
    </StepFrame>
  );
}

// --- step 6: SIGN -----------------------------------------------------------

export type SignPhase = "building" | "wallet-signing" | "confirming";

const SIGN_PHASE_LINES: Record<SignPhase, string> = {
  building: "Building the transaction…",
  "wallet-signing": "Waiting for your wallet…",
  confirming: "Confirming…",
};

export function StepSign({ phase, nonceRace }: { phase: SignPhase; nonceRace: boolean }) {
  return (
    <StepFrame n={6} name="Sign">
      <div className="flex max-w-3xl flex-col gap-2" data-slot="sign-phase">
        <p className="text-body [font:var(--riprap-body-md)]">{SIGN_PHASE_LINES[phase]}</p>
        {nonceRace ? (
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]" data-slot="nonce-race">
            Another member filed first — the claim number moved. Sign once more.
          </p>
        ) : null}
      </div>
    </StepFrame>
  );
}

// --- step 7: PUBLISH --------------------------------------------------------

export type DocRowStatus = "pending" | "delivering" | "retrying" | "delivered" | "failed";

export function StepPublish({
  operatorAddress,
  rows,
  conflictPath,
  unreachable,
}: {
  /** sub.evidence_operator — presented truncated, never a full dump. */
  operatorAddress: string;
  rows: Array<{ path: string; status: DocRowStatus }>;
  /** A 409 leaf — hard stop, nothing overwritten. */
  conflictPath?: string;
  /** Operator unreachable after the tx landed — delivery keeps retrying. */
  unreachable?: boolean;
}) {
  return (
    <StepFrame n={7} name="Publish">
      <div className="flex max-w-3xl flex-col gap-2" data-slot="publish">
        <p className="text-body [font:var(--riprap-body-md)]">
          Filing confirmed. Delivering evidence to <AddressChipInline value={operatorAddress} />…
        </p>
        <ul className="flex max-w-3xl flex-col">
          {rows.map((row) => (
            <li
              key={row.path}
              data-slot="publish-row"
              className="flex items-baseline justify-between gap-4 border-b border-hairline py-2 first:border-t"
            >
              <span data-num className="font-mono text-sm text-ink">
                {row.path}
              </span>
              <span
                data-num={row.status === "delivered" || row.status === "failed" ? true : undefined}
                className="font-mono text-xs text-stone"
              >
                {row.status === "pending" ? "delivering" : row.status}
              </span>
            </li>
          ))}
        </ul>
        {conflictPath !== undefined ? (
          <p
            className="max-w-[42rem] leading-relaxed text-error [font:var(--riprap-body-sm)]"
            data-slot="publish-conflict"
          >
            The operator already holds a different file under{" "}
            <span data-num className="font-mono">
              {conflictPath}
            </span>
            . Nothing was overwritten. Re-attach the exact document from this request.
          </p>
        ) : null}
        {unreachable ? (
          <p
            className="max-w-[42rem] leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]"
            data-slot="publish-unreachable"
          >
            Couldn't reach the operator. Your claim is on-chain — delivery keeps retrying, and the
            review window is 48 hours. Keep manifest.yaml; if this page closes, re-enter from the
            app surface.
          </p>
        ) : null}
      </div>
    </StepFrame>
  );
}

// --- step 8: FILED ----------------------------------------------------------

const ROUND_TIMELINE =
  "draw → review 48h → commit 12h → reveal 12h → ruling → appeal 48h → settle → pull";

export function StepFiled({
  nonce,
  claim,
  dispute,
  delivered,
  feeUsd,
  onDownload,
}: {
  nonce: bigint;
  claim: string;
  dispute: string;
  /** How many of the five documents are stored. */
  delivered: number;
  feeUsd: string;
  onDownload: () => void;
}) {
  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <h2>
        <BadgeStamp data-num>Filed — claim #{nonce}</BadgeStamp>
      </h2>
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="flex flex-wrap items-baseline gap-2 text-body [font:var(--riprap-body-sm)]">
          Claim <AddressChipInline value={claim} />
        </p>
        <p className="flex flex-wrap items-baseline gap-2 text-body [font:var(--riprap-body-sm)]">
          Dispute <AddressChipInline value={dispute} />
        </p>
        <p data-num className="font-mono text-sm text-ink">
          {delivered === 5 ? "Evidence: delivered" : `Evidence: incomplete — ${delivered} of 5`}
        </p>
      </div>
      <p data-num className="max-w-3xl font-mono text-xs leading-relaxed text-stone">
        {ROUND_TIMELINE}
      </p>
      <p className="max-w-[42rem] leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        The{" "}
        <span data-num className="font-mono">
          {feeUsd}
        </span>{" "}
        USDC fee rides the outcome — refunded if approved, kept if denied, returned if adjudication
        fails.
      </p>
      <p className="max-w-[42rem] leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        Keep manifest.yaml. If evidence delivery failed, re-enter from the app surface — the
        manifest re-verifies against the claim and re-delivers.
      </p>
      <div>
        <Button variant="outline" onClick={onDownload}>
          Download manifest.yaml
        </Button>
      </div>
    </Settle>
  );
}

/** Mono inline address chip (short + copyable) — the kit AddressChip is
 * nav-sized; this is the inline facts-line variant. */
function AddressChipInline({ value }: { value: string }) {
  return <AddressChip address={value} className="scale-90 origin-left" />;
}
