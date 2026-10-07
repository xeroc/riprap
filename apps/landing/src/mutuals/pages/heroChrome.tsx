// heroChrome — the small shared pieces every pool hero renders: the
// wallet-connect CTA (with the pool's acceptance note) and the not-live
// inline cluster switch. Copy per copy doc § on-chain states; the note is
// passed by each pool's hero (its own policy).
import { Button, ClusterSelect, WalletDialog } from "@riprap/ui";
import {
  useCluster,
  useConnectWallet,
  useDisconnectWallet,
  useWallet,
  useWalletConnectors,
  type WalletConnectorId,
} from "@solana/connector";
import type { ReactNode } from "react";
import { useState } from "react";

/** The inline cluster switch for the not-live empty state (copy doc § on-chain states). */
export function HeroClusterSwitch() {
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

/** `Connect a wallet to chip in` — opens the kit's props-driven wallet picker
 *  wired to the ConnectorKit hooks (the kit itself stays Solana-free). */
export function ConnectWalletCta({ note }: { note: ReactNode }) {
  const [open, setOpen] = useState(false);
  const connectors = useWalletConnectors();
  const { connect } = useConnectWallet();
  const { disconnect } = useDisconnectWallet();
  const { isConnected, account } = useWallet();

  return (
    <>
      <Button size="lg" data-participate onClick={() => setOpen(true)}>
        Connect a wallet to chip in
      </Button>
      {note}
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
