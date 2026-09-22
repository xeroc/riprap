// #/app/file-claim — the payout-request wizard's route shell (milestone
// riprap-q9dr, bean riprap-kic0): the frame (nav + backdrop), the emergency
// banner that leads every step, and the wallet gate for deep-linked wallets.
// Copy source: meta/marketing/03-website-copy/landing-page.md § "/app/file-claim"
// — rendered verbatim. The wizard interior (preflight gates, steps 1–5,
// sign/publish/filed) is wired by the wizard-flow beans; this shell is final.
import { HexBackdrop, SectionBand, TextLink } from "@riprap/ui";
import { useWallet } from "@solana/connector";

import { Settle } from "../../components/Settle";
import { SiteNav } from "../../components/SiteNav";
import { AppNavControls, ConnectWalletButton } from "../controls";

/** The emergency banner (copy doc § /app/file-claim) — leads every step,
 * above everything else. Care and police before paperwork; 999/112 mono. */
function EmergencyBanner() {
  return (
    <div
      data-slot="emergency"
      className="flex max-w-[36rem] flex-col gap-2 border border-hairline bg-card px-4 py-3"
    >
      <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
        First
      </p>
      <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">
        Get care and police first. In an emergency call{" "}
        <span data-num className="font-mono text-ink">
          999
        </span>{" "}
        (UK) or{" "}
        <span data-num className="font-mono text-ink">
          112
        </span>{" "}
        (EU). Report the assault as soon as you safely can — the police report is one of{" "}
        <TextLink href="#/2026-breakpoint-blade-pool">the five required proofs</TextLink>.
      </p>
    </div>
  );
}

/** The wizard's wallet gate (copy doc § /app/file-claim frame): deep-linked
 * without a wallet — same connect button as the /app gate. */
function WizardGate() {
  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="gate">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)]">
          Payout request
        </h1>
      </Settle>
      <Settle delay={60}>
        <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          Connect the wallet you joined with. Filing needs its signature.
        </p>
      </Settle>
      <Settle delay={120}>
        <ConnectWalletButton size="lg" data-participate label="Connect a wallet" />
      </Settle>
    </div>
  );
}

/** Step 0 preflight loading (copy doc § /app/file-claim). The gate states —
 * open claim, window closed, fee short — land with the wizard-flow beans
 * (riprap-5gud/myu7); this branch is the loading line they resolve from. */
function PreflightPending() {
  return (
    <p
      data-slot="preflight"
      className="max-w-[36rem] text-muted-foreground [font:var(--riprap-body-sm)]"
    >
      Checking your membership, the claims window, and the juror fee.
    </p>
  );
}

export function FileClaimPage() {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <>
      <SiteNav actions={<AppNavControls />} />
      <main>
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="file-claim"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
              <EmergencyBanner />
              {connected ? <PreflightPending /> : <WizardGate />}
            </div>
          </SectionBand>
        </div>
      </main>
    </>
  );
}
