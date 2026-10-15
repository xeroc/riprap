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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
} from "@riprap/ui";
import { useWallet } from "@solana/connector";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Settle } from "../components/Settle";
import { SiteNav } from "../components/SiteNav";
import { domainRefHex, sha256Hex } from "../pool/domainRef";
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
  slugify,
  validateAdvanced,
  validateDef,
} from "./doc";
import { type CreateDraft, clearDraft, emptyDraft, loadDraft, saveDraft } from "./draft";
import { DeployStep, PublishStep, VerifyStep } from "./steps";

/** The wizard machine: author → preview → deploy → publish → verify. */
type Step = "author" | "preview" | "deploy" | "publish" | "verify";

// ─── shared bits ────────────────────────────────────────────────────────────

/** One form band: mono uppercase label (the copy doc's `THE POOL` etc.),
 * content below, settled in. */
function Band({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Settle className="flex w-full flex-col gap-4" delay={40}>
      <h2 className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
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
  /** Always-on gate note (advanced drawer) — shown when no rejection is. */
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
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="create"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            <CreateWizard />
          </SectionBand>
        </div>
      </main>
    </>
  );
}

function CreateWizard() {
  const [step, setStep] = useState<Step>("author");
  const [draft, setDraft] = useState<CreateDraft>(() => loadDraft());
  /** The slug derives from the name until the author edits it directly. */
  const [slugAuto, setSlugAuto] = useState(draft.def.slug === "");
  const [seed, setSeed] = useState<bigint>(() => randomSeed());
  const [anchors, setAnchors] = useState<{ doc: string; hash: string; ref: string } | null>(null);
  /** Frozen at deploy confirm — the exact deployed artifacts (the live
   * draft clears; publish/verify render only from this record). */
  const [deployed, setDeployed] = useState<Deployed | null>(null);
  const { isConnected, account } = useWallet();
  const walletConnected = isConnected && account !== null;
  const walletAccount = walletConnected ? account : null;

  // Fields-only persistence (copy doc § /create draft persistence).
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  // Live anchors: the doc renders synchronously; its hash and the derived
  // domain_ref follow — every edit moves them (preview + drawer read these).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const doc = renderDefDoc(draft.def, draft.advanced);
      const hash = await sha256Hex(new TextEncoder().encode(doc));
      const hashBytes = Uint8Array.from({ length: 32 }, (_, i) =>
        Number.parseInt(hash.slice(i * 2, i * 2 + 2), 16),
      );
      const ref = await domainRefHex(seed, hashBytes);
      if (!cancelled) setAnchors({ doc, hash, ref });
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

  const patchDef = (changes: Partial<CreateDraft["def"]>) =>
    setDraft((current) => ({ ...current, def: { ...current.def, ...changes } }));
  const patchAdvanced = (changes: Partial<CreateDraft["advanced"]>) =>
    setDraft((current) => ({ ...current, advanced: { ...current.advanced, ...changes } }));

  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="create-wizard">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)]">
          Create a pool
        </h1>
      </Settle>
      <Settle delay={60}>
        <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          Write the terms. The wizard builds the pool, its jurors, and its terms document — you sign
          once.
        </p>
      </Settle>
      <Settle delay={120}>
        <p
          data-num
          className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]"
        >
          Author → Preview → Deploy → Publish → Verify
        </p>
      </Settle>

      {step === "author" ? (
        <AuthorStep
          draft={draft}
          slugAuto={slugAuto}
          defRejections={defRejections}
          advancedRejections={advancedRejections}
          anchors={anchors}
          seed={seed}
          seedFreedom={seedFreedom}
          onPatchDef={patchDef}
          onPatchAdvanced={patchAdvanced}
          onPatchDraft={(changes) => setDraft((current) => ({ ...current, ...changes }))}
          onNameChange={(name) => {
            setDraft((current) => ({
              ...current,
              def: { ...current.def, name, slug: slugAuto ? slugify(name) : current.def.slug },
            }));
          }}
          onSlugEdited={(slug) => {
            setSlugAuto(false);
            patchDef({ slug });
          }}
          onContinue={() => setStep("preview")}
        />
      ) : step === "preview" ? (
        <PreviewStep
          doc={anchors?.doc ?? ""}
          hash={anchors?.hash ?? ""}
          ref={anchors?.ref ?? ""}
          seed={seed}
          seedFreedom={seedFreedom}
          slug={draft.def.slug}
          onBack={() => setStep("author")}
          onDeploy={() => setStep("deploy")}
        />
      ) : step === "deploy" && deployed === null ? (
        <DeployStep
          walletConnected={walletConnected}
          walletAddress={walletAccount}
          draft={draft}
          advancedRejections={advancedRejections}
          doc={anchors?.doc ?? ""}
          hash={anchors?.hash ?? ""}
          ref={anchors?.ref ?? ""}
          seed={seed}
          onBack={() => setStep("preview")}
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
            setDraft(emptyDraft());
            setSlugAuto(true);
            setSeed(randomSeed());
            setStep("author");
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
          onBack={() => setStep("author")}
          onDeploy={() => setStep("deploy")}
        />
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
  draft,
  slugAuto,
  defRejections,
  advancedRejections,
  anchors,
  seed,
  seedFreedom,
  onPatchDef,
  onPatchAdvanced,
  onPatchDraft,
  onNameChange,
  onSlugEdited,
  onContinue,
}: {
  draft: CreateDraft;
  slugAuto: boolean;
  defRejections: Rejection[];
  advancedRejections: Rejection[];
  anchors: { doc: string; hash: string; ref: string } | null;
  seed: bigint;
  seedFreedom: SeedFreedom;
  onPatchDef: (changes: Partial<CreateDraft["def"]>) => void;
  onPatchAdvanced: (changes: Partial<CreateDraft["advanced"]>) => void;
  onPatchDraft: (changes: Partial<CreateDraft>) => void;
  onNameChange: (name: string) => void;
  onSlugEdited: (slug: string) => void;
  onContinue: () => void;
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

  return (
    <Settle className="flex w-full flex-col gap-(--riprap-space-lg)" delay={180}>
      <Band label="The pool">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="def-name" label="Name" rejections={errorsFor("name")}>
            {(props) => (
              <Input
                {...props}
                value={def.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Chairmageddon"
              />
            )}
          </Field>
          <Field id="def-slug" label="Slug" rejections={errorsFor("slug")}>
            {(props) => (
              <Input
                {...props}
                value={def.slug}
                onChange={(e) => onSlugEdited(e.target.value)}
                placeholder={slugAuto ? slugify(def.name) || "pool-route-id" : "pool-route-id"}
              />
            )}
          </Field>
        </div>
        <div className="flex max-w-md flex-col gap-2">
          <Label htmlFor="def-kind">Kind</Label>
          <Select value={def.kind} onValueChange={(kind) => onPatchDef({ kind: kind as DefKind })}>
            <SelectTrigger id="def-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mutual">Mutual — members chip in against one peril</SelectItem>
              <SelectItem value="bounty">Bounty — the pool pays for verified acts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Band>

      <Band label="The terms">
        <Field
          id="def-definition"
          label={def.kind === "mutual" ? "What this pool covers" : "What this pool pays for"}
          rejections={errorsFor("definition")}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={def.definition}
              onChange={(e) => onPatchDef({ definition: e.target.value })}
              placeholder={
                def.kind === "mutual"
                  ? "The peril, named plainly — one narrowly defined incident."
                  : "The act the pool pays for — what must be verified."
              }
            />
          )}
        </Field>
        <Field
          id="def-exclusions"
          label={def.kind === "mutual" ? "Exclusions — not covered" : "Exclusions — not paid"}
          rejections={errorsFor("exclusions")}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={def.exclusions.join("\n")}
              onChange={(e) => onPatchDef({ exclusions: e.target.value.split("\n") })}
              placeholder={"One per line.\nNo pool covers everything."}
            />
          )}
        </Field>
        {def.kind === "bounty" ? (
          <Field id="def-roster" label="Roster — who or what qualifies">
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={def.roster ?? ""}
                onChange={(e) => onPatchDef({ roster: e.target.value })}
                placeholder="The named people or acts the bounty pays for."
              />
            )}
          </Field>
        ) : null}
      </Band>

      <Band label="Tiers">
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
                  variant="outline"
                  size="sm"
                  onClick={() => onPatchDef({ tiers: def.tiers.filter((_, i) => i !== index) })}
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
              variant="outline"
              size="sm"
              onClick={() => onPatchDef({ tiers: [...def.tiers, { name: "", fee: 0, cap: 0 }] })}
            >
              Add a tier
            </Button>
          ) : null}
          <FieldNote rejections={errorsFor("tiers")} />
        </div>
      </Band>

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
                onChange={(e) => onPatchDef({ period: { ...def.period, start: e.target.value } })}
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
                onChange={(e) => onPatchDef({ period: { ...def.period, end: e.target.value } })}
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
                  onPatchDef({ period: { ...def.period, claimsClose: e.target.value } })
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
              onChange={(e) => onPatchDef({ period: { ...def.period, venue: e.target.value } })}
              placeholder="Where the window runs, if it runs somewhere."
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
            <Field id={`proof-${index}-label`} label="Label" rejections={errorsFor("proof")}>
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

      <Band label="Marketing">
        {draft.marketingOpen ? (
          <MarketingFields draft={draft} defRejections={defRejections} onPatchDef={onPatchDef} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => onPatchDraft({ marketingOpen: true })}>
            <ChevronDownIcon className="size-3.5" /> Add marketing copy
          </Button>
        )}
      </Band>

      <Band label="Advanced">
        <p className="max-w-[36rem] text-xs leading-relaxed text-muted-foreground">
          Every remaining chain input — the mint, the evidence operator, the jury economics —
          pre-filled with the pilot preset, behind one drawer.
        </p>
        <AdvancedDrawer
          draft={draft}
          advancedRejections={advancedRejections}
          anchors={anchors}
          seed={seed}
          seedFreedom={seedFreedom}
          onPatchAdvanced={onPatchAdvanced}
        />
      </Band>

      <div className="flex items-center gap-3">
        <Button disabled={defRejections.length > 0} onClick={onContinue} data-participate>
          Continue
        </Button>
        <FieldNote rejections={defRejections} />
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
      <Field id="marketing-odds" label="Odds — one per line">
        {(props) => (
          <Textarea
            {...props}
            rows={2}
            value={(marketing.odds ?? []).join("\n")}
            onChange={(e) => patchMarketing({ odds: e.target.value.split("\n") })}
            placeholder={"What the pool pays, in its own words.\nOne row per line."}
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
              onChange={(e) => patchMarketing({ smallestPayout: Number(e.target.value) })}
            />
          )}
        </Field>
      </div>
    </div>
  );
}

