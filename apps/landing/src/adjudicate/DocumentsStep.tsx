// DocumentsStep.tsx — wizard step 1 DOCUMENTS (ADJUDICATION-DASHBOARD §4/§6,
// copy doc § /app/adjudicate step 1): one screen per policy §7 slot, in
// order. The bytes arrive already verified (step 0's root + leaf gates;
// unverified evidence blocks this step) and render through blob URLs —
// images inline, PDFs via `Open document` into a new tab (native rendering,
// Q5=A), `Download` for both. Three gates per slot, none pre-ticked —
// `Seen` · `Legible` · `In the right slot` — all three before the next slot
// opens; back is free. The closing same-person cross-check is one explicit
// gate (ticket = ID = declaration = member, policy §7).
//
// Privacy law (§6/§8): decrypted bytes live in session memory only — every
// blob URL is revoked on screen exit and unmount; nothing evidence-shaped
// persists. Only the tick answers persist (§8 — a 48h review window must
// survive a phone reload), keyed (mutual, dispute, round) via
// documentsAnswersKey, cleared by the outcome screen through
// clearDocumentsAnswers.

import { Button, buttonVariants, Checkbox } from "@riprap/ui";
import { useEffect, useState } from "react";

import { Settle } from "../components/Settle";

/** One policy §7 document slot: what to verify + the verified bytes. The
 * AdjudicationPolicy pack supplies path + verify (copy doc § step 1); the
 * session shell pairs them with the step-0-verified delivery. */
export interface DocumentSlot {
  /** The manifest entry path — `01-ticket.pdf` (mono, copy doc). */
  path: string;
  /** The what-to-verify line (copy doc § step 1, policy §7). */
  verify: string;
  /** Verified plaintext — session memory only, never persisted. */
  bytes: Uint8Array<ArrayBuffer>;
}

/** The step's persisted answers (§8): three gates per slot plus the closing
 * same-person cross-check. Opinions, not PII — dispute-scoped, revocable. */
export interface DocumentsAnswers {
  ticks: Record<string, { seen: boolean; legible: boolean; inSlot: boolean }>;
  samePerson: boolean;
}

/** §8 key convention: answers keyed (mutual, dispute, round). */
export function documentsAnswersKey(mutual: string, dispute: string, round: number): string {
  return `riprap.adjudicate.documents.${mutual}.${dispute}.${round}`;
}

/** The outcome screen's clear (§8: answers clear with the outcome). */
export function clearDocumentsAnswers(storageKey: string): void {
  localStorage.removeItem(storageKey);
}

function loadAnswers(storageKey: string): DocumentsAnswers {
  const raw = localStorage.getItem(storageKey);
  if (raw === null) {
    return { ticks: {}, samePerson: false };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DocumentsAnswers>;
    return { ticks: parsed.ticks ?? {}, samePerson: parsed.samePerson === true };
  } catch {
    return { ticks: {}, samePerson: false }; // corrupt draft → fresh answers, never a crash
  }
}

/** The slots' MIME law (§6: images inline, PDFs open-in-tab): the daemon's
 * format gate is jpeg/png/pdf (CLAIM-WIZARD §4); anything else falls back
 * to a download-only octet stream. */
function mimeOf(path: string): string {
  if (path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

/** The viewing model (§6, Q5=A): one blob URL in session memory — created on
 * arrival, revoked on screen exit and unmount; bytes never touch storage. */
function DocumentViewer({ path, bytes }: { path: string; bytes: Uint8Array<ArrayBuffer> }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const created = URL.createObjectURL(new Blob([bytes], { type: mimeOf(path) }));
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [path, bytes]);

  if (url === null) {
    return null;
  }
  return (
    <div className="flex flex-col gap-3">
      {mimeOf(path).startsWith("image/") ? (
        <img
          src={url}
          alt={path}
          className="max-h-[32rem] w-full border border-hairline bg-surface object-contain"
        />
      ) : (
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => window.open(url, "_blank", "noopener")}
        >
          Open document
        </Button>
      )}
      <a
        href={url}
        download={path}
        className={buttonVariants({ variant: "outline", className: "w-fit" })}
      >
        Download
      </a>
    </div>
  );
}

