// VerdictStep suite (riprap-8sra): the step-3 VERDICT contract
// (ADJUDICATION-DASHBOARD §4/§5, copy doc § /app/adjudicate step 3) — the
// as-filed amount in mono (chain-clamped, {{PARAM}} until read), the
// pack's verdictNote restating overpriced ⇒ Deny, and the binary choice
// labeled from the filed recipe constant (hanse-opt/v1: Approve = 0,
// Deny = 1 — file_claim.rs::option_label). No third option, no amount
// edit, back free. Every rendered string is quoted from the copy doc /
// the blade-pool pack.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

import { BLADE_POOL_POLICY } from "./policies/blade-pool";
import { VERDICT_OPTIONS, VerdictStep } from "./VerdictStep";

function renderStep(over: Partial<Parameters<typeof VerdictStep>[0]> = {}): {
  onBack: Mock;
  onDone: Mock;
} {
  const onBack = vi.fn();
  const onDone = vi.fn();
  render(
    <VerdictStep
      amountMicro={2_000_000_000n}
      note={BLADE_POOL_POLICY.verdictNote}
      onBack={onBack}
      onDone={onDone}
      {...over}
    />,
  );
  return { onBack, onDone };
}

afterEach(() => {
  cleanup();
});

describe("VerdictStep — the as-filed amount (copy doc § step 3, mono)", () => {
  it("renders `Requested: {{amount}} USDC` from the claim read", () => {
    renderStep();
    expect(screen.getByText("Requested: $2,000 USDC")).toBeTruthy();
  });

  it("renders the kit's {{PARAM}} placeholder until the chain answers", () => {
    renderStep({ amountMicro: null });
    expect(screen.getByText("Requested: {{PARAM}} USDC")).toBeTruthy();
  });

  it("marks the amount line as a numeral (type law: every numeral mono)", () => {
    renderStep();
    expect(screen.getByText("Requested: $2,000 USDC").getAttribute("data-num")).not.toBeNull();
  });
});

describe("VerdictStep — verdictNote (policy §4 tier-max exclusion lands here, not the checklist)", () => {
  it("restates the overpriced ⇒ Deny guidance verbatim from the pack", () => {
    renderStep();
    expect(
      screen.getByText(
        "The amount is as filed. The chain clamps it to the tier cap — the cap is the chain's job, not your question. An overpriced request can be denied outright.",
      ),
    ).toBeTruthy();
  });
});
describe("VerdictStep — the binary choice (hanse-opt/v1: Approve = 0, Deny = 1)", () => {
  it("offers exactly two choice buttons — Approve and Deny, no third", () => {
    renderStep();
    const labels = screen
      .getAllByRole("button")
      .map((button) => button.textContent ?? "")
      .filter((label) => label === "Approve" || label === "Deny");
    expect(labels).toEqual(["Approve", "Deny"]);
  });

  it("Approve advances carrying option index 0; Deny carries 1", () => {
    const { onDone } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onDone).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByRole("button", { name: "Deny" }));
    expect(onDone).toHaveBeenCalledWith(1);
  });

  it("back is free", () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("VERDICT_OPTIONS is the filed recipe: Approve = 0, Deny = 1 (spec §5)", () => {
    expect(VERDICT_OPTIONS).toEqual([
      { index: 0, label: "Approve" },
      { index: 1, label: "Deny" },
    ]);
  });
});
