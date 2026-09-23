import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyBlock, type CopyBlockProps } from "./CopyBlock";

const meta = {
  title: "Chrome/CopyBlock",
  component: CopyBlock,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CopyBlock>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    label: "blurb — one line",
    hint: "paste into a chat",
    value: "Riprap is peer-to-peer cover on Solana. riprap.xyz",
    children: (
      <p className="m-0 text-body [font:var(--riprap-body-sm)]">
        Riprap is peer-to-peer cover on Solana. riprap.xyz
      </p>
    ),
  } satisfies CopyBlockProps,
};
