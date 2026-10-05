// #/m/ngmi-hairline — placeholder detail page (copy doc § /m routes).
// Content extracted from meta/Breakpoint/Micro Mutual — NGMI Hairline -
// Policy.md (§3/§4/§5/§7/§10/§11); no chain binding yet.
import { PoolPageShell } from "./PoolPageShell";

export function NgmiHairlinePage() {
  return (
    <PoolPageShell
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
        tiers: [
          { name: "Basic", fee: 5, cap: 50 },
          { name: "Standard", fee: 10, cap: 100 },
          { name: "Premium", fee: 20, cap: 200 },
        ],
        definition:
          "New gray hair on the member's scalp — a hair that is gray along its visible length, that was not visible in the member's baseline Hairline Snapshot, and that is visible at the time of the payout request.",
        definitionNotes: [
          "The mutual does not investigate when the hair lost its pigment, or why. It pays on the difference between the two snapshots.",
          "Grade I — gray hair: a countable number of new grays (fewer than 10), findable on close inspection. 10% of maximum.",
          "Grade II — visible new grays: visible to a bystander at conversational distance, without inspection. 30%.",
          "Grade III — holy shit: a cluster or patch of new gray hair, immediately obvious, remarked upon by others. 50%.",
          "Grade IV — basically Gandalf: comprehensive new graying of the covered hairline. 100%.",
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
        feeNote: "Filing pre-pays an adjudication fee of 5 USDC (TODO-confirm in the policy).",
        example: {
          lines: [
            { value: "500", caption: "members" },
            { value: "$10", caption: "each — Standard" },
            { value: "$5,000", caption: "pool" },
            { value: "120", caption: "approved claims" },
            { value: "$2,650", caption: "paid (70×I, 35×II, 12×III, 3×IV)" },
          ],
          total: { value: "$2,350", caption: "returned to members" },
          note: "Gray hair at a conference is common and mild, so this pool runs a 1:10 payout ratio where the Blade Pool runs 1:100 — the jury grades what it sees.",
        },
        endNote:
          "After the conference, the claim window, and settlement, the remaining balance returns to eligible members and the mutual dissolves permanently.",
      }}
    />
  );
}

export default NgmiHairlinePage;
