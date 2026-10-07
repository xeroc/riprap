// #/app — the member wallet surface, reads-only v1 (milestone riprap-9ehc,
// bean riprap-c1r1): the app hero band (backdrop on — the Riprap App's
// identity: manage the mutuals this wallet participates in), then the
// joined-pools table in its own band (no backdrop): one membership read per
// LIVE pool (the mutuals store scan — no static map) → one row per pool
// this wallet entered, tabular like /mutuals. Per row: the pool's own
// payout-request wizard (#/app/file-claim/<pool>) and jury-duty board
// (#/app/adjudicate/<pool>), both buttons. No writes. Copy source:
// meta/marketing/03-website-copy/landing-page.md § "/app — the member
// wallet surface" and § /mutuals (table structure, shared state lines) —
// rendered verbatim where doc'd; unknown values render {{PARAM}} mono
// placeholders, never static numbers.
import { ClaimStatus, fetchMaybeMemberByOwner, type Member } from "@riprap/hanse";
import { BadgeStamp, Button, HexBackdrop, SectionBand, TextLink, usd } from "@riprap/ui";
import { useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Settle } from "../components/Settle";
import { SiteNav } from "../components/SiteNav";
import { poolRouteId } from "../mutuals/data";
import { PoolBadgeRail } from "../mutuals/PoolBadgeRail";
import { type LiveMutual, useMutualStore } from "../mutuals/store";
import { formatUtc, microToUsd, poolTiers } from "../pool/mutual";
import { useClusterRpc } from "../shared/rpc";
import { ClusterSwitch, ConnectWalletButton } from "./controls";
import { claimFlowFor } from "./file-claim/flows/index";
import { useClaimPreflight } from "./file-claim/useClaimPreflight";
import { type ClaimsQuery, useClaims } from "./useClaims";

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
 * and straight off the chain — `#nonce · amount · STATUS · filed date`. The
 * label names what the rows belong to (the pool, in the claims band). */
