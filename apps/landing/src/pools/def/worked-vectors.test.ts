// The def-resolution tester matrix (epic riprap-hs4r, bean riprap-vqoa): the
// second worked vector — the Caffeine Supercycle bounty shape — projected
// through the pack builders, the derived listing, and the share template,
// complementing the mutual vector in packs.test.ts, the page/hero/registry
// suites (GenericPoolPage.test.tsx), and the store CAS matrix
// (store.test.tsx). Numbers trace to the terms doc §5 (prices final
// 2026-10-13) — the doc's bytes, not UI copy.
import type { Address } from "@solana/kit";
import { describe, expect, it } from "vitest";

import { buildShareText } from "../pages/GenericPoolHero";
import { listingFromDef } from "./listing";
import { buildAdjudicationPolicy, buildClaimFlow } from "./packs";
import { parseDefDoc, type RiprapDef } from "./schema";

const ADDR = "FovDXMye3aqv6N6c4WAa6w7wTo2u1Q5To75M96Y7nqPQ" as Address;

/** The Caffeine Supercycle bounty as a community def — frontmatter machine
 *  block + the shared 11-§ skeleton (abbreviated to the § the surfaces
 *  read). Two url-kind proof slots exercise the https intake path. */
const CAFFEINE_DEF = `---
schema: "riprap-def/v1"
kind: "bounty"
slug: "hot-drink-bounty"
name: "Hot Drink Bounty"
period:
  start: "2026-11-15"
  end: "2026-11-17"
  claims_close: "2026-11-27"
  venue: "Olympia Convention Centre, London"
tiers:
  - name: "Flat"
    fee: 5
    cap: 50
proof:
  - slot: "01-ticket.pdf"
    kind: "file"
    label: "your event ticket"
    verify: "a valid ticket for the event, in the requester's own name"
  - slot: "02-id.jpg"
    kind: "file"
    label: "government photo ID"
  - slot: "03-request.url"
    kind: "url"
    label: "the request — their post, message, or a witnessed statement"
    verify: "the request came from the named person, before the delivery"
  - slot: "04-delivery.jpg"
    kind: "file"
    label: "the timestamped photo or video of the handover"
  - slot: "05-confirmation.url"
    kind: "url"
    label: "their post confirming the request and the delivery"
marketing:
  headline: "Bring the drink. Get paid."
  blurb: "Bring the named person a hot drink they asked for — hand to hand, still hot, confirmed by them."
  logo: "https://riprap.xyz/pools/caffeine-supercycle/logo.svg"
  share: "I'm on drink duty at {event}.\\n{cap} for one confirmed hand-off.\\nI'm in. @riprapxyz"
  event: "Breakpoint"
  smallestPayout: 50
language: "en"
---
## 3. Qualifying Delivery

The **Qualifying Delivery** means all of the following, in this order:

1. **The Request** — the named person requested a hot drink, the request coming from that person and preceding the delivery.
2. **The Handover** — the member personally placed the drink, still hot, in the named person's hand.

- **Hot drink** — coffee, tea, hot chocolate, or similar, served hot and intended for immediate consumption.

## 4. Exclusions

The following do not qualify:

- Deliveries made without a request from the named person.
- Drinks that were no longer hot at handover.
- Deliveries to an intermediary instead of the named person's hand.

## 7. Claims

Filing requires the member's own wallet. The adjudication fee is pre-paid from that wallet; a denied claim forfeits it, an approved one returns it with the payment.

## 11. Product Promise

**Join a temporary bounty pool.**
**Pay a fixed amount.**
**Get paid for proof of the qualifying delivery.**
`;

const DEF = parseDefDoc(CAFFEINE_DEF) as RiprapDef;

describe("the bounty worked vector — parse + listing", () => {
  it("parses the machine block whole", () => {
    expect(DEF).not.toBeNull();
    expect(DEF.kind).toBe("bounty");
    expect(DEF.proof).toHaveLength(5);
    expect(DEF.proof.filter((p) => p.kind === "url")).toHaveLength(2);
    expect(DEF.marketing?.smallestPayout).toBe(50);
  });

  it("derives the listing per HANDOFF §4 — blurb tagline, tier names, payout floor", () => {
    const listing = listingFromDef(DEF, ADDR);
    expect(listing.tagline).toBe(DEF.marketing?.blurb);
    expect(listing.kind).toBe("bounty");
    expect(listing.tiers).toEqual([{ name: "Flat", fee: 5, cap: 50 }]);
    expect(listing.smallestPayout).toBe(50); // marketing.smallestPayout, not a cap guess
    expect(listing.badge).toBeUndefined();
  });

  it("falls back to a §3 excerpt for the tagline when blurb is absent", () => {
    const noBlurb = parseDefDoc(CAFFEINE_DEF.replace(/ {2}blurb: .*\n/, "")) as RiprapDef;
    const listing = listingFromDef(noBlurb, ADDR);
    // first sentence of §3's prose — the qualifying act, named
    expect(listing.tagline).toContain("Qualifying Delivery");
  });
});

describe("the bounty worked vector — packs", () => {
  const flow = buildClaimFlow(DEF);
  const policy = buildAdjudicationPolicy(DEF);

  it("slots carry the doc's ordinals; url kinds mark the url slots on the claimant side", () => {
    expect(
      flow.documentSlots.map((s) => `${s.path}:${s.url === undefined ? "file" : "url"}`),
    ).toEqual([
      "01-ticket.pdf:file",
      "02-id.jpg:file",
      "03-request.url:url",
      "04-delivery.jpg:file",
      "05-confirmation.url:url",
    ]);
  });

  it("slot parity — the juror checklist walks the same five paths in the same order", () => {
    expect(policy.documentSlots.map((s) => s.path)).toEqual(flow.documentSlots.map((s) => s.path));
  });

  it("the def's verify lines ride the juror slots; unverified slots get the generic screen", () => {
    expect(policy.documentSlots.map((s) => s.whatToVerify)).toEqual([
      "a valid ticket for the event, in the requester's own name",
      "the proof the terms ask for, in the requester's own name",
      "the request came from the named person, before the delivery",
      "the proof the terms ask for, in the requester's own name",
      "the proof the terms ask for, in the requester's own name",
    ]);
  });

  it("bounty word-maps: Not paid, qualifying-act screens, bounty claim title", () => {
    expect(flow.exclusionsLine).toContain("Not paid: Deliveries made without a request");
    expect(flow.screenChecks[0]?.label).toContain("qualifying act");
    expect(flow.manifestTitle("2026-11-16")).toBe("Bounty claim — Hot Drink Bounty, 2026-11-16");
  });

  it("the marketing share template fills with real figures and drops unread ones", () => {
    const share = buildShareText(DEF);
    expect(share("$5", "$50")).toContain("$50 for one confirmed hand-off");
    expect(share("$5", "$50")).toContain("drink duty at Breakpoint");
    // unread figures drop out — numbers are never faked
    expect(share(null, null)).not.toContain("{cap}");
    expect(share(null, null)).not.toContain("null");
  });
});
