import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "./avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Avatar>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/64?img=68" />
      <AvatarFallback>JP</AvatarFallback>
    </Avatar>
  ),
};

export const JurorGroup: StoryObj<typeof meta> = {
  render: () => (
    <AvatarGroup>
      {["J1", "J2", "J3"].map((initials) => (
        <Avatar key={initials}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
};
