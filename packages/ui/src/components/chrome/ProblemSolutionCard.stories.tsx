import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProblemSolutionCard } from "./ProblemSolutionCard";

// copy sourced verbatim from apps/pitch-seed-raise/PROBLEMS.md (GP review,
// 2026-09-18) — values never invented here; the deck passes rows from that
// table the same way the landing passes copy from the marketing source doc
const meta = {
  title: "Chrome/ProblemSolutionCard",
  component: ProblemSolutionCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ProblemSolutionCard>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    index: "05",
    question: "Surplus take-rate yields zero revenue at zero loss.",
    answer:
      "Charge on flow, not surplus: protocol and organizer take on entry, which survives every loss ratio. The pilot stays zero-take to prove member value first.",
  },
};

export const WithoutIndex: StoryObj<typeof meta> = {
  args: {
    ...Default.args,
    index: undefined,
  },
};

export const Grid: StoryObj<typeof meta> = {
  args: { ...Default.args },
  render: () => (
    <div className="grid w-full max-w-6xl gap-6 md:grid-cols-3">
      <ProblemSolutionCard
        index="02"
        question="The legal thesis is asserted, not evidenced; no memo, no named counsel."
        answer="Written UK-counsel opinion pre-close, and the cliff map in the deck as milestones."
      />
      <ProblemSolutionCard
        index="06"
        question="Organizer distribution is logic, not evidence."
        answer="3–5 organizer conversations, at least 2 signed LOIs to distribute before the raise closes."
      />
      <ProblemSolutionCard
        index="11"
        question="The $1.61T mutual figure is validation of the model, not Riprap's TAM."
        answer="Mutuality works at $1.6T scale in the analog world; today's serviceable market is event-protection attach."
      />
    </div>
  ),
};