function ClaimsBlock({ claims, label = "Claims" }: { claims: ClaimsQuery; label?: string }) {
  const heading = (
    <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
      {label}
    </p>
  );

  if (claims.state === "loading") {
    return (
      <div data-slot="claims" className="flex max-w-[36rem] flex-col gap-2">
        {heading}
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading your claims from the chain.
        </p>
      </div>
    );
  }
  if (claims.state === "error") {
    return (
      <div data-slot="claims" className="flex max-w-[36rem] flex-col gap-2">
        {heading}
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
      {heading}
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

/** One joined pool's table row: the shared badge rail, the pool's name (→
 * its detail route) under its Covered stamp, its tagline, and the two row
 * actions — the payout wizard and the jury board, both buttons scoped to
 * THIS pool. File renders only while preflight passes (copy doc § /app,
 * CLAIM-WIZARD §2); the wizard's step 0 carries the honest block states
 * either way. */
function JoinedPoolRow({ pool, member }: { pool: LiveMutual; member: Member }) {
  const preflight = useClaimPreflight(pool.address);
  const flow = claimFlowFor(pool.listing);

  // covered — the Member PDA's tier wins (copy doc § /app member); names by
  // the listing's §5 table, prices from the chain.
  const tiers = poolTiers(
    pool.account,
    pool.listing.tiers.map((t) => t.name),
  );
  const tier = tiers[Math.min(member.tier, tiers.length - 1)];
  const routeId = poolRouteId(pool.listing);

  return (
    <tr data-slot="pool-row" className="border-b border-hairline last:border-b-0">
      <td className="relative h-24 p-0 pr-18">
        <PoolBadgeRail pool={pool.listing} />
      </td>
      <th scope="row" className="py-4 pr-4 text-left align-top">
        <a
          href={`#/m/${routeId}`}
          className="font-medium text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current [font:var(--riprap-body-sm)]"
        >
          {pool.listing.name}
        </a>
        <div className="mt-2">
          <BadgeStamp data-num>Covered — {tier.name}</BadgeStamp>
        </div>
      </th>
      <td className="hidden py-4 pr-4 text-body align-top sm:table-cell [font:var(--riprap-body-sm)]">
        {pool.listing.tagline}
      </td>
      <td className="py-4 align-top">
        <div className="flex flex-col items-start gap-2">
          {preflight.state === "pass" && flow !== null ? (
            <Button asChild size="sm" data-participate>
              <a href={`#/app/file-claim/${routeId}`}>File a payout request</a>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <a href={`#/app/adjudicate/${routeId}`}>Jury duty</a>
          </Button>
        </div>
      </td>
    </tr>
  );
}

/** One joined pool's claims, for the claims band: this wallet's filed
 *  payout requests against that pool — hairline rows under the pool's
 *  name, every field straight off the chain. */
function PoolClaims({ pool, wallet }: { pool: LiveMutual; wallet: Address }) {
  const claims = useClaims({
    mutual: pool.address,
    claimant: wallet,
    claimNonce: pool.account.claimNonce,
  });
  return <ClaimsBlock claims={claims} label={pool.listing.name} />;
}

/** Connected surface: scan every live pool on the cluster, read this
 * wallet's membership against each, and render the joined pools — the
 * table band (one row per entered pool, its filing and jury-duty actions)
 * and the claims band (this wallet's filed payout requests, pool by
 * pool). Shared scan states render in their own band. */
function MemberSurface({ wallet }: { wallet: Address }) {
  const store = useMutualStore();
  const clusterRpc = useClusterRpc();
  const pools = store.state === "ready" ? store.pools : [];
  const queryClient = useQueryClient();

  // The joined scan: one membership read per live pool. Keys mirror
  // useMembership's exactly, so anything else reading a membership by
  // [endpoint, address, wallet] shares this cache.
  const memberships = useQueries({
    queries: pools.map((pool) => ({
      queryKey: ["member", clusterRpc?.endpoint, pool.address, wallet],
      queryFn: () => {
        if (!clusterRpc) throw new Error("membership prerequisites disappeared mid-flight");
        return fetchMaybeMemberByOwner(clusterRpc.rpc, {
          mutual: pool.address,
          member: wallet,
        }).then((maybe) => (maybe.exists ? maybe.data : null));
      },
      enabled: clusterRpc !== null,
      retry: 1,
    })),
  });

  if (store.state === "off")
    return (
      <AppStateBand>
        <NotLive />
      </AppStateBand>
    );
  if (store.state === "error")
    return (
      <AppStateBand>
        <ClusterError retry={store.retry} />
      </AppStateBand>
    );
  if (store.state === "loading") {
    return (
      <AppStateBand>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading the pools from the chain.
        </p>
      </AppStateBand>
    );
  }
  if (pools.length === 0) {
    return (
      <AppStateBand>
        <p className="max-w-2xl leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
          No pools are live on this cluster yet.
        </p>
      </AppStateBand>
    );
  }

  if (memberships.some((q) => q.isPending)) {
    return (
      <AppStateBand>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading your membership from the chain.
        </p>
      </AppStateBand>
    );
  }
  const errored = memberships.find((q) => q.isError);
  if (errored !== undefined) {
    return (
      <AppStateBand>
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-ink [font:var(--riprap-body-md)]">Couldn't read your membership.</p>
          <Button
            variant="outline"
            className="w-44"
            onClick={() => {
              // retry re-runs the membership reads (refetch is idempotent)
              for (const pool of pools) {
                void queryClient.refetchQueries({
                  queryKey: ["member", clusterRpc?.endpoint, pool.address, wallet],
                });
              }
            }}
          >
            Try again
          </Button>
        </div>
      </AppStateBand>
    );
  }

  const joined = pools.flatMap((pool, i) => {
    const member = memberships[i].data ?? null;
    return member !== null ? [{ pool, member }] : [];
  });

  if (joined.length === 0) {
    return (
      <AppStateBand>
        <div className="flex max-w-2xl flex-col gap-2" data-slot="not-a-member">
          <p className="text-ink [font:var(--riprap-body-md)]">This wallet isn't in any pool.</p>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Membership opens on <TextLink href="#/mutuals">the pools</TextLink>.
          </p>
        </div>
      </AppStateBand>
    );
  }

  return (
    <>
      <SectionBand id="app-pools" label="your pools" tone="ground">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            The pools this wallet joined: each pool's cover and its filing and jury-duty actions.
          </caption>
          <thead>
            <tr className="border-b border-hairline text-left">
              {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: empty decorative strip column — th is not focusable, biome's heuristic over-reaches */}
              <th aria-hidden="true" className="w-[18px] p-0" />
              {["Pool", "Covers"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className={`pb-3 pr-4 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)] last:pr-0${h === "Covers" ? " hidden sm:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
              <th scope="col" className="sr-only">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {joined.map(({ pool, member }) => (
              <JoinedPoolRow key={pool.address} pool={pool} member={member} />
            ))}
          </tbody>
        </table>
      </SectionBand>
      <SectionBand id="app-claims" label="claims" tone="ground">
        <div className="flex w-full flex-col gap-(--riprap-space-xl)" data-slot="claims-list">
          {joined.map(({ pool }) => (
            <PoolClaims key={pool.address} pool={pool} wallet={wallet} />
          ))}
        </div>
      </SectionBand>
    </>
  );
}

/** The shared-state band the member surface's non-table states render in. */
function AppStateBand({ children }: { children: React.ReactNode }) {
  return (
    <SectionBand id="app-pools" tone="ground">
      {children}
    </SectionBand>
  );
}

/** Not-live state (copy doc § /app, verbatim with the pool page). */
function NotLive() {
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

/** Cluster-unreachable state (copy doc § /app, verbatim with the pool page). */
function ClusterError({ retry }: { retry: () => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
      <Button variant="outline" className="w-44" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

/** The connected hero: what this surface is — the app for the mutuals this
 *  wallet participates in. Mirrors /mutuals' display intro band. */
function AppHero() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          The app.
        </h1>
      </Settle>
      <Settle delay={60}>
        <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
          Every mutual this wallet joined — file a payout request or sit on a jury, pool by pool.
        </p>
      </Settle>
    </div>
  );
}

export function AppPage() {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <>
      <SiteNav inApp />
      <main>
        {/* the hero — the app's identity band, backdrop included; the gate
            rides here until a wallet connects */}
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="app"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            {connected && account !== null ? <AppHero /> : <WalletGate />}
          </SectionBand>
        </div>
        {/* the member surface — table band + claims band, no backdrop */}
        {connected && account !== null ? <MemberSurface wallet={account} /> : null}
      </main>
    </>
  );
}
