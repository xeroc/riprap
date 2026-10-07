// #/m/ngmi-hairline — the pool page: ngmihairline hero (offer + join), then the doc
// bands. Content extracted from meta/Breakpoint/Micro Mutual — NGMI Hairline
// - Policy.md (§3/§4/§5/§7/§10/§11); prices set 2026-10-07 (flat $10 entry,
// $200 maximum, grades pay 10/30/50/100%); hero copy authored 2026-10-07
// (copy-doc pass pending).
import { NgmiHairlineHero } from "./NgmiHairlineHero";

import { PoolPageShell } from "./PoolPageShell";

export function NgmiHairlinePage() {
  return (
    <PoolPageShell
      hero={<NgmiHairlineHero />}
      config={{
        name: "NGMI Hairline",
        event: "Breakpoint",
        kind: "mutual",
        tagline:
          "A one-time mutual pool protecting members against new gray hair acquired during the conference. The severity grade is the payout.",
        promise: [
          "Join a temporary community mutual. Pay a fixed amount.",
          "Receive defined protection against new gray hair during the event.",
          "If payments don't consume the pool, the remaining money comes back to the members. When the event is over, the mutual ends.",
        ],
        tiers: [{ name: "Flat", fee: 10, cap: 200 }],
        grades: [
          {
            grade: "I",
            label: "gray hair",
            finding:
              "A countable number of new gray hairs (fewer than 10), findable on close inspection.",
            pays: "$20 · 10%",
          },
          {
            grade: "II",
            label: "visible new grays",
            finding: "Visible to a bystander at conversational distance, without inspection.",
            pays: "$60 · 30%",
          },
          {
            grade: "III",
            label: "holy shit",
            finding:
              "A cluster or patch of new gray hair, immediately obvious, remarked upon by others.",
            pays: "$100 · 50%",
          },
          {
            grade: "IV",
            label: "basically Gandalf",
            finding: "Comprehensive new graying of the covered hairline.",
            pays: "$200 · 100%",
          },
        ],
        definition:
          "New gray hair on the member's scalp — a hair that is gray along its visible length, that was not visible in the member's baseline Hairline Snapshot, and that is visible at the time of the payout request.",
        definitionNotes: [
          "The mutual does not investigate when the hair lost its pigment, or why. It pays on the difference between the two snapshots.",
          "The label is the severity. The grade is the payment — a percentage of the $200 maximum, and every payment is at most its grade: when claims exceed the pool, all payments scale down together.",
        ],
        exclusions: [
          "Gray hair visible in the baseline Hairline Snapshot.",
          "Hair colored gray by dye, spray, chalk, or any other means. Artificially gray hair is not gray hair.",
          "Hair lightened by sun, chlorine, bleach, or other products. Light hair is not gray hair.",
          "Facial hair, eyebrow hair, and body hair. Scalp only — beard gray is a separate peril and is not covered.",
          "Hair loss and recession. A thinner hairline is not a grayer one.",
          "Images that are edited, filtered, staged, or generated.",
        ],
        proof: [
          "Event ticket in your own name",
          "Government photo ID",
          "Baseline Hairline Snapshot — a dated, unedited photo of your hairline, committed when you joined",
          "Claim Hairline Snapshot — same region, within the claim window, comparable length, framing, and lighting",
          "Hairline Damage Report — the new grays catalogued (count, location) and the circumstances of their discovery",
          "Declaration of the facts, signed with your wallet",
        ],
        feeNote:
          "Filing pre-pays an adjudication fee of 4 USDC — denied forfeits it, approved returns it with the payment.",
        example: {
          lines: [
            { value: "500", caption: "members" },
            { value: "$10", caption: "each — one flat membership" },
            { value: "$5,000", caption: "pool" },
            { value: "120", caption: "approved claims (70×I, 35×II, 12×III, 3×IV)" },
            { value: "$5,300", caption: "due — more than the pool holds" },
          ],
          total: { value: "$5,000", caption: "paid out in full — nothing returns" },
          note: "Gray hair at a conference is common and mild, so the approved claims exceed the pool: every payment and returned fee scales by the ratio 0.87 — a Grade I member receives ≈$17, a Grade IV member ≈$173. The jury grades what it sees, and the grade is the ceiling: $20/$60/$100/$200 on the $200 maximum.",
        },
        endNote:
          "After the conference, the claim window, and settlement, the remaining balance returns to eligible members and the mutual dissolves permanently.",
      }}
    />
  );
}

export default NgmiHairlinePage;
