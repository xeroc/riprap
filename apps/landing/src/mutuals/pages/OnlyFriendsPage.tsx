// #/m/onlyfriends — placeholder detail page (copy doc § /m routes).
// Content extracted from meta/Breakpoint/Micro Bounty — OnlyFriends -
// Terms.md (§3/§4/§5/§7/§10/§11); no chain binding yet.
import { PoolPageShell } from "./PoolPageShell";

export function OnlyFriendsPage() {
  return (
    <PoolPageShell
      config={{
        name: "OnlyFriends",
        event: "Breakpoint",
        kind: "bounty",
        tagline:
          "A one-time bounty pool for people who know people — and for people who want to. Members join to make introductions (connectors) or to be connected (seekers); only connectors are paid.",
        promise: [
          "Join a temporary bounty pool. Pay a fixed amount.",
          "Get paid up to $50 for each confirmed introduction of a member to a listed VIP — up to ten.",
          "If bounties don't consume the pot, the remaining money comes back to the members. When the event is over, the bounty ends.",
        ],
        tiers: [{ name: "Flat", fee: 50, cap: 500 }],
        definition:
          "The member (the connector) personally introduced another member (the seeker) to a listed VIP, within the covered area or through the event's official channels, during the bounty period, in a manner the listed VIP confirms receiving.",
        definitionNotes: [
          "Listed VIP — a founder, co-founder, or chief officer of a Sponsor, holding that role at the time of the introduction. Listed VIPs may not hold memberships.",
          "Sponsor — a company on the event's official sponsor page when joining opens (solana.com/breakpoint/sponsors, archived at that moment). Later page changes do not count.",
          "Introduction — the act of making two people known to each other who were not previously acquainted. You cannot introduce a person to someone they already know. Passing along a handle is not an introduction. A forwarded calendar invite is not an introduction. A wave across the room is not an introduction.",
          "Confirmation — a statement from the listed VIP that the introduction reached them, through a channel the jury can verify.",
          "A member introducing themselves to a listed VIP is not making an introduction; it is a conversation.",
          "One confirmed introduction returns the entry fee exactly: $50 claimable against a $50 entry — even, not ahead. This is deliberate — a single staged introduction is worth nothing, and a second one doubles the collusion bill.",
        ],
        exclusions: [
          "Introductions to a person who is not a Listed VIP.",
          "Introductions of a person who was not a member at the time.",
          "Introductions of two people already acquainted. Reconnection is not introduction.",
          "Introductions outside the bounty period, or through channels other than the covered area and the event's official channels.",
          "Confirmations authored by the connector, the seeker, or anyone other than the listed VIP.",
          "Introductions beyond the tenth confirmed per member.",
        ],
        proof: [
          "Event ticket in your own name",
          "Government photo ID",
          "Introduction evidence — the message thread, photograph, or other record showing you personally making the introduction",
          "VIP eligibility evidence — the archived sponsor page showing the person's company, plus a public source showing their role at the time",
          "Confirmation — a statement from the listed VIP, from an account the jury can verify. Without it, the claim fails. The confirmation is the proof.",
          "Declaration of the facts, signed with your wallet",
        ],
        feeNote:
          "Filing pre-pays an adjudication fee of 4 USDC — denied forfeits it, approved returns it with the payment.",
        example: {
          lines: [
            { value: "300", caption: "members" },
            { value: "$50", caption: "each" },
            { value: "$15,000", caption: "pot" },
            { value: "120", caption: "confirmed introductions" },
            { value: "$6,000", caption: "bounties paid" },
          ],
          total: { value: "$9,000", caption: "returned to members" },
          note: "A member with two introductions is $50 ahead; ten makes $450. A member who introduced nobody receives their share of the unused pot back — connectors and seekers alike.",
        },
        endNote:
          "After the conference, the claim window, and settlement, the remaining balance returns to eligible members and the bounty pool dissolves permanently.",
      }}
    />
  );
}

export default OnlyFriendsPage;
