// riprap-def/v1 — the format suite (milestone riprap-9bh4 HANDOFF §6,
// rows 1–2): determinism, the two worked vectors (§5 tier tables from
// the first-party doc facts), the full validation matrix (one rejection
// path per HANDOFF §3/§6 rule), and the render → parse round-trip.
//
// Vector facts and their sources (all final, 2026-10-07/2026-10-13):
// - Chairmageddon — mutuals/data.ts §5 comment + Micro Mutual —
//   Chairmageddon - Policy.md §2/§3/§5: Flat $10 entry, up to $40
//   payout; payout requests close 10 days after the conference ends
//   (§2) → 2026-11-27; venue Olympia (§2 example block); §7 adjudication
//   fee 8 USDC.
// - Caffeine Supercycle — mutuals/data.ts §5 comment + Micro Bounty —
//   Caffeine Supercycle - Terms.md §2/§3/§5: Flat $5 entry, up to $50
//   bounty; claim window closes 10 days after the conference ends (§2)
//   → 2026-11-27; roster Lily/Toly/Raj (§3); §7 adjudication fee 8 USDC.
// - Blade tier trio (thousands grouping) — Micro Mutual — Knife
//   Assault - Policy.md §5: Basic 10/1000, Standard 20/2000, Premium
//   40/4000.
import { describe, expect, it } from "vitest";
import { type DefInput, renderDef } from "./render";
import type { DefFrontmatter, DefProofSlot } from "./schema";
import { DefFormatError, parseFrontmatter, splitDefDocument } from "./schema";
import { parseSections, SECTION_COUNT, sectionTitles } from "./sections";
import { validateDefArtifact, validateDefInput, validateFrontmatter } from "./validate";

const chairmageddon: DefInput = {
  kind: "mutual",
  slug: "chairmageddon",
  name: "Chairmageddon",
  period: {
    start: "2026-11-15",
    end: "2026-11-17",
    claims_close: "2026-11-27", // policy §2: 10 days after the conference ends
    venue: "Olympia Convention Centre, London",
  },
  tiers: [{ name: "Flat", fee: 10, cap: 40 }], // policy §5
  proof: [
    {
      slot: "01-ticket.pdf",
      kind: "file",
      label: "Ticket",
      verify:
        "evidence of a valid ticket for the covered event, issued in the requester's own name",
    },
    { slot: "02-id-document.jpg", kind: "file", label: "Identity documentation" },
    { slot: "03-capacity-evidence.pdf", kind: "file", label: "Capacity evidence" },
    { slot: "04-standing-evidence.jpg", kind: "file", label: "Standing evidence" },
  ],
  marketing: {
    event: "Breakpoint 2026",
    blurb: "Every seat taken at the opening ceremony — and you stood the whole thing.",
    logo: "https://riprap.xyz/pools/chairmageddon/logo.svg",
    share: "Standing through the opening ceremony at Breakpoint — worth $40.",
    smallestPayout: 40, // data.ts §5: the flat $40 payout is the only success payment
  },
  language: "en",
  peril: "the absence of seats at the opening ceremony",
  definition: [
    "At the opening ceremony of the covered event, every seat in the ceremony venue was occupied, and the member stood — on their feet, without a seat — for the entire opening ceremony, from its published start to its published end.",
    "- **Seat** — a thing designed to be sat on, provided by the venue, and occupied by somebody else. Stairs are not seats. The floor is not a seat.",
  ],
  exclusions: [
    "Seats available when the member arrived. Elective standing is a lifestyle, not a peril.",
    "Members who sat at any point during the ceremony — on a seat, on the floor, on steps, or on another person.",
  ],
  economics: { filingFeeUsdc: 8 }, // policy §7
};

