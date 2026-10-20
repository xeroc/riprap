// #/m/caffeine-supercycle — the pool page: caffeinesupercycle hero (offer +
// join), then the doc bands. Content extracted from meta/Breakpoint/Micro
// Bounty — Caffeine Supercycle - Terms.md (§3/§4/§5/§7/§10/§11); hero copy
// authored 2026-10-13 (copy-doc pass pending).

import { CaffeineSupercycleHero } from "./CaffeineSupercycleHero";
import { PoolPageShell } from "./PoolPageShell";

export function CaffeineSupercyclePage() {
  return (
    <PoolPageShell
      hero={<CaffeineSupercycleHero />}
      config={{
        name: "Caffeine Supercycle",
        event: "Breakpoint",
        kind: "bounty",
        slug: "caffeine-supercycle",
        tagline:
          "A one-time bounty pool for members who want an excuse to talk to Lily, Toly, or Raj. The pot pays only for deliveries the named person confirms.",
        promise: [
          "Join a temporary bounty pool. Pay a fixed amount.",
          "Get paid for proof you brought Lily, Toly, or Raj a hot drink they asked for.",
          "If bounties don't consume the pot, the remaining money comes back to the members. When the event is over, the bounty ends.",
        ],
        tiers: [{ name: "Flat", fee: 5, cap: 50 }],
        definition:
          "The Request: the named person requested a hot drink, the request coming from that person and preceding the delivery. The Procurement: you personally obtained the drink after the request, at your own expense. The Handover: you personally placed the drink, still hot, in the named person's hand. The Confirmation: the named person confirmed the request and the delivery.",
        definitionNotes: [
          'The roster is Lily Liu, Anatoly "Toly" Yakovenko, and Raj Gokal — fixed when joining closes; no named person may hold a membership in this pool.',
          "A request addressed to whoever would bring it — “will someone bring me a coffee” — counts. A rumor of thirst is not a request. A request made by someone else on the named person's behalf is not a request.",
          "Hot drink — coffee, tea, hot chocolate, or similar, served hot and intended for immediate consumption. An iced drink is not a hot drink. A drink that was hot earlier is not a hot drink.",
          "Hands are the standard: handing the drink to staff, security, or an intermediary is not a delivery.",
          "One member, one bounty: a member paid for a drink delivered to one named person is not paid again for a drink delivered to another.",
        ],
        exclusions: [
          "Deliveries made without a request from the named person. Guessing a preferred drink and ambushing a named person with it is not a bounty; it is evangelism.",
          "Drinks that were no longer hot at handover.",
          "Cold and iced drinks.",
          "Deliveries to an intermediary instead of the named person's hand.",
          "Members reimbursed by anyone for the drink. An errand is not a delivery.",
          "Requests staged for the purpose of generating bounties — the jury may treat an orchestrated request as no request.",
        ],
        proof: [
          "Event ticket in your own name",
          "Government photo ID",
          "Delivery evidence — a timestamped photo or video of the handover, showing you, the named person, and the drink",
          "Confirmation — a statement from the named person, from an account or in a form the jury can verify. Without it, the claim fails. The confirmation is the proof.",
        ],
        feeNote:
          "Filing pre-pays an adjudication fee of 8 USDC — denied forfeits it, approved returns it with the payment.",
        example: {
          lines: [
            { value: "400", caption: "members" },
            { value: "$5", caption: "each" },
            { value: "$2,000", caption: "pot" },
            { value: "10 × $50", caption: "confirmed deliveries" },
            { value: "$500", caption: "bounties paid" },
          ],
          total: { value: "$1,500", caption: "returned to members" },
          note: "The pot pays at most 10 Qualifying Deliveries in total — across the whole roster, not per named person — in the order their claims are approved. A member who delivered once is up to $45 ahead.",
        },
        endNote:
          "After the conference, the claim window, and settlement, the remaining balance returns to eligible members and the bounty pool dissolves permanently.",
      }}
    />
  );
}

export default CaffeineSupercyclePage;
