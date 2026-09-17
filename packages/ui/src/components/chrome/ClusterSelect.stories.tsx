import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { type ClusterOption, ClusterSelect, type ClusterSelectProps } from "./ClusterSelect";

const meta = {
  title: "Chrome/ClusterSelect",
  component: ClusterSelect,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ClusterSelect>;

export default meta;

// the milestone cluster set (riprap-9ehc): devnet default, plus localnet and
// mainnet-beta — the app owns the ids and the actual switch
const CLUSTERS: ClusterOption[] = [
  { value: "devnet", label: "devnet" },
  { value: "localnet", label: "localnet" },
  { value: "mainnet-beta", label: "mainnet-beta" },
];

export const Default: StoryObj<typeof meta> = {
  args: { clusters: CLUSTERS, value: "devnet", onValueChange: () => {} },
  render: (args) => <Playground {...args} />,
};

export const Unselected: StoryObj<typeof meta> = {
  args: { clusters: CLUSTERS, onValueChange: () => {} },
  render: (args) => <Playground {...args} />,
};

function Playground(props: ClusterSelectProps) {
  const [value, setValue] = useState(props.value);
  return <ClusterSelect {...props} value={value} onValueChange={setValue} />;
}