const caffeine: DefInput = {
  kind: "bounty",
  slug: "caffeine-supercycle",
  name: "Caffeine Supercycle",
  period: {
    start: "2026-11-15",
    end: "2026-11-17",
    claims_close: "2026-11-27", // terms §2: 10 days after the conference ends
  },
  tiers: [{ name: "Flat", fee: 5, cap: 50 }], // terms §5
  proof: [
    { slot: "01-ticket.pdf", kind: "file", label: "Ticket" },
    { slot: "02-id-document.jpg", kind: "file", label: "Identity documentation" },
    {
      slot: "03-request-evidence.url",
      kind: "url",
      label: "Request evidence",
      verify: "the post or message from the named person's known account containing the request",
    },
    { slot: "04-delivery-evidence.jpg", kind: "file", label: "Delivery evidence" },
    {
      slot: "05-confirmation.url",
      kind: "url",
      label: "Confirmation",
      verify: "the named person confirming they requested and received the drink from the member",
    },
  ],
  language: "en",
  peril: "bringing Lily, Toly, or Raj a hot drink they asked for",
  definition: [
    'A **Qualifying Delivery** means the request, the procurement, the handover, and the confirmation, in that order, with respect to one named person on the roster: Lily Liu, Anatoly "Toly" Yakovenko, and Raj Gokal.',
    "- **Hot drink** — coffee, tea, hot chocolate, or similar, served hot and intended for immediate consumption.",
  ],
  exclusions: [
    "Deliveries made without a request from the named person.",
    "Drinks that were no longer hot at handover.",
    "Deliveries to an intermediary instead of the named person's hand.",
  ],
  economics: { filingFeeUsdc: 8 }, // terms §7
};

/** The canonical parsed machine block every matrix row mutates — rendered
 * first, so every rejection test starts from real artifact bytes. Used by
 * every matrix row for lockstep fixture shape. */
function baseDef(): DefFrontmatter {
  return parseFrontmatter(splitDefDocument(renderDef(chairmageddon)).frontmatter);
}

describe("riprap-def/v1 — determinism (HANDOFF §6 row 1)", () => {
  it("same DefInput renders byte-identical twice", () => {
    expect(renderDef(chairmageddon)).toBe(renderDef(chairmageddon));
    expect(renderDef(caffeine)).toBe(renderDef(caffeine));
  });

  it("language defaults to en deterministically — no environment-derived bytes", () => {
    const withoutLanguage = { ...caffeine } as Partial<DefInput>;
    delete withoutLanguage.language;
    expect(renderDef(withoutLanguage as DefInput)).toBe(renderDef(caffeine));
    expect(baseDef().language).toBe("en");
  });
});

