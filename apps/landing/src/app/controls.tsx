// The /app-family wallet controls, shared by the member surface (#/app) and
// the payout-request wizard (#/app/file-claim): the cluster switch, the
// connected-wallet address chip + Disconnect, the connect button with the
// kit's wallet picker, and the navbar right side assembled from them
// (copy doc § /app nav). Kit chrome only — the kit itself stays Solana-free.
import { AddressChip, Button, ClusterSelect, WalletDialog } from "@riprap/ui";
import {
  useCluster,
  useConnectWallet,
  useDisconnectWallet,
  useWallet,
  useWalletConnectors,
  type WalletConnectorId,
} from "@solana/connector";
import { type ComponentProps, useState } from "react";

/** The inline cluster switch for the not-live empty state (copy doc § /app,
 * same component as the pool page's). */
export function ClusterSwitch() {
  const { clusters, cluster, setCluster } = useCluster();
  return (
    <ClusterSelect
      className="w-44"
      clusters={clusters.map((c) => ({ value: c.id, label: c.label }))}
      value={cluster?.id}
      onValueChange={(value) => void setCluster(value as (typeof clusters)[number]["id"])}
    />
  );
}

/** Connected-wallet nav controls: the address as a copyable chip + Disconnect
 * (kit chrome only — the kit itself stays Solana-free). */
export function AccountControls({ address }: { address: string }) {
  const { disconnect } = useDisconnectWallet();
  return (
    <div className="flex items-center gap-2">
      <AddressChip address={address} />
      <Button variant="outline" onClick={() => void disconnect()}>
        Disconnect
      </Button>
    </div>
  );
}

/** Connect button + the kit's props-driven wallet picker — one wiring shared
 * by the navbar (`Connect wallet`) and the wallet gates (copy doc § /app and
 * § /app/file-claim: `Connect a wallet`); button chrome is the caller's. */
export function ConnectWalletButton({
  label,
  ...buttonProps
}: { label: string } & ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const connectors = useWalletConnectors();
  const { connect } = useConnectWallet();
  const { disconnect } = useDisconnectWallet();
  const { isConnected, account } = useWallet();

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <WalletDialog
        open={open}
        onOpenChange={setOpen}
        connectors={connectors.map((c) => ({ id: c.id, name: c.name }))}
        onConnect={(id) => {
          setOpen(false);
          void connect(id as WalletConnectorId);
        }}
        connected={isConnected}
        address={account ?? undefined}
        onDisconnect={() => void disconnect()}
      />
    </>
  );
}

/** The app-family navbar right side (copy doc § /app nav): the cluster
 * select + connect — connected wallets get their address chip + Disconnect
 * instead. Passed to SiteNav as `actions`, replacing the Open App CTA. */
export function AppNavControls() {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <div className="flex items-center gap-2">
      <ClusterSwitch />
      {connected && account !== null ? (
        <AccountControls address={account} />
      ) : (
        <ConnectWalletButton variant="outline" label="Connect wallet" />
      )}
    </div>
  );
}
