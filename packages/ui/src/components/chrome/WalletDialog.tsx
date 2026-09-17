import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AddressChip } from "./AddressChip";

/**
 * `WalletDialog` — the props-driven wallet picker, mounted on the kit Dialog
 * (ruled plate, radius 0, settle-in by opacity). The kit never imports a
 * wallet library: the app passes its connector list and callbacks, so this
 * component stays Solana-free (milestone riprap-9ehc: zero @solana/* deps
 * in @riprap/ui).
 *
 * Disconnected: one full-width outline button per connector — picking one
 * calls `onConnect(id)` (the app closes the dialog). An empty connector
 * list renders the disabled state. Connected: the address as a copyable
 * `AddressChip` plus a disconnect button. Unknown address renders the
 * `{{ADDRESS}}` mono placeholder (kit data law).
 */
export interface WalletConnector {
  /** connector id, passed back through onConnect — the app maps it to its wallet layer */
  id: string;
  /** display name, rendered verbatim (e.g. "Phantom") */
  name: string;
}

export interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** available connectors; empty renders the disabled state */
  connectors: WalletConnector[];
  onConnect: (id: string) => void;
  connected?: boolean;
  /** the connected address, shown as a copyable chip */
  address?: string;
  onDisconnect?: () => void;
  className?: string;
}

export function WalletDialog({
  open,
  onOpenChange,
  connectors,
  onConnect,
  connected = false,
  address,
  onDisconnect,
  className,
}: WalletDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-xs", className)}>
        {connected ? (
          <>
            <DialogHeader>
              <DialogTitle>Wallet connected</DialogTitle>
              <DialogDescription>Transactions sign with this wallet.</DialogDescription>
            </DialogHeader>
            {address ? (
              <AddressChip address={address} className="w-full justify-center" />
            ) : (
              <span
                data-num=""
                className="[font:var(--riprap-mono-label)] tracking-(--riprap-tracking-stamp) text-muted-foreground"
              >
                {"{{ADDRESS}}"}
              </span>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={onDisconnect}>
                Disconnect
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Connect a wallet</DialogTitle>
              <DialogDescription>Pick a wallet to continue.</DialogDescription>
            </DialogHeader>
            <div data-slot="wallet-connectors" className="flex flex-col gap-2">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onConnect(connector.id)}
                >
                  {connector.name}
                </Button>
              ))}
              {connectors.length === 0 && (
                <Button variant="outline" className="w-full justify-start" disabled>
                  No wallets available
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
