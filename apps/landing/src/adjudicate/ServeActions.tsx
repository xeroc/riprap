// ServeActions — the serve panel's write actions (riprap-fy3q, spec §3):
// `Stake to serve` (accord::stake through the MST proof worker — amount
// defaulted to the member's tier contribution, EVENT-MUTUAL §12 UX
// convention; the SAS attestation rides along, §2.8 gated subaccord) and
// `Withdraw fees` (ungated, ADR-0020). No unstake / reconcile — the CLI stays
// the operator path. Writes go through the landing's shared
// simulate-then-send path; revert reasons surface from program logs.
// Copy source: copy doc § /app/adjudicate serve panel.
import { findAssociatedTokenAddress } from "@riprap/hanse";
import { Button, Input, Label, usd } from "@riprap/ui";
import type { Account, Address } from "@solana/kit";
import { useQueryClient } from "@tanstack/react-query";
import {
  Accord,
  fetchMaybeSubaccord,
  findAccordStatePda,
  findJurorStakePda,
  type Subaccord,
} from "@useaccord/sdk";
import { useState } from "react";
import { toast } from "sonner";

import { microToUsd } from "../pool/mutual";
import { useHanseEnv } from "../shared/rpc";
import { describeError, sendInstruction } from "../shared/transaction";
import { useStakingProof } from "./useStakingProof";

/** The send phases (copy doc: shared with the wizard's SIGN, verbatim). */
type SendPhase = "building" | "wallet-signing" | "confirming";

const SEND_PHASE_LINES: Record<SendPhase, string> = {
  building: "Building the transaction…",
  "wallet-signing": "Waiting for your wallet…",
  confirming: "Confirming…",
};

function PhaseLine({ phase }: { phase: SendPhase | null }) {
  if (phase === null) return null;
  return (
    <p data-num className="font-mono text-sm text-muted-foreground">
      {SEND_PHASE_LINES[phase]}
    </p>
  );
}

/** The StakingAccounts accord::stake verifies (accord StakeActions pattern). */
async function stakingAccounts(sub: Account<Subaccord>, subaccord: Address, juror: Address) {
  const stakingToken = sub.data.stakingToken;
  const [jurorStake] = await findJurorStakePda({ subaccord, juror });
  const [jurorTokenAccount, stakeVault] = await Promise.all([
    findAssociatedTokenAddress(stakingToken, juror),
    findAssociatedTokenAddress(stakingToken, subaccord),
  ]);
  const [accordState] = await findAccordStatePda();
  return {
    juror,
    subaccord,
    jurorStake,
    stakingToken,
    jurorTokenAccount,
    stakeVault,
    accordState,
  };
}

/**
 * `Stake to serve` — the CTA reveals the amount form; the proof builds while
 * the form is open (worker, root-mismatch retry surfaced as the copy doc's
 * moved-tree line), the tier contribution pre-fills the amount (§12).
 */
export function StakeToServe({
  subaccord,
  wallet,
  defaultAmountMicro,
  attestation,
}: {
  subaccord: Address;
  wallet: Address;
  defaultAmountMicro: bigint;
  attestation: Address;
}) {
  const env = useHanseEnv();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [moved, setMoved] = useState(false);
  const [sendPhase, setSendPhase] = useState<SendPhase | null>(null);
  const [amountUsdc, setAmountUsdc] = useState(() => String(microToUsd(defaultAmountMicro)));
  const proof = useStakingProof(open ? subaccord : undefined, open ? wallet : undefined, () =>
    setMoved(true),
  );

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-44" onClick={() => setOpen(true)}>
        Stake to serve
      </Button>
    );
  }

  const submit = async () => {
    if (env === null || proof.data === undefined) return;
    setSendPhase("building");
    try {
      const sub = await fetchMaybeSubaccord(env.rpc, subaccord);
      if (!sub.exists) throw new Error("Subaccord not found for this cluster.");
      const accounts = await stakingAccounts(sub, subaccord, wallet);
      const amountMicro = BigInt(Math.round(Number.parseFloat(amountUsdc) * 1_000_000));
      const accord = new Accord({ endpoint: env.endpoint, signer: env.signer });
      const instruction = accord.methods.stake(accounts, amountMicro, proof.data.path, attestation);
      setSendPhase("wallet-signing");
      await sendInstruction(env.rpc, env.rpcSubscriptions, env.signer, [instruction], () =>
        setSendPhase("confirming"),
      );
      // The stake line is the feedback — converge every read that carries it.
      await queryClient.invalidateQueries({ queryKey: ["juror-stake"] });
      await queryClient.invalidateQueries({ queryKey: ["seats"] });
      setOpen(false);
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setSendPhase(null);
    }
  };

  const busy = sendPhase !== null;

  return (
    <div className="flex max-w-[36rem] flex-col gap-2" data-slot="stake-form">
      <div className="flex flex-col gap-2">
        <Label htmlFor="stake-amount">Stake (USDC)</Label>
        <Input
          id="stake-amount"
          type="number"
          min={1}
          step={1}
          disabled={busy}
          value={amountUsdc}
          onChange={(e) => setAmountUsdc(e.target.value)}
        />
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]" data-num>
          Defaults to your tier contribution — {usd(microToUsd(defaultAmountMicro))} USDC.
        </p>
      </div>
      {proof.isPending && (
        <p data-num className="font-mono text-sm text-muted-foreground">
          {moved ? "The stake tree moved — rebuilding the proof." : "Building your stake proof…"}
        </p>
      )}
      {proof.isError && (
        <p className="text-sm text-error [font:var(--riprap-body-sm)]">
          {describeError(proof.error)}
        </p>
      )}
      <PhaseLine phase={sendPhase} />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="w-44"
          disabled={busy || proof.data === undefined}
          onClick={() => void submit()}
        >
          Stake to serve
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-24"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** `Withdraw fees` — one ungated instruction; the refreshed fees line is the
 * feedback. Disabled while nothing is earned. */
export function WithdrawFees({
  subaccord,
  wallet,
  feesEarned,
}: {
  subaccord: Address;
  wallet: Address;
  feesEarned: bigint;
}) {
  const env = useHanseEnv();
  const queryClient = useQueryClient();
  const [sendPhase, setSendPhase] = useState<SendPhase | null>(null);
  const busy = sendPhase !== null;

  const submit = async () => {
    if (env === null) return;
    setSendPhase("building");
    try {
      const sub = await fetchMaybeSubaccord(env.rpc, subaccord);
      if (!sub.exists) throw new Error("Subaccord not found for this cluster.");
      const feeToken = sub.data.feeToken;
      const [jurorStake] = await findJurorStakePda({ subaccord, juror: wallet });
      const [jurorFeeTokenAccount, feeVault] = await Promise.all([
        findAssociatedTokenAddress(feeToken, wallet),
        findAssociatedTokenAddress(feeToken, subaccord),
      ]);
      const accord = new Accord({ endpoint: env.endpoint, signer: env.signer });
      const instruction = accord.methods.withdrawFees({
        juror: wallet,
        subaccord,
        jurorStake,
        feeToken,
        jurorFeeTokenAccount,
        feeVault,
      });
      setSendPhase("wallet-signing");
      await sendInstruction(env.rpc, env.rpcSubscriptions, env.signer, [instruction], () =>
        setSendPhase("confirming"),
      );
      await queryClient.invalidateQueries({ queryKey: ["juror-stake"] });
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setSendPhase(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        className="w-44"
        disabled={busy || feesEarned === 0n}
        onClick={() => void submit()}
      >
        Withdraw fees
      </Button>
      <PhaseLine phase={sendPhase} />
    </div>
  );
}