// ─── the advanced drawer ────────────────────────────────────────────────────

function AdvancedDrawer({
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <ChevronDownIcon className="size-3.5" /> Advanced pool settings
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-6 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Advanced pool settings</SheetTitle>
          <SheetDescription>
            Every remaining chain input, pre-filled with the pilot preset. These mirror the
            chain&apos;s own checks — the deploy fails with the same words if one is wrong.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <Field
            id="adv-mint"
            label="Contribution + fee mint"
            note="One mint for entries, payouts, and juror fees. Classic SPL Token only — no Token-2022."
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
          <Field
            id="adv-operator"
            label="Evidence operator"
            note="Leave empty and this wallet is the evidence operator."
            rejections={advErrorsFor("evidenceOperator")}
          >
            {(props) => (
              <Input
                {...props}
                className="font-mono"
                value={advanced.evidenceOperator}
                onChange={(e) => onPatchAdvanced({ evidenceOperator: e.target.value.trim() })}
                placeholder="Optional pubkey"
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {numberField(
            "adv-min-stake",
            "Min juror stake (USDC)",
            "minStakeUsdc",
            "Must be above zero.",
          )}
          {numberField(
            "adv-fee-juror",
            "Juror fee (USDC)",
            "feePerJurorUsdc",
            "Must be above zero.",
          )}
          {numberField("adv-jury", "Min jury size", "minJurySize", "Must be odd.")}
          {numberField(
            "adv-appeals",
            "Max appeals",
            "maxAppeals",
            "The appeal ladder must fit 31 jurors.",
          )}
          {numberField("adv-alpha", "Alpha (bps)", "alphaBps", "0–10000.")}
          {numberField(
            "adv-reveal-bps",
            "Reveal threshold (bps)",
            "revealThresholdBps",
            "0–10000.",
          )}
          {numberField("adv-review", "Review window (hours)", "reviewHours", "Must be above zero.")}
          {numberField("adv-commit", "Commit window (hours)", "commitHours", "Must be above zero.")}
          {numberField("adv-reveal", "Reveal window (hours)", "revealHours", "Must be above zero.")}
          {numberField("adv-appeal", "Appeal window (hours)", "appealHours", "At least 1 hour.")}
          {numberField("adv-draws", "Max draw attempts", "maxDrawAttempts", "1–10.")}
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline pt-4">
          <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
            Derived
          </p>
          <AnchorRow label="policy hash" value={anchors?.hash ?? "…"} />
          <AnchorRow label="seed" value={seed.toString()} />
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
      </SheetContent>
    </Sheet>
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
  onBack,
  onDeploy,
}: {
  doc: string;
  hash: string;
  ref: string;
  seed: bigint;
  seedFreedom: SeedFreedom;
  slug: string;
  onBack: () => void;
  onDeploy: () => void;
}) {
  return (
    <Settle className="flex w-full flex-col gap-(--riprap-space-lg)" delay={180}>
      <div>
        <h2>
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
        <Button data-participate disabled={hash === ""} onClick={onDeploy}>
          Continue to deploy
        </Button>
      </div>
    </Settle>
  );
}
