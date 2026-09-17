import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../ui/button";
import { type WalletConnector, WalletDialog, type WalletDialogProps } from "./WalletDialog";

const meta = {
  title: "Chrome/WalletDialog",
  component: WalletDialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof WalletDialog>;

export default meta;

// sample connector names — the app passes the real list from its wallet layer
const CONNECTORS: WalletConnector[] = [
  { id: "phantom", name: "Phantom" },
  { id: "solflare", name: "Solflare" },
];

// sample address = devnet USDC mint, a reference deployment (milestone riprap-9ehc)
const ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

function Playground(props: Partial<WalletDialogProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open wallet dialog
      </Button>
      <WalletDialog
        open={open}
        onOpenChange={setOpen}
        connectors={CONNECTORS}
        onConnect={() => setOpen(false)}
        onDisconnect={() => setOpen(false)}
        {...props}
      />
    </>
  );
}

export const Picker: StoryObj<typeof meta> = {
  args: { open: false, onOpenChange: () => {}, connectors: CONNECTORS, onConnect: () => {} },
  render: () => <Playground />,
};

export const Connected: StoryObj<typeof meta> = {
  args: {
    open: false,
    onOpenChange: () => {},
    connectors: CONNECTORS,
    onConnect: () => {},
    connected: true,
    address: ADDRESS,
  },
  render: () => <Playground connected address={ADDRESS} />,
};

export const NoWallets: StoryObj<typeof meta> = {
  args: { open: false, onOpenChange: () => {}, connectors: [], onConnect: () => {} },
  render: () => <Playground connectors={[]} />,
};
