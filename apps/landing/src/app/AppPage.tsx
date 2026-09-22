// #/app — the member wallet surface (milestone riprap-9ehc, bean riprap-c1r1;
// payout-request entry added 2026-09-22, CLAIM-WIZARD §2): wallet gate → the
// connected wallet's Member PDA + claims against the static per-cluster
// mutual map (src/pool/mutual.ts). The surface's writes live in the wizard
// route (#/app/file-claim); this page itself still only reads.
// Copy source: meta/marketing/03-website-copy/landing-page.md § "/app — the
// member wallet surface" — rendered verbatim; unknown values render
// {{PARAM}} mono placeholders, never static numbers.
import { ClaimStatus } from "@riprap/hanse";
import {
  BadgeStamp,
  Button,
  buttonVariants,
  HexBackdrop,
  SectionBand,
  TextLink,
  usd,
} from "@riprap/ui";
import { useCluster, useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useState } from "react";
import { Settle } from "../components/Settle";
import { SiteNav } from "../components/SiteNav";
import { formatUtc, microToUsd, poolTiers, resolveMutualAddress } from "../pool/mutual";
import { useMinStake } from "../pool/useMinStake";
import { useMutual } from "../pool/useMutual";
import { useClusterRpc } from "../shared/rpc";
import { AppNavControls, ClusterSwitch, ConnectWalletButton } from "./controls";
import { deliveryComplete } from "./file-claim/evidenceRecord";
import { Recovery } from "./file-claim/Recovery";
import { useClaimPreflight } from "./file-claim/useClaimPreflight";
import { type ClaimsQuery, useClaims } from "./useClaims";
import { useMembership } from "./useMembership";

/** The connect gate (copy doc § /app wallet gate): the entrance copy + the
 * shared connect button carrying the picker. */
function WalletGate() {
  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)]">
          Members' entrance
        </h1>
      </Settle>
      <Settle delay={60}>
        <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          Connect the wallet you joined with.
        </p>
      </Settle>
      <Settle delay={120}>
        <ConnectWalletButton size="lg" data-participate label="Connect a wallet" />
      </Settle>
    </div>
  );
}

/** On-chain status → the mono stamp word (copy doc § /app: status renders the
 * ClaimStatus name, uppercase-in-mono only). */
function statusLabel(status: ClaimStatus): string {
  return ClaimStatus[status]?.toUpperCase() ?? "{{PARAM}}";
}

/** The claims list (copy doc § /app claims): hairline rows, every field mono
 * and straight off the chain — `#nonce · amount · STATUS · filed date` —
 * plus the evidence line + recovery entry (copy doc § /app "Claim rows,
 * evidence + recovery", 2026-09-22). */
function ClaimsBlock({
  claims,
  mutual,
  subaccord,
}: {
  claims: ClaimsQuery;
  mutual: Address;
  subaccord: Address;
}) {
  const [openRecovery, setOpenRecovery] = useState<bigint | null>(null);
  const label = (
    <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
      Claims
    </p>
  );
  const clusterRpc = useClusterRpc();
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
          {claims.claims.map(({ nonce, claim }) => {
            const complete = deliveryComplete(mutual, nonce);
            return (
              <li
                key={nonce.toString()}
                data-num
                className="flex flex-col border-t border-hairline py-2 font-mono text-sm text-ink"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span>
                    {`#${nonce.toString()} · ${usd(microToUsd(claim.claimAmount))} · ${statusLabel(claim.status)}`}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    filed {formatUtc(claim.filedAt)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-4">
                  <span className="font-mono text-xs text-stone">
                    {complete ? "Evidence: complete" : "Evidence: incomplete"}
                  </span>
                  {!complete && clusterRpc !== null ? (
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => setOpenRecovery(openRecovery === nonce ? null : nonce)}
                    >
                      Resume evidence delivery
                    </Button>
                  ) : null}
                </div>
                {openRecovery === nonce && clusterRpc !== null ? (
                  <Recovery
                    clusterRpc={clusterRpc}
                    mutual={mutual}
                    subaccord={subaccord}
                    dispute={claim.dispute}
                    nonce={nonce}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MemberSurface({ wallet }: { wallet: Address }) {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const mutualAddress = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const mutualQuery = useMutual();
  const minStake = useMinStake(mutualQuery.state === "ready" ? mutualQuery.mutual.subaccord : null);
  const membership = useMembership();
  const member = membership.state === "ready" ? membership.member : null;
  const preflight = useClaimPreflight();
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
          Membership opens on <TextLink href="#/2026-breakpoint-blade-pool">the pool page</TextLink>
          .
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
      <Settle delay={90}>
        {/* payout-request entry (copy doc § /app): only while preflight passes */}
        {preflight.state === "pass" ? (
          <div data-slot="file-claim-entry">
            <a className={buttonVariants({ variant: "primary" })} href="#/app/file-claim">
              File a payout request
            </a>
          </div>
        ) : null}
      </Settle>
      <Settle delay={60}>
        <p data-num className="font-mono text-base text-ink">
          {usd(tier.fee)} entry · up to {usd(tier.cap)} maximum payout
        </p>
      </Settle>
      <Settle delay={120}>
        {/* mutual ready implies the address resolved — wallet is an
            impossible-branch key fallback for the type, never hit */}
        <ClaimsBlock
          claims={claims}
          mutual={mutualAddress ?? wallet}
          subaccord={mutualQuery.mutual.subaccord}
        />
      </Settle>
      <Settle delay={180}>
        {/* juror panel (copy doc § /app): the covered overlay's destination */}
        <div
          id="jurors"
          data-slot="jurors"
          className="flex max-w-[36rem] scroll-mt-24 flex-col gap-2"
        >
          <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
            Jurors
          </p>
          <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-sm)]">
            Claims are settled by members who stake{" "}
            <span data-num className="font-mono">
              {minStake}
            </span>{" "}
            USDC and get drawn to read the evidence. Coherent jurors get paid; incoherent ones get
            slashed. Unstake anytime. <span className="text-ink">Staking opens here.</span>
          </p>
        </div>
      </Settle>
    </div>
  );
}

export function AppPage() {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <>
      <SiteNav actions={<AppNavControls />} />
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
