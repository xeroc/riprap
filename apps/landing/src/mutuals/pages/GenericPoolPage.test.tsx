// The generic def-driven pool surface (epic riprap-hs4r): registry fallback,
// the def → PoolPageConfig projection (doc bands from the § body, numbers
// verbatim from the doc bytes), the derived listing, the kind-templated hero
// defaults, and the honest terminal states. Structural + data-binding only —
// copy is the def's and the kind templates'.
import { AppProvider, getDefaultConfig } from "@solana/connector";
import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MUTUALS } from "../data";
import { listingFromDef } from "../def/listing";
import { parseDefDoc, type RiprapDef } from "../def/schema";
import { POOL_PAGES, poolPageFor } from "../registry";
import { buildShareText, GenericPoolHero } from "./GenericPoolHero";
import { GenericPoolPage, poolPageConfigFromDef } from "./GenericPoolPage";

afterEach(cleanup);

/** A worked mutual def vector — the Chairmageddon shape: frontmatter machine
 *  block + the shared 11-§ skeleton (abbreviated to the § the bands read). */
const WORKED_DEF = `---
schema: riprap-def/v1
kind: mutual
slug: chairmageddon
name: Chairmageddon
period:
  start: "2026-11-15"
  end: "2026-11-17"
  claims_close: "2026-11-24"
  venue: Olympia Convention Centre, London
tiers:
  - name: Flat
    fee: 10
    cap: 40
proof:
  - slot: 01-ticket.jpg
    kind: file
    label: Event ticket in your own name
  - slot: 02-declaration.md
    kind: file
    label: Declaration of the facts, signed with your wallet
marketing:
  headline: Every seat taken. You stood.
  blurb: Every seat taken at the opening ceremony — and you stood the whole thing.
  odds:
    - You get there early — wasted caution
    - Every seat fills — near cert
  share: "I stood through it at {event}.\\nUp to {cap} if it lands.\\nI'm in. @riprapxyz"
  event: Breakpoint
  smallestPayout: 40
---
## 1. Product

A joke with a payout schedule.

## 3. Covered Event

**Chairmageddon** means:

> At the opening ceremony, every seat in the ceremony venue was occupied, and the member stood for the entire opening ceremony.

- **Seat** — a thing designed to be sat on, provided by the venue, and occupied by somebody else.
- **Standing** — remaining on one's feet, without a seat, for the entire ceremony.

A member who found a seat at any point was not standing for the entire ceremony.

## 4. Exclusions

The following are not covered:

- Seats available when the member arrived. Elective standing is a lifestyle, not a peril.
- Members who sat at any point during the ceremony.

## 5. Coverage and Price

| Tier | Entry Fee | Payout |
| ---- | --------: | -----: |
| Flat |       $10 | up to $40 |

## 7. Payout Requests

Filing requires the member's own wallet. The adjudication fee is pre-paid from that wallet; a denied claim forfeits it, an approved one returns it with the payment.

## 8. Pool Dissolution

After the claim window closes, the remaining balance returns to eligible members and the mutual is dissolved.

## 10. Example

**1,000 members**

Each contributes: **$10**
Total pool: **$10,000**
Maximum individual payout: **$40**

**Payments made: $8,000**
Remaining pool: **$2,000**

A member who contributed $10 therefore receives their applicable share of the unused pool back.

## 11. Product Promise

**Join a temporary community mutual.**
**Pay a fixed amount.**
`;

/** The marketing-less variant — kind templates fill every absent field. */
const NO_MARKETING_DEF = WORKED_DEF.replace(/marketing:\n(?: {2}.*\n)+/, "");

const ADDR = "5Yo1BKU8Vy9mRRwXqrjJhtw4CFmfkZiZoW7VSTj5huEq" as Address;
const DEF = parseDefDoc(WORKED_DEF) as RiprapDef;
const NO_MKT_DEF = parseDefDoc(NO_MARKETING_DEF) as RiprapDef;
const LISTING = listingFromDef(DEF, ADDR);

describe("parseDefDoc", () => {
  it("parses the machine block and the § body", () => {
    expect(DEF.name).toBe("Chairmageddon");
    expect(DEF.kind).toBe("mutual");
    expect(DEF.tiers).toEqual([{ name: "Flat", fee: 10, cap: 40 }]);
    expect(DEF.proof).toHaveLength(2);
    expect(DEF.marketing?.event).toBe("Breakpoint");
    expect(DEF.body).toContain("## 3. Covered Event");
  });

  it("drops non-defs — a state, never a fallback", () => {
    expect(parseDefDoc("# just markdown\n\nno frontmatter")).toBeNull();
    expect(parseDefDoc("---\nschema: other/v9\n---\n\nbody")).toBeNull();
    // kind is a copy-selector enum, not free text (D8)
    expect(parseDefDoc("---\nschema: riprap-def/v1\nkind: syndicate\n---\n")).toBeNull();
    expect(parseDefDoc("---\ntiers: []\n---\n")).toBeNull();
    expect(NO_MKT_DEF.marketing).toBeUndefined();
    expect(NO_MKT_DEF.name).toBe("Chairmageddon");
  });
});

