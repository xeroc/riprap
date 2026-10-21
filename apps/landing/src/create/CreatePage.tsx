// CreatePage.tsx — the #/create wizard (copy doc § /create; user-defined
// mutuals milestone D7): AUTHOR + PREVIEW (the def-schema form, the advanced
// drawer with every remaining initialize_mutual input behind the §12 preset,
// the exact-bytes preview with its anchors) and the DEPLOY / PUBLISH /
// VERIFY steps (create/steps.tsx): one wallet-signed initialize_mutual, the
// hash-gated CAS PUT of the exact bytes, the read-back check. No wallet gate
// before deploy — authoring is local; drafts persist in localStorage only
// (create/draft.ts) and clear the moment the deploy confirms.

import { fetchMaybeMutualBySeed } from "@riprap/hanse";
import {
  BadgeStamp,
  Button,
  CopyBlock,
  HexBackdrop,
  Input,
  Label,
  SectionBand,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@riprap/ui";
import { useWallet } from "@solana/connector";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useRef, useState } from "react";
import { Settle } from "../components/Settle";
import { SiteNav } from "../components/SiteNav";
import { domainRefHex, sha256Hex } from "../pool/domainRef";
import { useClusterEvidenceOperator } from "../pool/evidenceServer";
import { useClusterRpc } from "../shared/rpc";
import type { Deployed } from "./deploy";
import {
  type DefKind,
  type DefProofSlot,
  type DefTier,
  dateToUnix,
  type Rejection,
  randomSeed,
  renderDefDoc,
  slotPath,
  validateAdvanced,
  validateDef,
} from "./doc";
import { type CreateDraft, clearDraft, emptyDraft, loadDraft, saveDraft } from "./draft";
import { MarketingPreview } from "./MarketingPreview";
import { alignDepositMint, useClusterDepositMint } from "./mint";
import { poolSlug } from "./slug";
import { DeployStep, PublishStep, VerifyStep } from "./steps";

/** The wizard machine: six guided authoring screens (one question each),
 * then preview → deploy → publish → verify. */
type AuthorPhase = "identity" | "coverage" | "window" | "claims" | "marketing" | "advanced";
type Step = AuthorPhase | "preview" | "deploy" | "publish" | "verify";

/** One authoring screen: its rail label and the rejection-field gates its
 * Continue owns (a gate owns its dotted children — `tiers` owns `tiers.0.fee`). */
interface AuthorPhaseDef {
  id: AuthorPhase;
  label: string;
  gate: string[];
}

const AUTHOR_PHASES: readonly AuthorPhaseDef[] = [
  { id: "identity", label: "Identity", gate: ["name"] },
  { id: "coverage", label: "Coverage", gate: ["tiers"] },
  { id: "window", label: "Window", gate: ["period"] },
  { id: "claims", label: "Claims", gate: ["proof"] },
  { id: "marketing", label: "Marketing", gate: ["marketing"] },
  { id: "advanced", label: "Advanced", gate: ["advanced"] },
];

const PHASE_BY_ID = Object.fromEntries(AUTHOR_PHASES.map((p) => [p.id, p])) as Record<
  AuthorPhase,
  AuthorPhaseDef
>;

function isAuthorPhase(step: Step): step is AuthorPhase {
  return step !== "preview" && step !== "deploy" && step !== "publish" && step !== "verify";
}

/** The rejections one screen owns (advanced owns the mirrored chain gates;
 * every other screen owns its def fields). */
function phaseRejections(
  phase: AuthorPhaseDef,
  defRejections: Rejection[],
  advancedRejections: Rejection[],
): Rejection[] {
  const all = phase.id === "advanced" ? advancedRejections : defRejections;
  return all.filter((r) => phase.gate.some((g) => r.field === g || r.field.startsWith(`${g}.`)));
}

/** Where a resumed draft lands: the first screen whose gate still rejects,
 * else the last — the author never re-walks finished work. */
function initialPhase(draft: CreateDraft): Step {
  const def = validateDef(draft.def);
  const advanced = validateAdvanced(draft.advanced, draft.def, Math.floor(Date.now() / 1000));
  for (const phase of AUTHOR_PHASES) {
    if (phaseRejections(phase, def, advanced).length > 0) return phase.id;
  }
  return "advanced";
}

/** The first screen that still rejects, with its first rejection — the
 * blocking gate the preview and the deploy step carry. */
function firstBlocking(
  defRejections: Rejection[],
  advancedRejections: Rejection[],
): { phase: AuthorPhaseDef; rejection: Rejection } | null {
  for (const phase of AUTHOR_PHASES) {
    const [rejection] = phaseRejections(phase, defRejections, advancedRejections);
    if (rejection !== undefined) return { phase, rejection };
  }
  return null;
}

/** The five top-level phases — the old hero rail, now live. */
const JOURNEY_PHASES = [
  { id: "author", label: "Author" },
  { id: "preview", label: "Preview" },
  { id: "deploy", label: "Deploy" },
  { id: "publish", label: "Publish" },
  { id: "verify", label: "Verify" },
] as const;

type JourneyPhase = (typeof JOURNEY_PHASES)[number]["id"];