/** The three per-slot gates (copy doc § step 1), none pre-ticked. */
const GATES = [
  { key: "seen", label: "Seen" },
  { key: "legible", label: "Legible" },
  { key: "inSlot", label: "In the right slot" },
] as const;

type GateKey = (typeof GATES)[number]["key"];

type SlotTick = { seen: boolean; legible: boolean; inSlot: boolean };

const UNTICKED: SlotTick = { seen: false, legible: false, inSlot: false };
function slotComplete(tick: SlotTick | undefined): boolean {
  return tick?.seen === true && tick.legible && tick.inSlot;
}

/** Privacy line, every screen (copy doc § step 1, policy §7). */
function PrivacyLine() {
  return (
    <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
      Evidence is used solely to adjudicate this request.
    </p>
  );
}

/**
 * The step body. Owns slot paging (forward only through the next complete
 * slot; back free), the closing cross-check screen, and the answer
 * persistence. The session shell supplies the verified slots, the §8
 * storage key, and the step-boundary callbacks.
 */
export function DocumentsStep({
  slots,
  storageKey,
  onBack,
  onDone,
}: {
  slots: DocumentSlot[];
  storageKey: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [answers, setAnswers] = useState<DocumentsAnswers>(() => loadAnswers(storageKey));
  // 0..slots.length-1 = slot screens; slots.length = the closing cross-check.
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  const slotIndex = Math.min(screen, slots.length - 1);
  const inCrossCheck = screen >= slots.length;
  const slot = inCrossCheck ? null : (slots[slotIndex] as DocumentSlot);
  const tick = (slot !== null ? answers.ticks[slot.path] : undefined) ?? UNTICKED;
  const complete = inCrossCheck ? answers.samePerson : slotComplete(tick);

  const onTick = (path: string, key: GateKey, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      ticks: { ...prev.ticks, [path]: { ...(prev.ticks[path] ?? UNTICKED), [key]: value } },
    }));
  };

  const back = () => {
    if (screen > 0) {
      setScreen(screen - 1);
    } else {
      onBack();
    }
  };
  const forward = () => {
    if (inCrossCheck) {
      onDone();
    } else {
      setScreen(screen + 1);
    }
  };

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      {slot !== null ? (
        <div className="flex max-w-xl flex-col gap-4" data-slot="document-screen">
          <h3 data-num className="font-mono text-body tracking-(--riprap-tracking-stamp)">
            {slot.path}
          </h3>
          <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">{slot.verify}</p>
          <DocumentViewer path={slot.path} bytes={slot.bytes} />
          {GATES.map((gate) => (
            <label
              key={gate.key}
              htmlFor={`gate-${slot.path}-${gate.key}`}
              className="flex items-start gap-3 text-body [font:var(--riprap-body-sm)]"
            >
              <Checkbox
                id={`gate-${slot.path}-${gate.key}`}
                checked={tick[gate.key]}
                onChange={(e) => onTick(slot.path, gate.key, e.target.checked)}
              />
              <span>{gate.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="flex max-w-xl flex-col gap-4" data-slot="same-person-screen">
          <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">
            The ticket, the ID, and the declaration name one person — the person on this membership.
          </p>
          <label
            htmlFor="gate-same-person"
            className="flex items-start gap-3 text-body [font:var(--riprap-body-sm)]"
          >
            <Checkbox
              id="gate-same-person"
              checked={answers.samePerson}
              onChange={(e) => setAnswers((prev) => ({ ...prev, samePerson: e.target.checked }))}
            />
            <span>Same person throughout</span>
          </label>
        </div>
      )}
      <PrivacyLine />
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={back}>
          Back
        </Button>
        <Button disabled={!complete} onClick={forward}>
          Continue
        </Button>
      </div>
    </Settle>
  );
}
