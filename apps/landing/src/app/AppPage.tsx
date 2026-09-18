// /app — the member wallet surface, reads-only v1 (milestone riprap-9ehc,
// bean riprap-c1r1): wallet gate → the connected wallet's Member PDA + claims
// against the static per-cluster mutual map (src/pool/mutual.ts). No writes.
// Copy source: meta/marketing/03-website-copy/landing-page.md § "/app — the
// member wallet surface" — rendered verbatim; unknown values render
// {{PARAM}} mono placeholders, never static numbers.
import { ClaimStatus } from "@riprap/hanse";
import {
  AddressChip,
  BadgeStamp,
  Button,
  ClusterSelect,
  HexBackdrop,
  LogoLockup,
  SectionBand,
  TextLink,
  TopNav,
  usd,
  WalletDialog,
} from "@riprap/ui";
import {
  useCluster,
  useConnectWallet,
  useDisconnectWallet,
  useWallet,
  useWalletConnectors,
  type WalletConnectorId,
} from "@solana/connector";
import type { Address } from "@solana/kit";
import { useState } from "react";

import { Settle } from "../components/Settle";
import { formatUtc, microToUsd, poolTiers, resolveMutualAddress } from "../pool/mutual";
import { useMutual } from "../pool/useMutual";
import { type ClaimsQuery, useClaims } from "./useClaims";
import { useMembership } from "./useMembership";

/** The inline cluster switch for the not-live empty state (copy doc § /app,
 * same component as the pool page's). */
function ClusterSwitch() {
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
function AccountControls({ address }: { address: string }) {
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

/** The connect gate (copy doc § /app wallet gate) — the kit's props-driven
 * wallet picker wired to the ConnectorKit hooks. */
function WalletGate() {
  const [open, setOpen] = useState(false);
  const connectors = useWalletConnectors();
  const { connect } = useConnectWallet();
  const { disconnect } = useDisconnectWallet();
  const { isConnected, account } = useWallet();

  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)]">
          Members' entrance
        </h1>
      </Settle>
      <Settle delay={60}>
        <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          Connect the wallet you joined with. This surface only reads.
        </p>
      </Settle>
      <Settle delay={120}>
        <Button size="lg" data-participate onClick={() => setOpen(true)}>
          Connect a wallet
        </Button>
      </Settle>
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
    </div>
  );
}

/** On-chain status → the mono stamp word (copy doc § /app: status renders the
 * ClaimStatus name, uppercase-in-mono only). */
function statusLabel(status: ClaimStatus): string {
  return ClaimStatus[status]?.toUpperCase() ?? "{{PARAM}}";
}

/** The claims list (copy doc § /app claims): hairline rows, every field mono
 * and straight off the chain — `#nonce · amount · STATUS · filed date`. */
function ClaimsBlock({ claims }: { claims: ClaimsQuery }) {
  const label = (
    <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
      Claims
    </p>
  );

  if (claims.state === "loading") {
    return (
      <div data-slot="claims" className="flex max-w-[36rem] flex-col gap-2">
        {label}
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading your claims from the chain.
        </p>
      </div>
    );
  }
  if (claims.state === "error") {
    return (
      <div data-slot="claims" className="flex max-w-[36rem] flex-col gap-2">
        {label}
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't read your claims.</p>
        <Button variant="outline" className="w-44" onClick={claims.retry}>
          Try again
        </Button>
      </div>
    );
  }
  if (claims.state === "off") return null; // seeds still assembling — reads pending

  return (
    <div data-slot="claims" className="flex max-w-[36rem] flex-col gap-2">
      {label}
      {claims.claims.length === 0 ? (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          No claims filed from this wallet.
        </p>
      ) : (
        <ul className="w-full">
          {claims.claims.map(({ nonce, claim }) => (
            <li
              key={nonce.toString()}
              data-num
              className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-hairline py-2 font-mono text-sm text-ink"
            >
              <span>
                {`#${nonce.toString()} · ${usd(microToUsd(claim.claimAmount))} · ${statusLabel(claim.status)}`}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                filed {formatUtc(claim.filedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Connected surface: membership + claims reads against the static map. */
function MemberSurface({ wallet }: { wallet: Address }) {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const mutualAddress = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const mutualQuery = useMutual();
  const membership = useMembership();
  const member = membership.state === "ready" ? membership.member : null;
  const claims = useClaims(
    mutualQuery.state === "ready" && member !== null && mutualAddress !== undefined
      ? { mutual: mutualAddress, claimant: wallet, claimNonce: mutualQuery.mutual.claimNonce }
      : null,
  );

  if (mutualQuery.state === "not-found") {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-live">
        <p className="text-ink [font:var(--riprap-body-md)]">Not live on this cluster</p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          The Blade Pool isn't deployed on this network. Switch networks to find it.
        </p>
        <ClusterSwitch />
      </div>
    );
  }
  if (mutualQuery.state === "loading") {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading the pool from the chain.
      </p>
    );
  }
  if (mutualQuery.state === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
        <Button variant="outline" className="w-44" onClick={mutualQuery.retry}>
          Try again
        </Button>
      </div>
    );
  }

  // mutual ready — the membership read runs only with a resolved address.
  if (membership.state === "off" || membership.state === "loading") {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading your membership from the chain.
      </p>
    );
  }
  if (membership.state === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't read your membership.</p>
        <Button variant="outline" className="w-44" onClick={membership.retry}>
          Try again
        </Button>
      </div>
    );
  }
  if (member === null) {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-a-member">
        <h1 className="text-ink [font:var(--riprap-body-md)]">This wallet isn't in the pool.</h1>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Membership opens on <TextLink href="/2026-breakpoint-blade-pool">the pool page</TextLink>.
        </p>
      </div>
    );
  }

  // covered — the Member PDA's tier wins (copy doc § /app member).
  const tiers = poolTiers(mutualQuery.mutual);
  const tier = tiers[Math.min(member.tier, tiers.length - 1)];

  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="covered">
      <Settle>
        <h1>
          <BadgeStamp data-num>Covered — {tier.name}</BadgeStamp>
        </h1>
      </Settle>
      <Settle delay={60}>
        <p data-num className="font-mono text-base text-ink">
          {usd(tier.fee)} entry · up to {usd(tier.cap)} maximum payout
        </p>
      </Settle>
      <Settle delay={120}>
        <ClaimsBlock claims={claims} />
      </Settle>
    </div>
  );
}

export function AppPage() {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <>
      <TopNav
        className="sticky top-0 z-40"
        links={[
          { href: "/", label: "riprap.xyz" },
          { href: "/2026-breakpoint-blade-pool", label: "Blade Pool" },
        ]}
        brand={<LogoLockup size={22} />}
        actions={connected && account !== null ? <AccountControls address={account} /> : null}
      />
      <main>
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="app"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            {connected && account !== null ? <MemberSurface wallet={account} /> : <WalletGate />}
          </SectionBand>
        </div>
      </main>
    </>
  );
}
