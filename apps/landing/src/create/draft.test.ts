// draft.test.ts — the #/create draft: fields-only persistence, resumability
// (unknown-shape fields dropped, corrupt storage never crashes the wizard),
// and the deploy-confirmed clear (copy doc § /create draft persistence).

import { afterEach, describe, expect, it } from "vitest";

import { clearDraft, emptyDraft, loadDraft, saveDraft } from "./draft";

afterEach(() => {
  localStorage.clear();
});

describe("create draft", () => {
  it("round-trips every field through localStorage", () => {
    const draft = emptyDraft();
    draft.def.name = "Chairmageddon";
    draft.def.slug = "chairmageddon";
    draft.def.tiers.push({ name: "Standard", fee: 20, cap: 80 });
    draft.advanced.mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    draft.marketingOpen = true;
    saveDraft(draft);
    expect(loadDraft()).toEqual(draft);
  });

  it("resumes: an empty storage yields the blank form, not null", () => {
    expect(loadDraft()).toEqual(emptyDraft());
  });
  it("migrates a pre-USDC-default draft's blank mint to the default", () => {
    const draft = emptyDraft();
    draft.def.name = "Chairmageddon";
    draft.advanced.mint = "";
    saveDraft(draft);
    expect(loadDraft().advanced.mint).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    // the rest of the draft still resumes
    expect(loadDraft().def.name).toBe("Chairmageddon");
  });

  it("never crashes on corrupt or foreign drafts (file-claim precedent: loose spread)", () => {
    localStorage.setItem("riprap:create", "{not json");
    localStorage.setItem("riprap:create", JSON.stringify({ def: { name: 7 }, nope: true }));
    const loaded = loadDraft();
    expect(loaded.def.kind).toBe("mutual"); // base shape survives
    expect(loaded.marketingOpen).toBe(false);
    expect(loaded.advanced.minJurySize).toBe(3); // §12 preset survives
  });

  it("clears on deploy confirmation", () => {
    const draft = emptyDraft();
    draft.def.name = "Chairmageddon";
    saveDraft(draft);
    clearDraft();
    expect(loadDraft().def.name).toBe("");
  });
});
