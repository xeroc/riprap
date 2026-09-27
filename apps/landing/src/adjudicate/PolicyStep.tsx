// PolicyStep.tsx — wizard step 2 POLICY (ADJUDICATION-DASHBOARD §4/§7, copy
// doc § /app/adjudicate step 2): every coverage criterion (policy §3) and
// every exclusion (policy §4) answered — yes / no / unsure are all valid
// answers; blank is not. Items come from the AdjudicationPolicy module
// (spec §7 — the engine consumes the interface, never blade specifics);
// the session shell passes the pack's lists in.
//
// §8 persistence: answers persist in localStorage keyed (mutual, dispute,
// round) — a 48h review window must survive a phone reload. Opinions, not
// PII — dispute-scoped, cleared by the outcome screen through
// clearPolicyAnswers. Back free; Continue blocked while any question is
// blank (an unanswered checklist blocks the verdict, spec §4).

import { Button, Radio } from "@riprap/ui";
import { useEffect, useState } from "react";

import { Settle } from "../components/Settle";

/** One admissible answer (copy doc § step 2: `Yes, no, and unsure all
 * count — blank doesn't.`). Blank is the absence of a record, not a value. */
export type PolicyAnswer = "yes" | "no" | "unsure";

/** The step's persisted answers (§8), keyed by question text — the pack's
 * strings are the question identities. */
export type PolicyAnswers = Record<string, PolicyAnswer>;

/** §8 key convention: answers keyed (mutual, dispute, round). */
export function policyAnswersKey(mutual: string, dispute: string, round: number): string {
  return `riprap.adjudicate.policy.${mutual}.${dispute}.${round}`;
}

/** The outcome screen's clear (§8: answers clear with the outcome). */
export function clearPolicyAnswers(storageKey: string): void {
  localStorage.removeItem(storageKey);
}

/** The forward gate, pure (spec §4: unanswered checklist blocks the
 * verdict) — the wizard shell reuses it for lock-step step opening. */
export function checklistComplete(questions: readonly string[], answers: PolicyAnswers): boolean {
  return questions.every((question) => answers[question] !== undefined);
}

/** The three stations (copy doc § step 2), in answer order. */
const STATIONS: { value: PolicyAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];

function loadAnswers(storageKey: string): PolicyAnswers {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw === null ? null : (JSON.parse(raw) as unknown);
    if (parsed === null || typeof parsed !== "object") {
      return {};
    }
    const answers: PolicyAnswers = {};
    for (const [question, value] of Object.entries(parsed)) {
      if (value === "yes" || value === "no" || value === "unsure") {
        answers[question] = value;
      }
    }
    return answers;
  } catch {
    return {};
  }
}

/** The persisted answers, validated (§8) — shared by the step's state and
 * the wizard's completeness gate. */
export function loadPolicyAnswers(storageKey: string): PolicyAnswers {
  return loadAnswers(storageKey);
}

/** One question row: the statement plus its three stations (native radio
 * group — one answer at a time, blank until taken). */
function Question({
  id,
  question,
  answer,
  onAnswer,
}: {
  id: string;
  question: string;
  answer: PolicyAnswer | undefined;
  onAnswer: (value: PolicyAnswer) => void;
}) {
  return (
    <div className="flex flex-col gap-2" data-slot="policy-question">
      <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">{question}</p>
      <div className="flex items-center gap-6" role="radiogroup" aria-label={question}>
        {STATIONS.map((station) => (
          <label
            key={station.value}
            htmlFor={`${id}-${station.value}`}
            className="flex cursor-pointer items-center gap-2 text-body [font:var(--riprap-body-sm)]"
          >
            <Radio
              id={`${id}-${station.value}`}
              name={id}
              value={station.value}
              checked={answer === station.value}
              onChange={() => onAnswer(station.value)}
            />
            <span>{station.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * The step body. Owns the checklist state and its §8 persistence; the
 * session shell supplies the pack's criteria + exclusions, the storage
 * key, and the step-boundary callbacks. Back is free; Continue opens only
 * when no question is blank.
 */
export function PolicyStep({
  criteria,
  exclusions,
  storageKey,
  onBack,
  onDone,
}: {
  criteria: readonly string[];
  exclusions: readonly string[];
  storageKey: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [answers, setAnswers] = useState<PolicyAnswers>(() => loadAnswers(storageKey));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  const questions = [...criteria, ...exclusions];
  const complete = checklistComplete(questions, answers);

  const onAnswer = (question: string, value: PolicyAnswer) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        Answer every question. Yes, no, and unsure all count — blank doesn't.
      </p>
      <section className="flex max-w-xl flex-col gap-4" data-slot="policy-coverage">
        <h3 className="text-ink [font:var(--riprap-body-md)]">Coverage criteria</h3>
        {criteria.map((question, i) => (
          <Question
            key={question}
            id={`coverage-${i}`}
            question={question}
            answer={answers[question]}
            onAnswer={(value) => onAnswer(question, value)}
          />
        ))}
      </section>
      <section className="flex max-w-xl flex-col gap-4" data-slot="policy-exclusions">
        <h3 className="text-ink [font:var(--riprap-body-md)]">Exclusions</h3>
        {exclusions.map((question, i) => (
          <Question
            key={question}
            id={`exclusion-${i}`}
            question={question}
            answer={answers[question]}
            onAnswer={(value) => onAnswer(question, value)}
          />
        ))}
      </section>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!complete} onClick={onDone}>
          Continue
        </Button>
      </div>
    </Settle>
  );
}
