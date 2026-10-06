import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberRow } from "./MemberRow";

const meta = {
  title: "Chrome/MemberRow",
  component: MemberRow,
  parameters: { layout: "centered" },
} satisfies Meta<typeof MemberRow>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { handle: "@dana", initial: "D", status: "in" },
};

export const List: StoryObj<typeof meta> = {
  args: { handle: "@dana", initial: "D", status: "in" },
  render: () => (
    <div className="w-[420px] border border-hairline bg-card">
      <MemberRow handle="@dana" initial="D" status="in" />
      <MemberRow handle="@fortyfathoms" initial="FF" status="in" />
      <MemberRow handle="@reefwatch" initial="R" status="drawn" />
    </div>
  ),
};