describe("listingFromDef", () => {
  it("derives the listing per HANDOFF §4", () => {
    expect(LISTING.tagline).toBe(DEF.marketing?.blurb);
    expect(LISTING.smallestPayout).toBe(40);
    expect(LISTING.pubkey).toBe(ADDR);
    expect(LISTING.badge).toBeUndefined();
  });

  it("falls back to a §3 excerpt for the tagline when blurb is absent", () => {
    const listing = listingFromDef(NO_MKT_DEF, ADDR);
    // first sentence of §3's prose — the covered event, named
    expect(listing.tagline.length).toBeGreaterThan(0);
    expect(listing.smallestPayout).toBe(40); // the flat tier's cap
  });
});

describe("poolPageConfigFromDef", () => {
  const config = poolPageConfigFromDef(DEF, LISTING);

  it("reads §3 as the definition quote plus the notes, minus the intro", () => {
    expect(config.definition).toContain("every seat in the ceremony venue was occupied");
    expect(config.definitionNotes).toContainEqual(
      expect.stringContaining("Seat — a thing designed to be sat on"),
    );
    expect(config.definitionNotes.join("\n")).not.toContain("means:");
  });

  it("reads §4 exclusions as list items only", () => {
    expect(config.exclusions).toHaveLength(2);
    expect(config.exclusions[0]).toContain("Seats available when the member arrived");
    expect(config.exclusions.join("\n")).not.toContain("not covered:");
  });

  it("single-sources the proof list and the tier table off the machine block", () => {
    expect(config.proof).toEqual([
      "Event ticket in your own name",
      "Declaration of the facts, signed with your wallet",
    ]);
    expect(config.tiers).toEqual([{ name: "Flat", fee: 10, cap: 40 }]);
  });

  it("renders §10 as a receipt — numbers verbatim from the doc", () => {
    expect(config.example.lines).toContainEqual({ value: "1,000", caption: "members" });
    expect(config.example.lines).toContainEqual({ value: "$10", caption: "Each contributes" });
    expect(config.example.total).toEqual({ value: "$2,000", caption: "Remaining pool" });
    expect(config.example.note).toContain("applicable share");
  });

  it("renders §11 bold lines as the promise and §8 as the end note", () => {
    expect(config.promise).toEqual(["Join a temporary community mutual.", "Pay a fixed amount."]);
    expect(config.endNote).toContain("remaining balance returns to eligible members");
  });

  it("carries the §7 fee note", () => {
    expect(config.feeNote).toContain("adjudication fee");
  });

  it("falls back to the numberless kind templates when the §s are absent", () => {
    const shortDoc = WORKED_DEF.replace(/## 10\. Example[\s\S]*?(?=## 11)/, "").replace(
      /## 11\. Product Promise[\s\S]*$/,
      "",
    );
    const short = parseDefDoc(shortDoc);
    expect(short).not.toBeNull();
    const c = poolPageConfigFromDef(short as RiprapDef, LISTING);
    expect(c.example.lines[0]?.value).toBe("{{PARAM}}");
    expect(c.promise.length).toBeGreaterThan(0);
    expect(c.promise.join(" ")).not.toMatch(/\d/);
    expect(c.feeNote).not.toMatch(/\d/);
  });
});

describe("buildShareText", () => {
  it("fills the def's share template with real figures", () => {
    const share = buildShareText(DEF);
    expect(share("$10", "$40")).toContain("Up to $40 if it lands");
    expect(share("$10", "$40")).toContain("@riprapxyz");
    // unread figures drop out — numbers are never faked
    expect(share(null, null)).not.toContain("{cap}");
    expect(share(null, null)).not.toContain("null");
  });

  it("uses the kind default when marketing.share is absent", () => {
    const share = buildShareText(NO_MKT_DEF);
    expect(share("$10", "$40")).toContain("@riprapxyz");
    expect(share("$10", "$40")).toContain("Chairmageddon");
  });
});

describe("registry fallback", () => {
  it("pins known ids and sends unknown ids to the generic page", () => {
    const known = MUTUALS[0];
    if (known === undefined) throw new Error("no mutuals in the directory");
    const id = known.pubkey ?? known.slug;
    expect(poolPageFor(id)).toBe(POOL_PAGES[id]);
    expect(poolPageFor(ADDR)).not.toBe(POOL_PAGES[id]);
  });
});

const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

function renderPage(Page: () => React.JSX.Element) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={testConfig}>
        <Page />
      </AppProvider>
    </QueryClientProvider>,
  );
}

describe("GenericPoolHero", () => {
  it("renders the marketing block's headline and the odds rail", () => {
    const { container } = renderPage(() => <GenericPoolHero listing={LISTING} def={DEF} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Every seat taken. You stood.",
    );
    expect(container.textContent).toContain("You get there early");
    // figures are chain reads — PARAM or an honest chain state, never faked
    expect(container.textContent).toMatch(
      /\{\{PARAM\}\}|Reading the pool|Couldn't reach the cluster|isn't deployed/,
    );
  });

  it("renders kind-templated defaults when marketing is absent", () => {
    renderPage(() => (
      <GenericPoolHero listing={listingFromDef(NO_MKT_DEF, ADDR)} def={NO_MKT_DEF} />
    ));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "One peril. One pool. It ends.",
    );
  });
});

describe("GenericPoolPage", () => {
  it("renders the honest terminal state for a non-address route id", () => {
    const { container } = renderPage(() => <GenericPoolPage id="not-an-address" />);
    expect(container.textContent).toContain("No pool at this address.");
  });
});
