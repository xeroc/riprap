// /2026-breakpoint-blade-pool — "The math": policy §10's worked example as the
// kit receipt (landing-page.md § The math, 2026-09-27). All numbers are
// policy-doc statics (§6/§7/§10), not chain reads — same provenance rule as
// the fineprint's example lines.
import { SectionBand, type WorkedExampleLine, WorkedExampleReceipt } from "@riprap/ui";

import { Settle } from "../../components/Settle";

// Sources: meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md §10 (+ §7
// proportional-scaling close).
const LINES: WorkedExampleLine[] = [
  { value: "1,000", caption: "members" },
  { value: "$20", caption: "each · Standard tier" },
  { value: "$20,000", caption: "total pool" },
  { value: "4 × $2,000", caption: "approved requests" },
  { value: "$8,000", caption: "paid out" },
];

const TOTAL: WorkedExampleLine = { value: "$12,000", caption: "returned to members" };

export function PoolMath() {
  return (
    <SectionBand id="the-math" label="the math" tone="ground">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
            The math, on the policy's example.
          </h2>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            Policy §10's worked example, Standard tier, exactly as written.
          </p>
        </div>

        <div className="max-w-xl">
          <WorkedExampleReceipt
            label="worked example · standard tier"
            lines={LINES}
            total={TOTAL}
          />
        </div>

        <p className="max-w-2xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
          If approved requests ever exceeded the pool, every payment would scale down proportionally
          — the pool never pays more than it holds.
        </p>
      </Settle>
    </SectionBand>
  );
}
