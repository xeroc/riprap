// PolicyStep suite (riprap-8sra): the step-2 POLICY contract
// (ADJUDICATION-DASHBOARD §4/§7, copy doc § /app/adjudicate step 2) — every
// coverage criterion (policy §3) and exclusion (policy §4) rendered
// verbatim from the pack, yes/no/unsure all admissible answers with blank
// the only blocker, free back-nav, and the §8 answer persistence keyed
// (mutual, dispute, round). Every rendered string is quoted from the copy
// doc / the blade-pool pack.
import {
  cleanup,
  fireEvent,
  type RenderResult,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import {
  checklistComplete,
  clearPolicyAnswers,
  type PolicyAnswer,
  PolicyStep,
  policyAnswersKey,
} from "./PolicyStep";
import { BLADE_POOL_POLICY } from "./policies/blade-pool";

const criteria = BLADE_POOL_POLICY.coverageCriteria;
const { exclusions } = BLADE_POOL_POLICY;
const QUESTIONS = [...criteria, ...exclusions];
const STORAGE_KEY = policyAnswersKey("M".repeat(43), "D".repeat(43), 0);

function renderStep(
  over: Partial<Parameters<typeof PolicyStep>[0]> = {},
): RenderResult & { onBack: Mock; onDone: Mock } {
  const onBack = vi.fn();
  const onDone = vi.fn();
  const view = render(
    <PolicyStep
      criteria={criteria}
      exclusions={exclusions}
      storageKey={STORAGE_KEY}
      onBack={onBack}
      onDone={onDone}
      {...over}
    />,
  );
  return { ...view, onBack, onDone };
}

/** The question's row (each question text is unique across the checklist). */
function questionRow(question: string): HTMLElement {
  const row = screen.getAllByText(question)[0].closest('[data-slot="policy-question"]');
  if (row === null) {
    throw new Error(`question not rendered: ${question}`);
  }
  return row as HTMLElement;
}

/** Answer one question by clicking its station (copy-doc labels Yes/No/Unsure). */
function answer(question: string, station: PolicyAnswer): void {
  const label = station === "yes" ? "Yes" : station === "no" ? "No" : "Unsure";
  fireEvent.click(within(questionRow(question)).getByRole("radio", { name: label }));
}

function continueButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
}

/** Answer every question (defaults to all-unsure — the weakest admissible set). */
function answerAll(station: PolicyAnswer = "unsure"): void {
  for (const question of QUESTIONS) {
    answer(question, station);
  }
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("PolicyStep — checklist rendering (copy doc § step 2, policy §3/§4)", () => {
  it("renders the intro verbatim and both group headings", () => {
    renderStep();
    expect(
      screen.getByText("Answer every question. Yes, no, and unsure all count — blank doesn't."),
    ).toBeTruthy();
    expect(screen.getByText("Coverage criteria")).toBeTruthy();
    expect(screen.getByText("Exclusions")).toBeTruthy();
  });

  it("renders every criterion and exclusion verbatim from the pack — five §3, ten §4", () => {
    renderStep();
    for (const question of QUESTIONS) {
      expect(screen.getByText(question)).toBeTruthy();
    }
    expect(criteria).toHaveLength(5);
    expect(exclusions).toHaveLength(10);
  });

  it("offers exactly three stations per question: Yes · No · Unsure", () => {
    renderStep();
    const row = questionRow(QUESTIONS[0] as string);
    for (const label of ["Yes", "No", "Unsure"]) {
      expect(within(row).getByRole("radio", { name: label })).toBeTruthy();
    }
  });
});

describe("PolicyStep — blank is the only blocker (spec §4: unanswered checklist blocks the verdict)", () => {
  it("Continue stays disabled until the last blank is answered", () => {
    renderStep();
    expect(continueButton().disabled).toBe(true);
    for (const [i, question] of QUESTIONS.entries()) {
      answer(question, "yes");
      expect(continueButton().disabled).toBe(i < QUESTIONS.length - 1);
    }
  });

  it("unsure is a valid answer — an all-unsure checklist opens Continue", () => {
    renderStep();
    answerAll("unsure");
    expect(continueButton().disabled).toBe(false);
  });

  it("switching an answer keeps the checklist complete and moves the station", () => {
    renderStep();
    answerAll("yes");
    answer(QUESTIONS[0] as string, "no");
    expect(continueButton().disabled).toBe(false);
    expect(
      (
        within(questionRow(QUESTIONS[0] as string)).getByRole("radio", {
          name: "No",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
  });

  it("back is free at any time", () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Continue advances once no question is blank", () => {
    const { onDone } = renderStep();
    answerAll();
    fireEvent.click(continueButton());
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("PolicyStep — §8 persistence (answers keyed (mutual, dispute, round))", () => {
  it("answers survive an unmount/remount under the same key; a different key starts blank", () => {
    const { unmount } = renderStep();
    answer(QUESTIONS[0] as string, "yes");
    unmount();

    const { rerender } = renderStep();
    expect(
      (
        within(questionRow(QUESTIONS[0] as string)).getByRole("radio", {
          name: "Yes",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(continueButton().disabled).toBe(true); // the other fourteen are still blank
    rerender(
      <PolicyStep
        criteria={criteria}
        exclusions={exclusions}
        storageKey={policyAnswersKey("M".repeat(43), "D".repeat(43), 1)}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );
    expect(continueButton().disabled).toBe(true); // round 1 key: nothing carried
  });

  it("clearPolicyAnswers empties the store for the outcome screen", () => {
    const { unmount } = renderStep();
    answerAll("no");
    unmount();
    clearPolicyAnswers(STORAGE_KEY);

    renderStep();
    expect(
      (
        within(questionRow(QUESTIONS[0] as string)).getByRole("radio", {
          name: "No",
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
    expect(continueButton().disabled).toBe(true);
  });
});

describe("checklistComplete — the pure forward gate", () => {
  it("blank blocks; partial blocks; unsure alone completes", () => {
    const one = { [QUESTIONS[0] as string]: "unsure" } as const;
    expect(checklistComplete(QUESTIONS, {})).toBe(false);
    expect(checklistComplete(QUESTIONS.slice(0, 1), one)).toBe(true);
    expect(checklistComplete(QUESTIONS, one)).toBe(false);
  });
});
