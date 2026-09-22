// draft.ts — the wizard's localStorage persistence (CLAIM-WIZARD §4, copy
// doc § /app/file-claim "Draft persistence"): form fields and per-document
// hashes ONLY, keyed by mutual. File bytes never persist in the browser —
// documents re-attach and re-hash each session (delivery is idempotent).
// The manifest download, not this draft, is the durable artifact.

/** Canonical evidence slots — policy §7 order, exact manifest paths. */
export const DOC_SLOTS = [
  { path: "01-ticket.pdf", label: "your event ticket" },
  { path: "02-id-document.jpg", label: "government photo ID" },
  { path: "03-police-report.pdf", label: "the police report" },
  { path: "04-medical-report.pdf", label: "the treating practitioner's report" },
  { path: "05-statutory-declaration.pdf", label: "your statutory declaration" },
] as const;

export type DocSlot = (typeof DOC_SLOTS)[number];

/** One hashed document from a previous session — hash + original filename. */
export interface DraftDoc {
  /** sha256 hex of the exact upload bytes (post HEIC conversion). */
  sha256: string;
  /** The attached file's original name (display only). */
  fileName: string;
}

/** The persisted draft — form fields and document hashes only. */
export interface ClaimDraft {
  /** datetime-local string (step 1 `When`). */
  incidentAt: string;
  incidentPlace: string;
  narrative: string;
  /** The four §3/§4 self-screen checkboxes. */
  screen: { blade: boolean; window: boolean; area: boolean; injury: boolean };
  /** Whole-dollar string (step 2), free input. */
  amountUsdc: string;
  /** By canonical path — a hash survives reload; the bytes never do. */
  docs: Partial<Record<string, DraftDoc>>;
  /** Step-3 same-person attestation (policy §7). */
  samePerson: boolean;
}

export function emptyDraft(): ClaimDraft {
  return {
    incidentAt: "",
    incidentPlace: "",
    narrative: "",
    screen: { blade: false, window: false, area: false, injury: false },
    amountUsdc: "",
    docs: {},
    samePerson: false,
  };
}

/** Drafts are keyed by mutual (copy doc § /app/file-claim): one pool, one
 * draft per browser. */
function draftKey(mutual: string): string {
  return `riprap:file-claim:${mutual}`;
}

/** The draft with any unknown-shape fields dropped — a corrupt or
 * foreign-version draft must never crash the wizard. */
export function loadDraft(mutual: string): ClaimDraft {
  const base = emptyDraft();
  try {
    const raw = localStorage.getItem(draftKey(mutual));
    if (raw === null) return base;
    const parsed = JSON.parse(raw) as Partial<ClaimDraft>;
    return {
      ...base,
      ...parsed,
      screen: { ...base.screen, ...parsed.screen },
      docs: { ...parsed.docs },
    };
  } catch {
    return base;
  }
}

export function saveDraft(mutual: string, draft: ClaimDraft): void {
  try {
    localStorage.setItem(draftKey(mutual), JSON.stringify(draft));
  } catch {
    // Private-browsing quota failures lose the draft, never the filing.
  }
}

export function clearDraft(mutual: string): void {
  try {
    localStorage.removeItem(draftKey(mutual));
  } catch {
    // ignore — nothing to clean
  }
}