describe("riprap-def/v1 — worked vectors", () => {
  it("Chairmageddon (mutual) renders the §5 table from policy §5 facts", () => {
    const doc = renderDef(chairmageddon);
    expect(doc).toContain("## 5. Coverage and Price");
    expect(doc).toContain("| Flat |       $10 |      up to $40 |");
  });

  it("Caffeine Supercycle (bounty) renders the §5 table from terms §5 facts", () => {
    const doc = renderDef(caffeine);
    expect(doc).toContain("## 5. Bounty and Price");
    expect(doc).toContain("| Flat |        $5 | up to $50 |");
  });

  it("groups thousands en-US in caps (Blade policy §5 tier trio)", () => {
    const doc = renderDef({
      ...chairmageddon,
      tiers: [
        { name: "Basic", fee: 10, cap: 1000 },
        { name: "Standard", fee: 20, cap: 2000 },
        { name: "Premium", fee: 40, cap: 4000 },
      ],
    });
    expect(doc).toContain("| Basic    |       $10 |   up to $1,000 |");
    expect(doc).toContain("| Standard |       $20 |   up to $2,000 |");
    expect(doc).toContain("| Premium  |       $40 |   up to $4,000 |");
  });

  it("kind word-maps swap the §2/§3/§5/§6/§7/§8 titles only", () => {
    const mutualTitles = parseSections(splitDefDocument(renderDef(chairmageddon)).body).map(
      (s) => s.title,
    );
    const bountyTitles = parseSections(splitDefDocument(renderDef(caffeine)).body).map(
      (s) => s.title,
    );
    expect(mutualTitles).toEqual(sectionTitles("mutual"));
    expect(bountyTitles).toEqual(sectionTitles("bounty"));
    // the kind-invariant §s stay put
    expect(mutualTitles.slice(0, 1)).toEqual(bountyTitles.slice(0, 1)); // §1 Product
    expect(mutualTitles.slice(3, 4)).toEqual(bountyTitles.slice(3, 4)); // §4 Exclusions
    expect(mutualTitles.slice(8)).toEqual(bountyTitles.slice(8)); // §9–§11
  });

  it("Chairmageddon canonical bytes", () => {
    expect(renderDef(chairmageddon)).toMatchInlineSnapshot(`
      "---
      schema: "riprap-def/v1"
      kind: "mutual"
      slug: "chairmageddon"
      name: "Chairmageddon"
      period:
        start: "2026-11-15"
        end: "2026-11-17"
        claims_close: "2026-11-27"
        venue: "Olympia Convention Centre, London"
      tiers:
        - name: "Flat"
          fee: 10
          cap: 40
      proof:
        - slot: "01-ticket.pdf"
          kind: "file"
          label: "Ticket"
          verify: "evidence of a valid ticket for the covered event, issued in the requester's own name"
        - slot: "02-id-document.jpg"
          kind: "file"
          label: "Identity documentation"
        - slot: "03-capacity-evidence.pdf"
          kind: "file"
          label: "Capacity evidence"
        - slot: "04-standing-evidence.jpg"
          kind: "file"
          label: "Standing evidence"
      marketing:
        blurb: "Every seat taken at the opening ceremony — and you stood the whole thing."
        logo: "https://riprap.xyz/pools/chairmageddon/logo.svg"
        share: "Standing through the opening ceremony at Breakpoint — worth $40."
        event: "Breakpoint 2026"
        smallestPayout: 40
      language: "en"
      ---

      ## 1. Product

      **Micro Mutual** is a one-time mutual pool protecting members against **the absence of seats at the opening ceremony**.

      Members contribute a fixed entry fee to a common pool. If a member experiences the covered event during the coverage period, they may request a **discretionary payment**, subject to adjudication, delivery of the required proof (§7), their coverage tier, and the remaining funds in the pool. No member has an enforceable right to a payment.

      After the payout request period closes, all remaining pool funds are distributed proportionally among members and the mutual is dissolved.

      ---

      ## 2. Coverage Period

      Coverage begins 2026-11-15 and ends 2026-11-17.

      Example:

      > **Breakpoint 2026 — Olympia Convention Centre, London**
      > Coverage: 2026-11-15 to 2026-11-17
      > Payout requests close: 2026-11-27

      Only incidents occurring during this period and within the covered area qualify. The payout request period closes 2026-11-27; requests submitted after it closes are not adjudicated.

      ---

      ## 3. Covered Event

      **Chairmageddon** means:

      At the opening ceremony of the covered event, every seat in the ceremony venue was occupied, and the member stood — on their feet, without a seat — for the entire opening ceremony, from its published start to its published end.

      - **Seat** — a thing designed to be sat on, provided by the venue, and occupied by somebody else. Stairs are not seats. The floor is not a seat.

      ---

      ## 4. Exclusions

      The following are not covered:

      - Seats available when the member arrived. Elective standing is a lifestyle, not a peril.
      - Members who sat at any point during the ceremony — on a seat, on the floor, on steps, or on another person.

      ---

      ## 5. Coverage and Price

      | Tier | Entry Fee | Maximum Payout |
      | ---- | --------: | -------------: |
      | Flat |       $10 |      up to $40 |

      Every payment is **at most** the stated amount: if the total due — approved payments and returned adjudication fees — exceeds the funds in the pool, each payment is reduced proportionally (§7). The pool may be smaller than the payments it faces.

      Each person may hold one membership in the mutual. Joining closes when the coverage period begins, so a membership cannot be created after the covered event has occurred.

      ---

      ## 6. Pool

      All member contributions enter a single mutual pool.

      The pool is used exclusively for:

      1. qualifying discretionary payments; and
      2. refunds to members after the payout request period.

      There is **no permanent reserve**.
      There is **no profit retained by the mutual**.

      ---

      ## 7. Payout Requests

      A member may submit a payout request for a qualifying Chairmageddon event occurring during the coverage period.

      ### Who may request

      A payout request is valid only if, at the time of the covered event, the requester:

      1. was the person in whose name a membership was registered, with its entry fee paid into the pool and confirmed on-chain beforehand; and
      2. was an active member.

      Filing requires access to the member's own wallet: the request is submitted and the adjudication fee is paid from that wallet.

      ### Required proof

      The pool only pays out when proof is delivered. A payout request must include all of the following:

      1. **Ticket** — evidence of a valid ticket for the covered event, issued in the requester's own name
      2. **Identity documentation**
      3. **Capacity evidence**
      4. **Standing evidence**

      The complete set of proof must belong to the same person, and that person must be the person in whose name the membership is registered. A payout request that does not include the complete set of proof is not adjudicated, and no payment is made.

      Filing a payout request requires pre-paying an adjudication fee of **$8 USDC**. A denied or invalid payout request forfeits the fee; a failed adjudication returns it to the requester.

      Evidence submitted with a payout request is used solely to adjudicate that payout request.

      ### Discretion

      All payments from the pool are **discretionary**:

      1. Payout requests are adjudicated by a randomly drawn jury of staked members (Accord, the sister arbitration protocol).
      2. No member has a contractual or enforceable right to any payment.
      3. The jury's determination is final once the appeal procedure of the adjudication protocol has been exhausted.

      If the total amount of approved requests is less than the amount available in the pool, the remaining funds are returned to members.
      If the total amount due — approved payments and returned adjudication fees — exceeds the funds available in the pool, payments and returns are reduced proportionally so that the pool never pays more than the amount it holds.

      ### Fraud

      A fraudulent payout request is invalid, no payment is made, and the adjudication fee is forfeited.

      ---

      ## 8. Pool Dissolution

      The mutual has a finite lifetime.

      After:

      1. the coverage period ends;
      2. the payout request period closes; and
      3. all approved payout requests have been settled,

      the remaining pool balance is distributed to eligible members. The mutual is then **dissolved permanently**. No funds remain in the mutual after dissolution.

      ---

      ## 9. Economic Principle

      The mutual follows a simple principle:

      > **Members pool money to protect one another against a narrowly defined event. If the event costs less than expected, members recover the unused money.**

      The entry fee therefore represents the member's maximum contribution to the pool, while the coverage tier determines the member's maximum potential payout.

      ---

      ## 10. Example

      Each member contributes: **$10**
      Maximum individual payout: **$40**

      If payments don't consume the pool, the remainder is returned to eligible members and the mutual is dissolved.

      ---

      ## 11. Product Promise

      **Join a temporary community mutual.**
      **Pay a fixed amount.**
      **Receive defined protection against the absence of seats at the opening ceremony.**
      **If payments don't consume the pool, the remaining money comes back to the members.**
      **When the event is over, the mutual ends.**
      "
    `);
  });

  it("Caffeine Supercycle canonical bytes", () => {
    expect(renderDef(caffeine)).toMatchInlineSnapshot(`
      "---
      schema: "riprap-def/v1"
      kind: "bounty"
      slug: "caffeine-supercycle"
      name: "Caffeine Supercycle"
      period:
        start: "2026-11-15"
        end: "2026-11-17"
        claims_close: "2026-11-27"
      tiers:
        - name: "Flat"
          fee: 5
          cap: 50
      proof:
        - slot: "01-ticket.pdf"
          kind: "file"
          label: "Ticket"
        - slot: "02-id-document.jpg"
          kind: "file"
          label: "Identity documentation"
        - slot: "03-request-evidence.url"
          kind: "url"
          label: "Request evidence"
          verify: "the post or message from the named person's known account containing the request"
        - slot: "04-delivery-evidence.jpg"
          kind: "file"
          label: "Delivery evidence"
        - slot: "05-confirmation.url"
          kind: "url"
          label: "Confirmation"
          verify: "the named person confirming they requested and received the drink from the member"
      language: "en"
      ---

      ## 1. Product

      **Micro Bounty** is a one-time bounty pool paying members for **bringing Lily, Toly, or Raj a hot drink they asked for**.

      Members pay a fixed entry fee into a common pot. If a member completes the qualifying act during the bounty period, they may claim a **bounty**, subject to adjudication, delivery of the required proof (§7), the caps (§5), and the remaining funds in the pot. No member has an enforceable right to a payment.

      After the claim window closes, all remaining pot funds are distributed proportionally among members and the bounty pool is dissolved.

      ---

      ## 2. Bounty Period

      The bounty period begins 2026-11-15 and ends 2026-11-17.

      Only deliveries occurring during this period qualify. The claim window closes 2026-11-27; claims submitted after it closes are not adjudicated.

      ---

      ## 3. Qualifying Delivery

      A **Qualifying Delivery** means:

      A **Qualifying Delivery** means the request, the procurement, the handover, and the confirmation, in that order, with respect to one named person on the roster: Lily Liu, Anatoly "Toly" Yakovenko, and Raj Gokal.

      - **Hot drink** — coffee, tea, hot chocolate, or similar, served hot and intended for immediate consumption.

      ---

      ## 4. Exclusions

      The following do not qualify:

      - Deliveries made without a request from the named person.
      - Drinks that were no longer hot at handover.
      - Deliveries to an intermediary instead of the named person's hand.

      ---

      ## 5. Bounty and Price

      | Tier | Entry Fee |    Bounty |
      | ---- | --------: | --------: |
      | Flat |        $5 | up to $50 |

      Every payment is **at most** the stated amount: if the total due — approved payments and returned adjudication fees — exceeds the funds in the pot, each payment is reduced proportionally (§7). The pot may be smaller than the payments it faces.

      Each person may hold one membership in the bounty pool. Joining closes when the bounty period begins, so a membership cannot be created after a qualifying delivery has occurred.

      ---

      ## 6. The Pot

      All entry fees enter a single pot.

      The pot is used exclusively for:

      1. bounties for verified qualifying deliveries; and
      2. refunds to members after the claim window.

      There is **no permanent reserve**.
      There is **no profit retained by the bounty pool**.

      ---

      ## 7. Claims

      A member may submit a claim for a Qualifying Delivery occurring during the bounty period.

      ### Who may request

      A claim is valid only if, at the time of the delivery, the claimant:

      1. was the person in whose name a membership was registered, with its entry fee paid into the pot and confirmed on-chain beforehand; and
      2. was an active member.

      Filing requires access to the member's own wallet: the request is submitted and the adjudication fee is paid from that wallet.

      ### Required proof

      The pot only pays out when proof is delivered. A claim must include all of the following:

      1. **Ticket**
      2. **Identity documentation**
      3. **Request evidence** — the post or message from the named person's known account containing the request
      4. **Delivery evidence**
      5. **Confirmation** — the named person confirming they requested and received the drink from the member

      The complete set of proof must belong to the same person, and that person must be the person in whose name the membership is registered. A claim that does not include the complete set of proof is not adjudicated, and no payment is made.

      Filing a claim requires pre-paying an adjudication fee of **$8 USDC**. A denied or invalid claim forfeits the fee; a failed adjudication returns it to the requester.

      Evidence submitted with a claim is used solely to adjudicate that claim.

      ### Discretion

      All payments from the pot are **discretionary**:

      1. Claims are adjudicated by a randomly drawn jury of staked members (Accord, the sister arbitration protocol).
      2. No member has a contractual or enforceable right to any payment.
      3. The jury's determination is final once the appeal procedure of the adjudication protocol has been exhausted.

      If the total amount of approved claims is less than the amount available in the pot, the remaining funds are returned to members.
      If the total amount due — approved payments and returned adjudication fees — exceeds the funds available in the pot, payments and returns are reduced proportionally so that the pot never pays more than the amount it holds.

      ### Fraud

      A fraudulent claim is invalid, no payment is made, and the adjudication fee is forfeited.

      ---

      ## 8. Winding Up

      The bounty pool has a finite lifetime.

      After:

      1. the bounty period ends;
      2. the claim window closes; and
      3. all approved claims have been settled,

      the remaining pot balance is distributed to eligible members. The bounty pool is then **dissolved permanently**. No funds remain in the pot after dissolution.

      ---

      ## 9. Economic Principle

      The bounty pool follows a simple principle:

      > **Members fund bounties for verified acts. Work that is verified is paid. Money that is not earned comes back to the members.**

      The entry fee is the member's maximum contribution to the pot, and the bounty tier determines the member's maximum payout.

      ---

      ## 10. Example

      Each member contributes: **$5**
      Maximum individual bounty: **$50**

      If bounties don't consume the pot, the remainder is returned to eligible members and the bounty pool is dissolved.

      ---

      ## 11. Product Promise

      **Join a temporary bounty pool.**
      **Pay a fixed amount.**
      **Get paid for proof of bringing Lily, Toly, or Raj a hot drink they asked for.**
      **If bounties don't consume the pot, the remaining money comes back to the members.**
      **When the event is over, the bounty ends.**
      "
    `);
  });
});

