import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommitRevealVote, type CommitRevealVoteProps } from "./CommitRevealVote";
import { SvgFrame } from "./SvgFrame";

type CommitRevealVoteStoryProps = CommitRevealVoteProps;

const CommitRevealVoteStory = (args: CommitRevealVoteStoryProps) => (
  <SvgFrame
    width={420}
    height={300}
    title="Commit reveal vote"
    desc="Two cells, one vote: sealed first, opened second — all commits before any reveal."
  >
    <CommitRevealVote {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/CommitRevealVote",
  component: CommitRevealVoteStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CommitRevealVoteStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 20,
    y: 20,
    votes: ["pay", "reject", "pay"],
  },
};