/** The whole journey is ten stops: the six authoring screens, then the
 * four chain phases. The strip's track is the navigable one — one button
 * per stop, every stop the author can reach from here jumps. */
const STOPS: readonly { step: Step; label: string }[] = [
  ...AUTHOR_PHASES.map((phase) => ({ step: phase.id, label: phase.label })),
  { step: "preview", label: "Preview" },
  { step: "deploy", label: "Deploy" },
  { step: "publish", label: "Publish" },
  { step: "verify", label: "Verify" },
];

/** One live progress display for the whole wizard (copy doc § /create
 * Progress strip): the phase row, the mono counter, the ten-segment
 * hairline track — the track carries the navigation. Sticky under the
 * navbar so the path stays visible down the long forms; fills settle, and
 * the token collapses under prefers-reduced-motion. */
function WizardProgress({
  step,
  onStep,
  canJump,
}: {
  step: Step;
  onStep: (step: Step) => void;
  canJump: (step: Step) => boolean;
}) {
  const current = STOPS.findIndex((s) => s.step === step);
  const currentPhase: JourneyPhase = isAuthorPhase(step) ? "author" : step;
  const phaseIndex = JOURNEY_PHASES.findIndex((p) => p.id === currentPhase);
  return (
    <div
      data-slot="wizard-progress"
      className="sticky top-[calc(var(--riprap-nav-h)+1px)] z-20 -mb-px flex w-full max-w-3xl flex-col gap-2 border-b border-hairline bg-ground py-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <ol
          aria-label="Wizard phases"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]"
        >
          {JOURNEY_PHASES.map((p, i) => (
            <Fragment key={p.id}>
              {i > 0 ? (
                <li aria-hidden className="text-muted">
                  →
                </li>
              ) : null}
              <li
                aria-current={i === phaseIndex ? "step" : undefined}
                className={[
                  "[transition:color_var(--riprap-settle)]",
                  i === phaseIndex ? "text-ink" : i < phaseIndex ? "text-body" : "text-muted",
                ].join(" ")}
              >
                {p.label}
              </li>
            </Fragment>
          ))}
        </ol>
        <p data-num aria-hidden className="font-mono text-xs text-muted">
          {String(current + 1).padStart(2, "0")}/{STOPS.length}
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        Step {current + 1} of {STOPS.length}: {STOPS[current]?.label}
      </p>
      <ol aria-label="Wizard steps" className="flex w-full items-center gap-1">
        {STOPS.map((stop, i) => (
          <li
            key={stop.step}
            className={stop.step === "preview" ? "flex flex-1 items-center gap-1" : "flex flex-1"}
          >
            {stop.step === "preview" ? (
              <span aria-hidden className="h-2.5 w-px bg-hairline-strong" />
            ) : null}
            <button
              type="button"
              aria-label={`Step ${i + 1} of ${STOPS.length}: ${stop.label}`}
              aria-current={i === current ? "step" : undefined}
              disabled={!canJump(stop.step)}
              onClick={() => onStep(stop.step)}
              className="flex-1 py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring enabled:cursor-pointer enabled:hover:bg-strong"
            >
              <span
                className={[
                  "block h-1 w-full [transition:background-color_var(--riprap-settle)]",
                  i < current ? "bg-body" : i === current ? "bg-ink" : "bg-hairline",
                ].join(" ")}
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
// ─── shared bits ────────────────────────────────────────────────────────────

/** One form band: mono uppercase label (the copy doc's `THE POOL` etc.),
 * content below, settled in. The heading is the focus target of a step
 * change (tabIndex −1, never tabbable). */
function Band({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Settle className="flex w-full flex-col gap-4" delay={40}>
      <h2
        tabIndex={-1}
        className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground focus:outline-none [font:var(--riprap-mono-label)]"
      >
        {label}
      </h2>
      {children}
    </Settle>
  );
}

/** The deadpan line under a field — the first rejection, or an always-on
 * gate note (the drawer's mirrors of the chain's own checks). */
function FieldNote({ rejections, note }: { rejections?: Rejection[]; note?: string }) {
  const line = rejections !== undefined && rejections.length > 0 ? rejections[0]?.line : note;
  if (line === undefined) return null;
  return (
    <p className="text-xs leading-relaxed text-muted-foreground" role="note">
      {line}
    </p>
  );
}

/** Labeled field: render-prop control + rejection/gate note below. */
function Field({
  id,
  label,
  rejections = [],
  note,
  children,
}: {
  id: string;
  label: string;
  rejections?: Rejection[];
  /** Always-on gate note (advanced screen) — shown when no rejection is. */
  note?: string;
  children: (props: { id: string; "aria-invalid": true | undefined }) => React.ReactNode;
}) {
  const errored = rejections.length > 0;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": errored || undefined })}
      <FieldNote rejections={rejections} note={note} />
    </div>
  );
}

/** A mono anchor row — `LABEL value` full-length, break-all (the hash/ref
 * display of RawPolicyTerms, without the chip). */
function AnchorRow({ label, value }: { label: string; value: string }) {
  return (
    <p data-num className="break-all font-mono text-sm text-ink" data-slot={`anchor-${label}`}>
      {label} {value}
    </p>
  );
}

/** Synchronous file download — must ride a user gesture. */
function downloadText(fileName: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

type SeedFreedom = "unknown" | "free" | "taken";

// ─── the page ───────────────────────────────────────────────────────────────

export function CreatePage() {
  return (
    <>
      <SiteNav inApp />
      <main>
        {/* the hero owns this page's HexBackdrop — the lattice is never
            scaled across the form below (founder call 2026-10-16) */}
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="create"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
              <Settle>
                <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)]">
                  Create a pool
                </h1>
              </Settle>
              <Settle delay={60}>
                <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
                  Riprap is a platform for purpose pools: a group writes the terms before anyone
                  joins — one purpose, fixed at creation — members chip in, and payouts are settled
                  by drawn peers — on-chain.
                </p>
              </Settle>
              <Settle delay={120}>
                <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
                  Write the terms. The wizard builds the pool, its jurors, and its terms document —
                  you sign once.
                </p>
              </Settle>
            </div>
          </SectionBand>
        </div>
        <SectionBand tone="ground" className="pt-(--riprap-space-lg)">
          <CreateWizard />
        </SectionBand>
      </main>
    </>
  );
}

function CreateWizard() {
  const [draft, setDraft] = useState<CreateDraft>(() => loadDraft());
  /** A resumed draft picks up at the first screen with work left. */
  const [step, setStep] = useState<Step>(() => initialPhase(draft));
  /** The slug always derives from the name (2026-10-21 founder pass — the
   * editable field is retired); a collision with a listed pool's route id
   * appends a counter (create/slug.ts). */
  const [seed, setSeed] = useState<bigint>(() => randomSeed());
  const [anchors, setAnchors] = useState<{
    doc: string;
    hash: string;
    ref: string;
  } | null>(null);
  /** Frozen at deploy confirm — the exact deployed artifacts (the live
   * draft clears; publish/verify render only from this record). */
  const [deployed, setDeployed] = useState<Deployed | null>(null);
  const { isConnected, account } = useWallet();
  const walletConnected = isConnected && account !== null;
  const walletAccount = walletConnected ? account : null;
  const clusterMint = useClusterDepositMint();

  // The mint prefill follows the connected cluster (mint.ts): a blank or a
  // stale other-cluster USDC in a resumed draft moves to this cluster's mint;
  // a mint the author set is never touched.
  useEffect(() => {
    setDraft((current) => {
      const mint = alignDepositMint(current.advanced.mint, clusterMint);
      return mint === current.advanced.mint
        ? current
        : { ...current, advanced: { ...current.advanced, mint } };
    });
  }, [clusterMint]);

  // Fields-only persistence (copy doc § /create draft persistence).
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  // Live anchors: the doc renders synchronously; its hash and the derived
  // domain_ref follow — every edit moves them (preview + advanced read these).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const doc = renderDefDoc(draft.def);
        const hash = await sha256Hex(new TextEncoder().encode(doc));
        const hashBytes = Uint8Array.from({ length: 32 }, (_, i) =>
          Number.parseInt(hash.slice(i * 2, i * 2 + 2), 16),
        );
        const ref = await domainRefHex(seed, hashBytes);
        if (!cancelled) setAnchors({ doc, hash, ref });
      } catch {
        // a mid-edit form can be momentarily unrenderable (non-integer
        // tier amounts); validation gates the step, the anchors show none
        if (!cancelled) setAnchors(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft.def, draft.advanced, seed]);

  const seedFreedom = useSeedFreedom(seed);

  // Re-pick on collision (milestone §1): one mutual PDA per seed — a taken
  // seed can never deploy. Bounded so a lying RPC can't spin the wizard.
  const repicks = useRef(0);
  useEffect(() => {
    if (seedFreedom === "taken" && repicks.current < 5) {
      repicks.current += 1;
      setSeed(randomSeed());
    }
  }, [seedFreedom]);

  const defRejections = validateDef(draft.def);
  const advancedRejections = validateAdvanced(
    draft.advanced,
    draft.def,
    Math.floor(Date.now() / 1000),
  );

  /** The first gate that still rejects, with the screen that owns it — the
   * preview and the deploy step refuse on it (the chain would fail with the
   * same words). */
  const blocking = firstBlocking(defRejections, advancedRejections);
  const blockingProp =
    blocking === null ? null : { label: blocking.phase.label, line: blocking.rejection.line };
  /** Jump to the screen that owns the blocking gate. */
  const fixBlocking = () => {
    if (blocking !== null) setStep(blocking.phase.id);
  };

  /** Where the strip may jump: the six author screens and the preview while
   * the draft is live, publish/verify once the record is frozen. Never the
   * deploy stop — it is the one terminal action. */
  const canJump = (target: Step): boolean => {
    if (target === "deploy") return false;
    return deployed === null
      ? isAuthorPhase(target) || target === "preview"
      : target === "publish" || target === "verify";
  };

  // A step change starts the author at the top of the new screen: the strip
  // scrolls back into view and the screen's heading takes focus (the move is
  // announced in the strip's polite region). Never on mount — a resumed
  // draft keeps its own place.
  const wizard = useRef<HTMLDivElement>(null);
  const lastStep = useRef(step);
  useEffect(() => {
    if (lastStep.current === step) return;
    lastStep.current = step;
    const container = wizard.current;
    container?.querySelector('[data-slot="wizard-progress"]')?.scrollIntoView?.({ block: "start" });
    container?.querySelector<HTMLElement>("h2")?.focus();
  }, [step]);

  const patchDef = (changes: Partial<CreateDraft["def"]>) =>
    setDraft((current) => ({
      ...current,
      def: { ...current.def, ...changes },
    }));
  const patchAdvanced = (changes: Partial<CreateDraft["advanced"]>) =>
    setDraft((current) => ({
      ...current,
      advanced: { ...current.advanced, ...changes },
    }));

  // The author screens own their width (the marketing preview rides beside
  // a 48rem form); every later step is the plain reading column.
  return (
    <div className="w-full" data-slot="create-wizard" ref={wizard}>
      <WizardProgress step={step} onStep={setStep} canJump={canJump} />
      {isAuthorPhase(step) ? (
        <AuthorStep
          phase={step}
          draft={draft}
          defRejections={defRejections}
          advancedRejections={advancedRejections}
          anchors={anchors}
          seed={seed}
          seedFreedom={seedFreedom}
          onPatchDef={patchDef}
          onPatchAdvanced={patchAdvanced}
          onNameChange={(name) => {
            setDraft((current) => ({
              ...current,
              def: {
                ...current.def,
                name,
                slug: poolSlug(name),
              },
            }));
          }}
          onPhase={setStep}
        />
      ) : (
        <div className="flex w-full max-w-3xl flex-col gap-(--riprap-space-lg)">
          {step === "preview" ? (
            <PreviewStep
              doc={anchors?.doc ?? ""}
              hash={anchors?.hash ?? ""}
              ref={anchors?.ref ?? ""}
              seed={seed}
              seedFreedom={seedFreedom}
              slug={draft.def.slug}
              blocking={blockingProp}
              onFix={fixBlocking}
              onBack={() => setStep("advanced")}
              onDeploy={() => setStep("deploy")}
            />
          ) : step === "deploy" && deployed === null ? (
            <DeployStep
              walletConnected={walletConnected}
              walletAddress={walletAccount}
              draft={draft}
              blocking={blockingProp}
              doc={anchors?.doc ?? ""}
              hash={anchors?.hash ?? ""}
              ref={anchors?.ref ?? ""}
              seed={seed}
              onFix={fixBlocking}
              onDeployed={(result) => {
                // The deploy confirms: the draft's job is done (copy doc —
                // cleared the moment the deploy confirms), and the frozen
                // record carries every later step.
                clearDraft();
                setDeployed(result);
                setStep("publish");
              }}
            />
          ) : step === "publish" && deployed !== null ? (
            <PublishStep
              deployed={deployed}
              onPublished={() => setStep("verify")}
              onSkipped={() => setStep("verify")}
            />
          ) : step === "verify" && deployed !== null ? (
            <VerifyStep
              deployed={deployed}
              onDone={() => {
                // A new policy is a new pool — reset the machine, fresh draft.
                setDeployed(null);
                const fresh = emptyDraft();
                if (clusterMint !== null) fresh.advanced.mint = clusterMint;
                setDraft(fresh);
                setSeed(randomSeed());
                setStep("identity");
              }}
            />
          ) : (
            <PreviewStep
              doc={anchors?.doc ?? ""}
              hash={anchors?.hash ?? ""}
              ref={anchors?.ref ?? ""}
              seed={seed}
              seedFreedom={seedFreedom}
              slug={draft.def.slug}
              blocking={blockingProp}
              onFix={fixBlocking}
              onBack={() => setStep("advanced")}
              onDeploy={() => setStep("deploy")}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Is the mutual PDA for this seed already taken? "unknown" when no cluster
 * RPC answers — the check is best-effort; the chain is the law at deploy. */
function useSeedFreedom(seed: bigint): SeedFreedom {
  const clusterRpc = useClusterRpc();
  const query = useQuery({
    queryKey: ["create-seed", clusterRpc?.endpoint, seed.toString()],
    queryFn: async () => {
      if (clusterRpc === null) return "unknown" as const;
      const existing = await fetchMaybeMutualBySeed(clusterRpc.rpc, { seed });
      return existing === null ? ("free" as const) : ("taken" as const);
    },
    enabled: clusterRpc !== null,
    staleTime: 60_000,
    retry: 1,
  });
  return query.data ?? "unknown";
}

// ─── AUTHOR ─────────────────────────────────────────────────────────────────

function AuthorStep({
  phase,
  draft,
  defRejections,
  advancedRejections,
  anchors,
  seed,
  seedFreedom,
  onPatchDef,
  onPatchAdvanced,
  onNameChange,
  onPhase,
}: {
  phase: AuthorPhase;
  draft: CreateDraft;
  defRejections: Rejection[];
  advancedRejections: Rejection[];
  anchors: { doc: string; hash: string; ref: string } | null;
  seed: bigint;
  seedFreedom: SeedFreedom;
  onPatchDef: (changes: Partial<CreateDraft["def"]>) => void;
  onPatchAdvanced: (changes: Partial<CreateDraft["advanced"]>) => void;
  onNameChange: (name: string) => void;
  onPhase: (phase: AuthorPhase | "preview") => void;
}) {
  const def = draft.def;
  const errorsFor = (field: string) => defRejections.filter((r) => r.field === field);

  const setTier = (index: number, changes: Partial<DefTier>) =>
    onPatchDef({
      tiers: def.tiers.map((tier, i) => (i === index ? { ...tier, ...changes } : tier)),
    });

  const setSlot = (index: number, changes: Partial<DefProofSlot>) =>
    onPatchDef({
      proof: def.proof.map((slot, i) => {
        if (i !== index) return slot;
        const next = { ...slot, ...changes };
        // the path re-derives from row order + label + kind — always
        return { ...next, slot: slotPath(i, next.label, next.kind) };
      }),
    });

  const index = AUTHOR_PHASES.findIndex((p) => p.id === phase);
  const gate = phaseRejections(PHASE_BY_ID[phase], defRejections, advancedRejections);
  const prev = index > 0 ? AUTHOR_PHASES[index - 1]?.id : undefined;
  const next = index < AUTHOR_PHASES.length - 1 ? AUTHOR_PHASES[index + 1]?.id : "preview";

  /** The screen is a form: Enter submits it. A blocked screen refuses the
   * submit and puts focus on the first field carrying a gate line — a dead
   * button would explain nothing. */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (gate.length > 0) {
      const form = event.currentTarget;
      (
        form.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        form.querySelector<HTMLElement>("input, textarea")
      )?.focus();
      return;
    }
    onPhase(next);
  };

  return (
    <Settle className="w-full" delay={180}>
      {/* the marketing screen rides its preview beside the form (same width
          law as the reading column — never wider); every other screen is
          the plain form column */}
      <div
        className={
          phase === "marketing"
            ? "grid w-full items-start gap-(--riprap-space-xl) xl:grid-cols-[minmax(0,48rem)_minmax(24rem,1fr)]"
            : "flex w-full flex-col gap-(--riprap-space-lg)"
        }
      >
        <form
          noValidate
          data-slot="author-form"
          onSubmit={handleSubmit}
          className="flex w-full max-w-3xl flex-col gap-(--riprap-space-lg)"
        >
          {phase === "identity" ? (
            <Band label="The pool">
              <Field id="def-name" label="Name" rejections={errorsFor("name")}>
                {(props) => (
                  <Input
                    {...props}
                    value={def.name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="The pool's name"
                  />
                )}
              </Field>
              <div className="flex max-w-md flex-col gap-2">
                <Label htmlFor="def-kind">Kind</Label>
                <Select
                  value={def.kind}
                  onValueChange={(kind) => onPatchDef({ kind: kind as DefKind })}
                >
                  <SelectTrigger id="def-kind" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutual">
                      Mutual — members chip in against one peril
                    </SelectItem>
                    <SelectItem value="bounty">Bounty — the pool pays for verified acts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Band>
          ) : phase === "coverage" ? (
            <Band label="Tiers">
              <p className="max-w-[36rem] text-xs leading-relaxed text-muted-foreground">
                Members chip in at these prices; a claim pays out at most the cap.
              </p>
              {def.tiers.map((tier, index) => (
                <div
                  key={index}
                  className="grid gap-4 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-start"
                  data-slot={`tier-row-${index}`}
                >
                  <Field
                    id={`tier-${index}-name`}
                    label="Name"
                    rejections={errorsFor(`tiers.${index}.name`)}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        value={tier.name}
                        onChange={(e) => setTier(index, { name: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field
                    id={`tier-${index}-fee`}
                    label="Entry (USDC)"
                    rejections={errorsFor(`tiers.${index}.fee`)}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        data-num
                        inputMode="numeric"
                        className="font-mono"
                        value={Number.isFinite(tier.fee) ? String(tier.fee) : ""}
                        onChange={(e) => setTier(index, { fee: Number(e.target.value) })}
                      />
                    )}
                  </Field>
                  <Field
                    id={`tier-${index}-cap`}
                    label="Max payout (USDC)"
                    rejections={errorsFor(`tiers.${index}.cap`)}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        data-num
                        inputMode="numeric"
                        className="font-mono"
                        value={Number.isFinite(tier.cap) ? String(tier.cap) : ""}
                        onChange={(e) => setTier(index, { cap: Number(e.target.value) })}
                      />
                    )}
                  </Field>
                  <div className="flex h-10 items-end">
                    {def.tiers.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onPatchDef({
                            tiers: def.tiers.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-4">
                {def.tiers.length < 3 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onPatchDef({
                        tiers: [...def.tiers, { name: "", fee: 0, cap: 0 }],
                      })
                    }
                  >
                    Add a tier
                  </Button>
                ) : null}
                <FieldNote rejections={errorsFor("tiers")} />
              </div>
            </Band>
          ) : phase === "window" ? (
            <Band label="Window">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  id="period-start"
                  label="Doors open"
                  note="Join closes when the doors open."
                  rejections={errorsFor("period.start")}
                >
                  {(props) => (
                    <Input
                      {...props}
                      data-num
                      className="font-mono"
                      type="date"
                      value={def.period.start}
                      onChange={(e) =>
                        onPatchDef({
                          period: { ...def.period, start: e.target.value },
                        })
                      }
                    />
                  )}
                </Field>
                <Field id="period-end" label="Coverage ends" rejections={errorsFor("period.end")}>
                  {(props) => (
                    <Input
                      {...props}
                      data-num
                      className="font-mono"
                      type="date"
                      value={def.period.end}
                      onChange={(e) =>
                        onPatchDef({
                          period: { ...def.period, end: e.target.value },
                        })
                      }
                    />
                  )}
                </Field>
                <Field
                  id="period-claims"
                  label="Claims close"
                  rejections={errorsFor("period.claimsClose")}
                >
                  {(props) => (
                    <Input
                      {...props}
                      data-num
                      className="font-mono"
                      type="date"
                      value={def.period.claimsClose}
                      onChange={(e) =>
                        onPatchDef({
                          period: {
                            ...def.period,
                            claimsClose: e.target.value,
                          },
                        })
                      }
                    />
                  )}
                </Field>
              </div>
              <Field id="period-venue" label="Venue (optional)" rejections={errorsFor("period")}>
                {(props) => (
                  <Input
                    {...props}
                    value={def.period.venue ?? ""}
                    onChange={(e) =>
                      onPatchDef({
                        period: { ...def.period, venue: e.target.value },
                      })
                    }
                    placeholder="Where the window runs, if it runs somewhere."
                  />
                )}
              </Field>
            </Band>
          ) : phase === "claims" ? (
            <>
              <Band label="The terms">
                <p className="max-w-[36rem] text-xs leading-relaxed text-muted-foreground">
                  What a member shows to get paid.
                </p>
                <Field
                  id="def-body"
                  label={
                    def.kind === "mutual" ? "What this pool covers" : "What this pool pays for"
                  }
                  note="The whole policy body. Markdown is allowed. The fields above become the frontmatter; this body is everything after it — nothing is injected and nothing is required. The jury reads it verbatim."
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={14}
                      value={def.body}
                      onChange={(e) => onPatchDef({ body: e.target.value })}
                      placeholder={
                        def.kind === "mutual"
                          ? "## What this pool covers\n\nThe peril, named plainly — one narrowly defined incident, where and when it counts.\n\n## Exclusions\n\nWhat is not covered."
                          : "## What this pool pays for\n\nThe act, what must be verified, and what is not paid."
                      }
                    />
                  )}
                </Field>
              </Band>
              <Band label="Proof">
                {def.proof.map((slot, index) => (
                  <div
                    key={index}
                    className="grid gap-4 border border-hairline bg-card p-4 sm:grid-cols-[1fr_8rem_1fr]"
                    data-slot={`proof-row-${index}`}
                  >
                    <Field
                      id={`proof-${index}-label`}
                      label="Label"
                      rejections={errorsFor("proof")}
                    >
                      {(props) => (
                        <Input
                          {...props}
                          value={slot.label}
                          onChange={(e) => setSlot(index, { label: e.target.value })}
                          placeholder="The member-facing name"
                        />
                      )}
                    </Field>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`proof-${index}-kind`}>Kind</Label>
                      <Select
                        value={slot.kind}
                        onValueChange={(kind) => setSlot(index, { kind: kind as "file" | "url" })}
                      >
                        <SelectTrigger id={`proof-${index}-kind`} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="url">Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Field id={`proof-${index}-verify`} label="Jurors verify (optional)">
                      {(props) => (
                        <Input
                          {...props}
                          value={slot.verify ?? ""}
                          onChange={(e) => setSlot(index, { verify: e.target.value })}
                          placeholder="What the jury checks here"
                        />
                      )}
                    </Field>
                    <p
                      data-num
                      className="break-all font-mono text-xs text-muted-foreground sm:col-span-3"
                      data-slot={`slot-path-${index}`}
                    >
                      {slot.slot}
                    </p>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onPatchDef({
                        proof: [
                          ...def.proof,
                          {
                            slot: slotPath(def.proof.length, "", "file"),
                            kind: "file",
                            label: "",
                            verify: "",
                          },
                        ],
                      })
                    }
                  >
                    Add a proof slot
                  </Button>
                  <FieldNote rejections={errorsFor("proof")} />
                </div>
              </Band>
            </>
          ) : phase === "marketing" ? (
            <Band label="Marketing">
              <p className="max-w-[36rem] text-xs leading-relaxed text-muted-foreground">
                Optional — nothing here is required. Absent fields fall back to the kind's templates
                on the pool page.
              </p>
              <MarketingFields
                draft={draft}
                defRejections={defRejections}
                onPatchDef={onPatchDef}
              />
            </Band>
          ) : (
            <AdvancedPhase
              draft={draft}
              advancedRejections={advancedRejections}
              anchors={anchors}
              seed={seed}
              seedFreedom={seedFreedom}
              onPatchAdvanced={onPatchAdvanced}
            />
          )}

          {/* the footer sticks to the viewport bottom: Continue stays
              reachable down the longest screen */}
          <div
            data-slot="author-nav"
            className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-hairline bg-ground py-3"
          >
            {prev !== undefined ? (
              <Button type="button" variant="outline" onClick={() => onPhase(prev)}>
                Back
              </Button>
            ) : null}
            <Button type="submit" data-participate>
              Continue
            </Button>
          </div>
        </form>
        {phase === "marketing" ? <MarketingPreview def={def} /> : null}
      </div>
    </Settle>
  );
}

function MarketingFields({
  draft,
  defRejections,
  onPatchDef,
}: {
  draft: CreateDraft;
  defRejections: Rejection[];
  onPatchDef: (changes: Partial<CreateDraft["def"]>) => void;
}) {
  const marketing = draft.def.marketing ?? {};
  const patchMarketing = (changes: Partial<NonNullable<CreateDraft["def"]["marketing"]>>) =>
    onPatchDef({ marketing: { ...marketing, ...changes } });
  const errorsFor = (field: string) => defRejections.filter((r) => r.field === field);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="marketing-headline" label="Headline">
          {(props) => (
            <Input
              {...props}
              value={marketing.headline ?? ""}
              onChange={(e) => patchMarketing({ headline: e.target.value })}
              placeholder="The pool page's own line."
            />
          )}
        </Field>
        <Field id="marketing-event" label="Event name">
          {(props) => (
            <Input
              {...props}
              value={marketing.event ?? ""}
              onChange={(e) => patchMarketing({ event: e.target.value })}
              placeholder="If the pool runs at one."
            />
          )}
        </Field>
      </div>
      <Field id="marketing-blurb" label="Blurb">
        {(props) => (
          <Textarea
            {...props}
            rows={2}
            value={marketing.blurb ?? ""}
            onChange={(e) => patchMarketing({ blurb: e.target.value })}
            placeholder="One deadpan sentence — the directory card's tagline."
          />
        )}
      </Field>
      <Field id="marketing-logo" label="Logo — image link" rejections={errorsFor("marketing.logo")}>
        {(props) => (
          <Input
            {...props}
            inputMode="url"
            value={marketing.logo ?? ""}
            onChange={(e) => patchMarketing({ logo: e.target.value.trim() })}
            placeholder="https://… — the pool page's own image."
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="marketing-share" label="Share text">
          {(props) => (
            <Input
              {...props}
              value={marketing.share ?? ""}
              onChange={(e) => patchMarketing({ share: e.target.value })}
              placeholder="What a shared card says."
            />
          )}
        </Field>
        <Field
          id="marketing-smallest"
          label="Smallest payout (USDC)"
          rejections={errorsFor("marketing.smallestPayout")}
        >
          {(props) => (
            <Input
              {...props}
              data-num
              inputMode="numeric"
              className="font-mono"
              value={marketing.smallestPayout !== undefined ? String(marketing.smallestPayout) : ""}
              onChange={(e) =>
                patchMarketing({
                  smallestPayout: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          )}
        </Field>
      </div>
    </div>
  );
}

// ─── the advanced screen — every remaining chain input, inline ──────────────

function AdvancedPhase({
  draft,
  advancedRejections,
  anchors,
  seed,
  seedFreedom,
  onPatchAdvanced,
}: {
  draft: CreateDraft;
  advancedRejections: Rejection[];
  anchors: { doc: string; hash: string; ref: string } | null;
  seed: bigint;
  seedFreedom: SeedFreedom;
  onPatchAdvanced: (changes: Partial<CreateDraft["advanced"]>) => void;
}) {
  const clusterOperator = useClusterEvidenceOperator();
  const { account } = useWallet();
  /** The cluster's configured operator, else the creator's wallet — the
   * author never customizes it (founder call 2026-10-16). */
  const evidenceOperator =
    clusterOperator !== "" ? clusterOperator : (account ?? "the creator's wallet");
  const advanced = draft.advanced;
  const advErrorsFor = (field: string) =>
    advancedRejections.filter((r) => r.field === `advanced.${field}`);

  const numberField = (
    id: string,
    label: string,
    field: keyof CreateDraft["advanced"],
    gate: string,
  ) => (
    <Field id={id} label={label} rejections={advErrorsFor(field)} note={gate}>
      {(props) => (
        <Input
          {...props}
          data-num
          inputMode="decimal"
          className="font-mono"
          value={String(advanced[field])}
          onChange={(e) =>
            onPatchAdvanced({
              [field]: Number(e.target.value),
            } as Partial<CreateDraft["advanced"]>)
          }
        />
      )}
    </Field>
  );

  return (
    <Band label="Advanced">
      <p className="max-w-[36rem] text-xs leading-relaxed text-muted-foreground">
        Every remaining chain input, pre-filled with the pilot preset. These mirror the chain&apos;s
        own checks — the deploy fails with the same words if one is wrong.
      </p>
      <div className="flex w-full max-w-xl flex-col gap-4">
        <Field
          id="adv-mint"
          label="Contribution + fee mint"
          note="One mint for entries, payouts, and juror fees — prefilled with USDC. Classic SPL Token only — no Token-2022."
          rejections={advErrorsFor("mint")}
        >
          {(props) => (
            <Input
              {...props}
              className="font-mono"
              value={advanced.mint}
              onChange={(e) => onPatchAdvanced({ mint: e.target.value.trim() })}
              placeholder="USDC mint pubkey"
            />
          )}
        </Field>
      </div>
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {numberField(
          "adv-min-stake",
          "Min juror stake (USDC)",
          "minStakeUsdc",
          "Must be above zero.",
        )}
        {numberField("adv-fee-juror", "Juror fee (USDC)", "feePerJurorUsdc", "Must be above zero.")}
        {numberField("adv-jury", "Min jury size", "minJurySize", "Must be odd.")}
        {numberField(
          "adv-appeals",
          "Max appeals",
          "maxAppeals",
          "The appeal ladder must fit 31 jurors.",
        )}
        {numberField("adv-alpha", "Alpha (bps)", "alphaBps", "0–10000.")}
        {numberField("adv-reveal-bps", "Reveal threshold (bps)", "revealThresholdBps", "0–10000.")}
        {numberField("adv-review", "Review window (hours)", "reviewHours", "Must be above zero.")}
        {numberField("adv-commit", "Commit window (hours)", "commitHours", "Must be above zero.")}
        {numberField("adv-reveal", "Reveal window (hours)", "revealHours", "Must be above zero.")}
        {numberField("adv-appeal", "Appeal window (hours)", "appealHours", "At least 1 hour.")}
        {numberField("adv-draws", "Max draw attempts", "maxDrawAttempts", "1–10.")}
      </div>
      <div className="flex w-full max-w-3xl flex-col gap-2 border-t border-hairline pt-4">
        <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          Derived
        </p>
        <AnchorRow label="policy hash" value={anchors?.hash ?? "…"} />
        <AnchorRow label="seed" value={seed.toString()} />
        <AnchorRow label="evidence operator" value={evidenceOperator} />
        <p data-num className="break-all font-mono text-sm text-ink">
          deposits close {defTimestamp(draft, "start")} · claims close{" "}
          {defTimestamp(draft, "claimsClose")} (unix)
        </p>
        {seedFreedom === "taken" ? (
          <p className="text-xs text-muted-foreground">
            This seed&apos;s address is taken — the wizard re-picks until it finds a free one.
          </p>
        ) : null}
      </div>
    </Band>
  );
}

function defTimestamp(draft: CreateDraft, field: "start" | "claimsClose"): string {
  const date = draft.def.period[field];
  return date === "" ? "—" : String(dateToUnix(date));
}

// ─── PREVIEW ────────────────────────────────────────────────────────────────

function PreviewStep({
  doc,
  hash,
  ref,
  seed,
  seedFreedom,
  slug,
  blocking,
  onFix,
  onBack,
  onDeploy,
}: {
  doc: string;
  hash: string;
  ref: string;
  seed: bigint;
  seedFreedom: SeedFreedom;
  slug: string;
  /** The first gate that still rejects, with the screen that owns it. */
  blocking: { label: string; line: string } | null;
  onFix: () => void;
  onBack: () => void;
  onDeploy: () => void;
}) {
  return (
    <Settle className="flex w-full flex-col gap-(--riprap-space-lg)" delay={180}>
      <div>
        <h2 tabIndex={-1} className="focus:outline-none">
          <BadgeStamp>Preview</BadgeStamp>
        </h2>
        <p className="mt-3 max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          One document is the pool&apos;s law. This is its exact bytes.
        </p>
      </div>
      <CopyBlock label="riprap-def/v1 — exact bytes" value={doc}>
        <pre
          data-num
          className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre text-body"
        >
          {doc}
        </pre>
      </CopyBlock>
      <div className="flex flex-col gap-2" data-slot="preview-anchors">
        <AnchorRow label="sha256" value={hash || "…"} />
        <AnchorRow label="domain ref" value={ref || "…"} />
        <AnchorRow label="seed" value={seed.toString()} />
      </div>
      <p className="max-w-[36rem] text-xs leading-relaxed text-muted-foreground">
        Any edit changes the hash — and the address. The pool&apos;s terms never change after
        deploy; a new policy is a new pool.
        {seedFreedom === "taken"
          ? " This seed's address is taken — go back and the wizard re-picks."
          : ""}
      </p>
      {blocking !== null ? (
        <div className="flex max-w-xl flex-col items-start gap-2" data-slot="preview-blocked">
          <p className="text-ink [font:var(--riprap-body-md)]">{blocking.line}</p>
          <Button variant="outline" onClick={onFix}>
            Fix it in the {blocking.label.toLowerCase()} step.
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadText(`${slug || "pool"}.md`, doc, "text/markdown")}
        >
          Download terms document
        </Button>
        <Button data-participate disabled={hash === "" || blocking !== null} onClick={onDeploy}>
          Continue to deploy
        </Button>
      </div>
    </Settle>
  );
}
