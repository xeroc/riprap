// #/m/coffee-apocalypse — placeholder detail page (copy doc § /m routes).
// Content extracted from meta/Breakpoint/Micro Mutual — Coffee Apocalypse -
// Policy.md (§3/§4/§5/§7/§10/§11); no chain binding yet.
import { PoolPageShell } from "./PoolPageShell";

export function CoffeeApocalypsePage() {
  return (
    <PoolPageShell
      config={{
        name: "Coffee Apocalypse",
        event: "Breakpoint",
        kind: "mutual",
        tagline:
          "A one-time mutual pool protecting members against the exhaustion of the venue's coffee supply while they are standing in the queue.",
        promise: [
          "Join a temporary community mutual. Pay a fixed amount.",
          "Receive defined protection against the coffee running out while you wait in the queue.",
          "If payments don't consume the pool, the remaining money comes back to the members. When the event is over, the mutual ends.",
        ],
        tiers: [{ name: "Flat", fee: 10, cap: 25 }],
        definition:
          "The complete exhaustion of the coffee available for dispensing at a coffee point in the covered area, occurring while the member was standing in the queue at that coffee point, with the result that the member left that queue without coffee.",
        definitionNotes: [
          "Coffee point — a staffed station within the covered area dispensing coffee to attendees.",
          "Queue — an ordered line of persons waiting to be served, in which the member was physically present when the coffee was exhausted.",
          "A long queue is not a shortage. Slow service is not a shortage. Bad coffee is not a shortage. A coffee point that is closed is not a shortage — unless it closed because the coffee was exhausted, which is.",
          "Decaffeinated coffee is coffee. The mutual does not distinguish.",
          "One claim per member — coverage ends with the first qualifying exhaustion.",
        ],
        exclusions: [
          "Exhaustions caused or contributed to by the member — bulk purchasing, hoarding, sabotage, or any interference with the supply.",
          "Members who were not in the queue at the moment of exhaustion.",
          "Members who left the queue before the coffee ran out. They escaped with their time.",
          "Members who carried their own coffee into the queue. They were never at risk.",
          "Queues for anything other than a coffee point.",
          "The exhaustion of tea, water, milk, oat drink, or sugar at a coffee point that still has coffee.",
        ],
        proof: [
          "Event ticket in your own name",
          "Government photo ID",
          "Exhaustion evidence — a timestamped photo or video of the coffee point with no coffee left to dispense (empty urns, signage, or staff confirmation)",
          "Queue evidence — a timestamped photo or video of you in the queue at that coffee point, at or immediately before the exhaustion",
          "Declaration of the facts, signed with your wallet",
        ],
        feeNote: "Filing pre-pays an adjudication fee of 5 USDC (TODO-confirm in the policy).",
        example: {
          lines: [
            { value: "1,000", caption: "members" },
            { value: "$10", caption: "each" },
            { value: "$10,000", caption: "pool" },
            { value: "2", caption: "exhaustions" },
            { value: "210 × $25", caption: "approved" },
          ],
          total: { value: "$4,750", caption: "returned to members" },
          note: "The payout is set at roughly the price of one conference coffee plus the indignity, itemized as one number. Exhaustions are shared events — one empty urn can produce many valid claims at once, and the proportional clause is expected to do real work.",
        },
        endNote:
          "After the conference, the claim window, and settlement, the remaining balance returns to eligible members and the mutual dissolves permanently.",
      }}
    />
  );
}

export default CoffeeApocalypsePage;
