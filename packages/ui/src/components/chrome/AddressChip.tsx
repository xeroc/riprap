import { CheckIcon, CopyIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { cn } from "../../lib/utils";

/**
 * head…tail shortening for base58 addresses — the string stays verbatim
 * (base58 is case-sensitive; never uppercase an address).
 */
export function shortenAddress(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * `AddressChip` — a mono shortened-address stamp with a copy affordance
 * (DESIGN.md: every address in JetBrains Mono, radius 0, hairline edge).
 * Clicking copies the FULL address; the native title carries the full
 * address too. Feedback is a settle-safe icon + word swap — no animation
 * beyond color, so `prefers-reduced-motion` sees the final state.
 *
 * Data law: the address arrives as a prop and renders verbatim (shortened
 * for display only); this component invents nothing.
 */
export interface AddressChipProps extends Omit<React.ComponentProps<"button">, "onClick"> {
  /** full on-chain address; display shortens head…tail, copy uses the whole string */
  address: string;
}

export function AddressChip({ address, className, ...props }: AddressChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy: React.MouseEventHandler<HTMLButtonElement> = () => {
    navigator.clipboard
      ?.writeText(address)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch((error: unknown) => console.error("address copy failed", error));
  };

  return (
    <button
      type="button"
      data-slot="address-chip"
      data-num=""
      title={address}
      aria-label={copied ? "address copied" : `copy address ${address}`}
      onClick={handleCopy}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-none border border-hairline-strong bg-transparent px-3",
        "[font:var(--riprap-mono-label)] text-body tracking-(--riprap-tracking-stamp)",
        "transition-[border-color,color] duration-[160ms] ease-out outline-none",
        "hover:border-stone hover:text-ink focus-visible:ring-3 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <span>{shortenAddress(address)}</span>
      {copied ? (
        <span className="inline-flex items-center gap-1 text-stone">
          <CheckIcon className="size-3.5" />
          copied
        </span>
      ) : (
        <CopyIcon className="size-3.5 text-muted" />
      )}
    </button>
  );
}
