import type { Meta, StoryObj } from "@storybook/react-vite";
import { AddressChip, type AddressChipProps } from "./AddressChip";

// sample = devnet USDC mint, a reference deployment address (milestone riprap-9ehc)
const meta = {
  title: "Chrome/AddressChip",
  component: AddressChip,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AddressChip>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" } satisfies AddressChipProps,
};
