import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Select>;

export default meta;

// tier prices from the policy table (policy §5) — demo values only here
export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Select defaultValue="standard">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Choose a tier" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>tier</SelectLabel>
          <SelectItem value="basic">Basic — $10 in, up to $1,000</SelectItem>
          <SelectItem value="standard">Standard — $20 in, up to $2,000</SelectItem>
          <SelectItem value="premium">Premium — $40 in, up to $4,000</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="none">Not this event</SelectItem>
      </SelectContent>
    </Select>
  ),
};
