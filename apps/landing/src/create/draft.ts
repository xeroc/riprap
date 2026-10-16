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
  /** The marketing band starts collapsed; opened stays opened. */
  marketingOpen: boolean;
}

/** The blank author form: one tier, one proof slot, the §12 preset, and
 *  no numbers of our own — the author prices their pool (validation gates
 *  until they do). */
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
      definition: "",
      roster: "",
    },
    advanced: defaultAdvanced(),
    marketingOpen: false,
  };
}

/** One wizard, one browser — no key parameter. */
const DRAFT_KEY = "riprap:create";

/** The draft with unknown-shape fields dropped — a corrupt or
 * foreign-version draft must never crash the wizard. A blank saved mint
 * is a pre-USDC-default draft's never-authored blank, not a choice: the
 * default fills it (the gate still catches anything the author breaks). */
export function loadDraft(): CreateDraft {
  const base = emptyDraft();
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw === null) return base;
    const parsed = JSON.parse(raw) as Partial<CreateDraft>;
    const advanced = { ...base.advanced, ...parsed.advanced };
    if (advanced.mint === "") advanced.mint = base.advanced.mint;
    return {
      def: { ...base.def, ...parsed.def },
      advanced,
      marketingOpen: parsed.marketingOpen ?? false,
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
