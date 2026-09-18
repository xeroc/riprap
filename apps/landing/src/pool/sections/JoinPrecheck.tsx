// JoinPrecheck — the chip-in inline disable reasons (copy doc § "On-chain
// states + juror modal", 2026-09-17): insufficient-USDC and insufficient-SOL
// lines, plus the devnet-only Circle faucet link under the USDC reason. Every
// number arrives as a prop from the chain (getJoinContext) — the component
// renders props, never invented numbers (kit data law).
//
// Copy source (meta/marketing/03-website-copy/landing-page.md):
//   - Insufficient USDC: `Not enough USDC. This wallet holds {{balance}}; the {{tier}} tier costs {{fee}}.`
//   - Insufficient SOL: `You'll also need SOL for network fees.`
//   - Devnet only, under the USDC reason: `Get devnet USDC from the Circle faucet.` (link)

import { TextLink, usd } from "@riprap/ui";

export const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";

export interface JoinPrecheckProps {
  /** true when the wallet's deposit-mint balance is below the SELECTED tier's
   *  contribution — per-tier affordability is the page's call (join.ts). */
  needsUsdc: boolean;
  /** the wallet's deposit-mint balance, whole dollars (context.depositBalance). */
  balanceUsd: number;
  /** the selected tier's copy name (Basic · Standard · Premium). */
  tierName: string;
  /** the selected tier's contribution, whole dollars (mutual.tiers). */
  feeUsd: number;
  /** context.reason === "insufficient-sol". */
  insufficientSol: boolean;
  /** devnet only — the faucet link renders under the USDC reason. */
  isDevnet: boolean;
}

export function JoinPrecheck({
  needsUsdc,
  balanceUsd,
  tierName,
  feeUsd,
  insufficientSol,
  isDevnet,
}: JoinPrecheckProps) {
  if (!needsUsdc && !insufficientSol) return null;
  return (
    <div data-slot="join-precheck" className="flex max-w-[36rem] flex-col gap-2">
      {needsUsdc && (
        <>
          <p data-num className="font-mono text-sm text-muted-foreground">
            Not enough USDC. This wallet holds {usd(balanceUsd)}; the {tierName} tier costs{" "}
            {usd(feeUsd)}.
          </p>
          {isDevnet && (
            <p>
              <TextLink href={CIRCLE_FAUCET_URL} external>
                Get devnet USDC from the Circle faucet.
              </TextLink>
            </p>
          )}
        </>
      )}
      {insufficientSol && (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          You'll also need SOL for network fees.
        </p>
      )}
    </div>
  );
}
