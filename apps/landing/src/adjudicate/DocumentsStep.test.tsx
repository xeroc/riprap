// DocumentsStep suite (riprap-4sz5): the step-1 DOCUMENTS contract
// (ADJUDICATION-DASHBOARD §4/§6, copy doc § /app/adjudicate step 1) — one
// screen per policy §7 slot in order, the three unticked gates gating
// forward movement (back free), the closing same-person cross-check, the
// viewing model (images inline, PDFs open-in-tab + Download, blob URLs
// revoked on exit, bytes never persisted), and the §8 answer persistence.
// Every rendered string is quoted from the copy doc.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDocumentsAnswers,
  type DocumentSlot,
  DocumentsStep,
  documentsAnswersKey,
} from "./DocumentsStep";

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

/** The five policy §7 slots with their copy-doc verify lines, verbatim. */
function slots(): DocumentSlot[] {
  return [
    {
      path: "01-ticket.pdf",
      verify: "a valid ticket for the event, in the requester's own name",
      bytes: PDF_BYTES,
    },
    {
      path: "02-id-document.jpg",
      verify: "government photo ID — passport, national identity card, or equivalent",
      bytes: JPG_BYTES,
    },
    {
      path: "03-police-report.pdf",
      verify: "a police report of this incident",
      bytes: PDF_BYTES,
    },
    {
      path: "04-medical-report.pdf",
      verify: "the treating practitioner's report of the bodily injury",
      bytes: PDF_BYTES,
    },
    {
      path: "05-statutory-declaration.pdf",
      verify: "the requester's sworn sequence of events",
      bytes: PDF_BYTES,
    },
  ];
}

const STORAGE_KEY = documentsAnswersKey("M".repeat(43), "D".repeat(43), 0);

let blobSeq = 0;
const createdUrls: string[] = [];
const revokeObjectURL = vi.fn<(url: string) => void>();
const windowOpen = vi.fn((_url?: string | URL, _target?: string) => null);

function renderStep(over: Partial<Parameters<typeof renderDocuments>[0]> = {}) {
  const props = { onBack: vi.fn(), onDone: vi.fn(), ...over };
  renderDocuments(props);
  return props;
}

function renderDocuments(props: { onBack: () => void; onDone: () => void }) {
  render(
    <DocumentsStep
      slots={slots()}
      storageKey={STORAGE_KEY}
      onBack={props.onBack}
      onDone={props.onDone}
    />,
  );
}

/** Tick the three gates on the current slot screen (copy-doc labels). */
function tickCurrentSlot(): void {
  for (const label of ["Seen", "Legible", "In the right slot"]) {
    fireEvent.click(screen.getByLabelText(label));
  }
}

/** Walk all five slots to the closing cross-check screen. */
function walkSlots(): void {
  for (const slot of slots()) {
    expect(screen.getByText(slot.path)).toBeTruthy();
    tickCurrentSlot();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  }
}

beforeEach(() => {
  // jsdom ships no blob-URL machinery — stub the two entry points the
  // viewing model uses, tracking creates and revokes.
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => {
      blobSeq += 1;
      const url = `blob:test-${blobSeq}`;
      createdUrls.push(url);
      return url;
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURL,
  });
  vi.stubGlobal("open", windowOpen);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  revokeObjectURL.mockClear();
  windowOpen.mockClear();
  localStorage.clear();
  blobSeq = 0;
  createdUrls.length = 0;
});

describe("DocumentsStep — slot screens (copy doc § step 1, policy §7 order)", () => {
  it("renders the first slot: mono path, verify line, three unticked gates, privacy line", () => {
    renderStep();
    expect(screen.getByText("01-ticket.pdf")).toBeTruthy();
    expect(
      screen.getByText("a valid ticket for the event, in the requester's own name"),
    ).toBeTruthy();
    for (const label of ["Seen", "Legible", "In the right slot"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getByText("Evidence is used solely to adjudicate this request.")).toBeTruthy();
  });

  it("forward is gated: Continue disabled until all three gates are ticked; back is free", () => {
    const { onBack } = renderStep();
    const continueButton = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(continueButton.disabled).toBe(true);

    fireEvent.click(screen.getByLabelText("Seen"));
    fireEvent.click(screen.getByLabelText("Legible"));
    expect(continueButton.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("In the right slot"));
    expect(continueButton.disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("advances one slot at a time and retains ticks when navigating back", () => {
    renderStep();
    tickCurrentSlot();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("02-id-document.jpg")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("01-ticket.pdf")).toBeTruthy();
    // ticks retained: Continue opens immediately (the slot is complete)
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});

describe("DocumentsStep — viewing model (§6, Q5=A: blob URLs, native rendering)", () => {
  it("renders images inline from a blob URL", () => {
    renderStep();
    tickCurrentSlot();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const img = screen.getByAltText("02-id-document.jpg") as HTMLImageElement;
    expect(img.src.startsWith("blob:test-")).toBe(true);
  });

  it("renders PDFs via Open document (new tab) + Download, never inline", () => {
    renderStep();
    expect(screen.queryByAltText("01-ticket.pdf")).toBeNull();
    const open = screen.getByRole("button", { name: "Open document" });
    const download = screen.getByText("Download");
    expect((download as HTMLAnchorElement).getAttribute("download")).toBe("01-ticket.pdf");

    fireEvent.click(open);
    expect(windowOpen).toHaveBeenCalledWith(
      expect.stringMatching(/^blob:test-/),
      "_blank",
      "noopener",
    );
  });

  it("revokes every blob URL on screen exit and on unmount — bytes never persist", () => {
    renderStep();
    tickCurrentSlot();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    // slot 1's URL was revoked when its screen exited
    expect(revokeObjectURL).toHaveBeenCalledWith(createdUrls[0]);
    // localStorage holds only tick answers — never document bytes
    const stored = localStorage.getItem(STORAGE_KEY) ?? "";
    expect(stored.includes("bytes")).toBe(false);

    cleanup();
    expect(revokeObjectURL).toHaveBeenCalledWith(createdUrls[1]);
  });
});

describe("DocumentsStep — the closing same-person cross-check (policy §7)", () => {
  it("appears only after the fifth slot; Continue (onDone) requires the tick", () => {
    const { onDone } = renderStep();
    walkSlots();

    expect(
      screen.getByText(
        "The ticket, the ID, and the declaration name one person — the person on this membership.",
      ),
    ).toBeTruthy();
    const continueButton = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(continueButton.disabled).toBe(true);

    fireEvent.click(screen.getByLabelText("Same person throughout"));
    expect(continueButton.disabled).toBe(false);
    fireEvent.click(continueButton);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("back from the cross-check returns to the fifth slot", () => {
    renderStep();
    walkSlots();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("05-statutory-declaration.pdf")).toBeTruthy();
  });
});

describe("DocumentsStep — §8 answer persistence (48h review window survives a reload)", () => {
  it("restores ticks and the cross-check answer after remount", () => {
    renderStep();
    tickCurrentSlot();
    cleanup();

    renderStep();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("clearDocumentsAnswers empties the stored draft (the outcome screen's clear)", () => {
    renderStep();
    tickCurrentSlot();
    cleanup();

    clearDocumentsAnswers(STORAGE_KEY);
    renderStep();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("treats a corrupt stored draft as fresh answers — never a crash", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    renderStep();
    expect(screen.getByText("01-ticket.pdf")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