describe("riprap-def/v1 — validation matrix (HANDOFF §3/§6)", () => {
  it("schema tag must be exactly riprap-def/v1", () => {
    const rejections = validateFrontmatter({ ...baseDef(), schema: "riprap-def/v2" });
    expect(rejections).toContainEqual({ code: "unknown-schema", found: "riprap-def/v2" });
  });

  it("kind is a two-value enum", () => {
    // out-of-contract on purpose — the enum check exists for untrusted CAS bytes
    const rejections = validateFrontmatter({
      ...baseDef(),
      kind: "syndicate" as DefFrontmatter["kind"],
    });
    expect(rejections).toContainEqual({ code: "bad-kind", found: "syndicate" });
  });

  it("slug is kebab-case", () => {
    expect(validateFrontmatter({ ...baseDef(), slug: "Chairmageddon" })).toContainEqual({
      code: "bad-slug",
      found: "Chairmageddon",
    });
    expect(validateFrontmatter({ ...baseDef(), slug: "caffeine_supercycle" })).toContainEqual({
      code: "bad-slug",
      found: "caffeine_supercycle",
    });
  });

  it("name must be non-empty", () => {
    expect(validateFrontmatter({ ...baseDef(), name: "  " })).toContainEqual({ code: "bad-name" });
  });

  it("period dates are ISO and ordered claims_close > end >= start", () => {
    const base = baseDef();
    expect(
      validateFrontmatter({ ...base, period: { ...base.period, start: "Nov 15" } }),
    ).toContainEqual({ code: "bad-period", reason: "not-iso", field: "start" });
    expect(
      validateFrontmatter({ ...base, period: { ...base.period, end: "2026-02-30" } }),
    ).toContainEqual({ code: "bad-period", reason: "not-a-date", field: "end" });
    expect(
      validateFrontmatter({ ...base, period: { ...base.period, end: "2026-11-14" } }),
    ).toContainEqual({ code: "bad-period", reason: "order" });
    expect(
      validateFrontmatter({ ...base, period: { ...base.period, claims_close: "2026-11-17" } }),
    ).toContainEqual({ code: "bad-period", reason: "order" });
    expect(validateFrontmatter({ ...base, period: { ...base.period, venue: " " } })).toContainEqual(
      { code: "bad-period", reason: "empty", field: "venue" },
    );
  });

  it("tiers number 1–3", () => {
    expect(validateFrontmatter({ ...baseDef(), tiers: [] })).toContainEqual({
      code: "bad-tier-count",
      found: 0,
    });
    expect(
      validateFrontmatter({
        ...baseDef(),
        tiers: [1, 2, 3, 4].map((n) => ({ name: `T${n}`, fee: 10, cap: 40 })),
      }),
    ).toContainEqual({ code: "bad-tier-count", found: 4 });
  });

  it("tiers need fee > 0", () => {
    expect(
      validateFrontmatter({ ...baseDef(), tiers: [{ name: "Flat", fee: 0, cap: 40 }] }),
    ).toContainEqual({ code: "bad-tier", tier: "Flat", reason: "fee-not-positive" });
  });

  it("tiers need cap >= fee — the rejection names the tier (HANDOFF §6 row 2)", () => {
    expect(
      validateFrontmatter({ ...baseDef(), tiers: [{ name: "Flat", fee: 10, cap: 5 }] }),
    ).toContainEqual({ code: "bad-tier", tier: "Flat", reason: "cap-below-fee" });
  });

  it("proof needs at least one slot", () => {
    expect(validateFrontmatter({ ...baseDef(), proof: [] })).toContainEqual({
      code: "proof-empty",
    });
  });

  it("slot paths follow NN-slug.ext with the global MIME extensions", () => {
    for (const path of ["ticket.pdf", "1-ticket.pdf", "01-Ticket.pdf", "01-ticket.docx"]) {
      const proof = [{ slot: path, kind: "file" }] as DefFrontmatter["proof"];
      expect(validateFrontmatter({ ...baseDef(), proof })).toContainEqual({
        code: "bad-slot",
        slot: path,
        reason: "grammar",
      });
    }
  });

  it("slot ordinals are unique", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [
          { slot: "01-ticket.pdf", kind: "file" },
          { slot: "01-id.pdf", kind: "file" },
        ],
      }),
    ).toContainEqual({ code: "bad-slot", slot: "01-id.pdf", reason: "ordinal-duplicate" });
  });

  it("slot kind is file|url and agrees with the extension", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [{ slot: "01-ticket.pdf", kind: "photo" as DefProofSlot["kind"] }], // out-of-contract on purpose
      }),
    ).toContainEqual({ code: "bad-slot", slot: "01-ticket.pdf", reason: "bad-kind" });
    expect(
      validateFrontmatter({ ...baseDef(), proof: [{ slot: "01-ticket.url", kind: "file" }] }),
    ).toContainEqual({ code: "bad-slot", slot: "01-ticket.url", reason: "kind-mismatch" });
    expect(
      validateFrontmatter({ ...baseDef(), proof: [{ slot: "01-ticket.pdf", kind: "url" }] }),
    ).toContainEqual({ code: "bad-slot", slot: "01-ticket.pdf", reason: "kind-mismatch" });
  });

  it("optional slot prose must be non-empty when present", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [{ slot: "01-ticket.pdf", kind: "file", label: " " }],
      }),
    ).toContainEqual({ code: "bad-slot", slot: "01-ticket.pdf", reason: "empty-optional" });
  });

  it("marketing fields are non-empty, logo is an http(s) link, smallestPayout > 0", () => {
    expect(validateFrontmatter({ ...baseDef(), marketing: { blurb: " " } })).toContainEqual({
      code: "bad-marketing",
      field: "blurb",
      reason: "empty",
    });
    expect(validateFrontmatter({ ...baseDef(), marketing: { logo: "not-a-url" } })).toContainEqual({
      code: "bad-marketing",
      field: "logo",
      reason: "bad-url",
    });
    expect(validateFrontmatter({ ...baseDef(), marketing: { smallestPayout: 0 } })).toContainEqual({
      code: "bad-marketing",
      field: "smallestPayout",
      reason: "not-positive",
    });
  });

  it("language is a lowercase tag", () => {
    expect(validateFrontmatter({ ...baseDef(), language: "EN" })).toContainEqual({
      code: "bad-language",
      found: "EN",
    });
  });

  it("frontmatter unknown keys are rejected at parse (HANDOFF §3)", () => {
    expect(() => parseFrontmatter('schema: "riprap-def/v1"\ninsurance: "yes"')).toThrow(
      DefFormatError,
    );
    expect(() =>
      parseFrontmatter('schema: "riprap-def/v1"\nperiod:\n  start: "x"\n  doors: "9"'),
    ).toThrow(/unknown key 'doors'/);
  });

  it("integers beyond the safe range are rejected at parse and render (round-trip precision)", () => {
    expect(() =>
      parseFrontmatter(
        'schema: "riprap-def/v1"\ntiers:\n  - name: "Flat"\n    fee: 99999999999999999999\n    cap: 100',
      ),
    ).toThrow(DefFormatError);
    expect(() =>
      renderDef({ ...chairmageddon, tiers: [{ name: "Flat", fee: 1e21, cap: 40 }] }),
    ).toThrow(/safe integer/);
  });

  it("validateDefInput carries the prose presence rules", () => {
    expect(validateDefInput({ ...chairmageddon, peril: " " })).toContainEqual({
      code: "bad-prose",
      field: "peril",
    });
    expect(validateDefInput({ ...chairmageddon, exclusions: [] })).toContainEqual({
      code: "bad-prose",
      field: "exclusions",
    });
    expect(validateDefInput({ ...chairmageddon, economics: { filingFeeUsdc: 0 } })).toContainEqual({
      code: "bad-prose",
      field: "economics",
    });
  });

  it("validateDefArtifact: valid vectors reject nothing", () => {
    expect(validateDefArtifact(renderDef(chairmageddon))).toEqual([]);
    expect(validateDefArtifact(renderDef(caffeine))).toEqual([]);
  });

  it("validateDefArtifact: malformed bytes surface as one malformed rejection", () => {
    const noFence = renderDef(chairmageddon).replace("---\n", "");
    expect(validateDefArtifact(noFence)).toEqual([
      { code: "malformed", detail: expect.stringContaining("frontmatter fence") },
    ]);
    expect(validateDefArtifact("")).toEqual([{ code: "malformed", detail: expect.any(String) }]);
    const foreignYaml = '---\nschema: "riprap-def/v1"\nkind: [mutual, x]\n---\n';
    expect(validateDefArtifact(foreignYaml)).toEqual([
      { code: "malformed", detail: expect.any(String) },
    ]);
  });

  it("validateDefArtifact: the body must carry exactly the kind's 11 §s", () => {
    const doc = renderDef(chairmageddon);
    // drop §11 → wrong count, no per-section noise
    const truncated = doc.split("\n\n---\n\n## 11.")[0].concat("\n");
    expect(validateDefArtifact(truncated)).toEqual([{ code: "bad-body", reason: "section-count" }]);
    // retitle §3 → the mismatch names the section
    const retitled = doc.replace("## 3. Covered Event", "## 3. Covered Things");
    expect(validateDefArtifact(retitled)).toEqual([
      { code: "bad-body", reason: "section-title", section: 3 },
    ]);
    // renumber §3 → the gap names the section
    const renumbered = doc.replace("## 3. Covered Event", "## 4. Covered Event");
    expect(validateDefArtifact(renumbered)).toEqual([
      { code: "bad-body", reason: "section-number", section: 3 },
    ]);
  });
});

