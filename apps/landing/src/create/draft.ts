// draft.ts — the #/create wizard's localStorage persistence (copy doc §
// /create draft persistence; the file-claim draft pattern): form fields
// only, one draft per browser, resumable until deploy succeeds — the
// deploy step clears it the moment the transaction confirms. No server
// state anywhere.

import { type AdvancedConfig, type DefDoc, defaultAdvanced } from "./doc";

/** The persisted author state — every wizard field, nothing else (no
 *  computed hashes, no seed: the seed re-picks per session unless the
 *  deploy step has frozen it). */
export interface CreateDraft {
  def: DefDoc;
  advanced: AdvancedConfig;
}

/** The blank author form: one tier, one proof slot, the §12 preset, no
 *  numbers of our own, and an empty policy body (the author writes it;
 *  nothing about it is required). */
export function emptyDraft(): CreateDraft {
  return {
    def: {
      kind: "mutual",
      slug: "",
      name: "",
      period: { start: "", end: "", claimsClose: "", venue: "" },
      tiers: [{ name: "Basic", fee: 0, cap: 0 }],
      proof: [{ slot: "01-proof.pdf", kind: "file", label: "", verify: "" }],
      language: "en",
      body: "",
    },
    advanced: defaultAdvanced(),
  };
}

/** One wizard, one browser — no key parameter. */
const DRAFT_KEY = "riprap:create";

type LegacyDef = Partial<DefDoc> & { definition?: unknown; roster?: unknown };

/** Pre-body drafts carried `definition` + an optional `roster`; fold both
 *  into the one body and drop the old keys. Everything else is a spread. */
function migrateDef(raw: LegacyDef | undefined, fallback: DefDoc): DefDoc {
  if (raw === undefined) return fallback;
  const { definition, roster, body: rawBody, ...rest } = raw;
  const body =
    typeof rawBody === "string" && rawBody !== ""
      ? rawBody
      : typeof definition === "string"
        ? definition
        : "";
  const rosterText = typeof roster === "string" ? roster.trim() : "";
  return {
    ...fallback,
    ...rest,
    body:
      rosterText === ""
        ? body
        : `${body}${body.trim() === "" ? "" : "\n\n"}Roster:\n\n${rosterText}`,
  };
}

/** The draft with unknown-shape fields dropped — a corrupt or
 *  foreign-version draft must never crash the wizard. A blank saved mint
 *  is a pre-USDC-default draft's never-authored blank, not a choice: the
 *  default fills it (the gate still catches anything the author breaks). */
export function loadDraft(): CreateDraft {
  const base = emptyDraft();
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw === null) return base;
    const parsed = JSON.parse(raw) as Partial<CreateDraft>;
    const advanced = { ...base.advanced, ...parsed.advanced };
    if (advanced.mint === "") advanced.mint = base.advanced.mint;
    const legacyDef =
      typeof parsed.def === "object" && parsed.def !== null ? (parsed.def as LegacyDef) : undefined;
    return {
      def: migrateDef(legacyDef, base.def),
      advanced,
    };
  } catch {
    return base;
  }
}

export function saveDraft(draft: CreateDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private-browsing quota failures lose the draft, never the deploy.
  }
}

/** Deploy confirmed — the draft's job is done (copy doc: cleared the
 *  moment the deploy confirms). */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore — nothing to clean
  }
}
