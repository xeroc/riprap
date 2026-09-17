import { cn } from "../../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

/**
 * `ClusterSelect` — the cluster picker, props-driven and Solana-free: the
 * kit never imports a wallet/cluster library; the app maps its cluster
 * objects to `clusters` and owns the actual switch (milestone riprap-9ehc:
 * zero @solana/* deps in @riprap/ui).
 *
 * The trigger reads as a mono stamp (DESIGN.md: uppercase belongs to mono);
 * labels render verbatim from props — the uppercase is CSS-case only. The
 * list opens as a ruled plate; the active item carries the check. No
 * selection shows the `cluster` prompt.
 */
export interface ClusterOption {
  /** cluster id, passed back through onValueChange — e.g. "devnet" */
  value: string;
  /** display label, rendered verbatim (CSS uppercases it) — e.g. "devnet" */
  label: string;
}

export interface ClusterSelectProps {
  clusters: ClusterOption[];
  /** the active cluster value; omit for the unselected prompt state */
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** extra classes for the trigger (width, etc. — the consumer's call) */
  className?: string;
}

export function ClusterSelect({
  clusters,
  value,
  onValueChange,
  disabled,
  className,
}: ClusterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label="cluster"
        className={cn(
          "px-3 uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]",
          className,
        )}
      >
        <SelectValue placeholder="cluster" />
      </SelectTrigger>
      <SelectContent>
        {clusters.map((cluster) => (
          <SelectItem key={cluster.value} value={cluster.value}>
            {cluster.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