describe("riprap-def/v1 — round-trip (renderer output parses back)", () => {
  for (const vector of [chairmageddon, caffeine]) {
    it(`${vector.name} (${vector.kind}): frontmatter and § body parse back`, () => {
      const doc = renderDef(vector);
      const { frontmatter, body } = splitDefDocument(doc);

      const fm = parseFrontmatter(frontmatter);
      expect(fm.kind).toBe(vector.kind);
      expect(fm.slug).toBe(vector.slug);
      expect(fm.name).toBe(vector.name);
      expect(fm.period).toEqual(vector.period);
      expect(fm.tiers).toEqual(vector.tiers);
      expect(fm.proof).toEqual(vector.proof);
      expect(fm.marketing).toEqual(vector.marketing);
      expect(fm.language).toBe("en");

      const sections = parseSections(body);
      expect(sections).toHaveLength(SECTION_COUNT);
      expect(sections.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(sections.map((s) => s.title)).toEqual(sectionTitles(vector.kind));
      for (const section of sections) {
        expect(section.body.length).toBeGreaterThan(0);
        // the canonical `---` separators never leak into a section body
        expect(section.body.split("\n").filter((line) => line.trim() === "---")).toEqual([]);
      }
    });
  }

  it("a def with any rejection is droppable from the artifact verdict alone (HANDOFF §3: never fallback content)", () => {
    const valid = renderDef(caffeine);
    const invalid = valid.replace('slug: "caffeine-supercycle"', 'slug: "Caffeine Supercycle"');
    expect(validateDefArtifact(valid)).toEqual([]);
    expect(validateDefArtifact(invalid).length).toBeGreaterThan(0);
  });
});
