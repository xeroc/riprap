// The generic def-driven pool surface (epic riprap-hs4r): registry fallback,
// the def → PoolPageConfig projection (legacy numbered §s and the free-form
// body, numbers verbatim from the doc bytes), the derived listing, the
// platform-wide promise/end note, the kind-templated hero defaults, and the
// honest terminal states. Structural + data-binding only — copy is the def's
// and the kind templates'.
import { AppProvider, getDefaultConfig } from "@solana/connector";
import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { POOLS } from "../data";
import { listingFromDef } from "../def/listing";
import { parseDefDoc, type RiprapDef } from "../def/schema";
import { POOL_PAGES, poolPageFor } from "../registry";
import { buildShareText, GenericPoolHero } from "./GenericPoolHero";
import { GenericPoolPage, poolPageConfigFromDef } from "./GenericPoolPage";

afterEach(cleanup);

/** A worked mutual def vector — the Chairmageddon shape: frontmatter machine
 *  block + the shared 11-§ skeleton (abbreviated to the § the bands read). */
const WORKED_DEF = `---
schema: "riprap-def/v1"
kind: "mutual"
slug: "chairmageddon"
name: "Chairmageddon"
period:
  start: "2026-11-15"
  end: "2026-11-17"
  claims_close: "2026-11-24"
  venue: "Olympia Convention Centre, London"
tiers:
  - name: "Flat"
    fee: 10
    cap: 40
proof:
  - slot: "01-ticket.jpg"
    kind: "file"
    label: "Event ticket in your own name"
  - slot: "02-declaration.md"
    kind: "file"
    label: "Declaration of the facts, signed with your wallet"
marketing:
  headline: "Every seat taken. You stood."
  blurb: "Every seat taken at the opening ceremony — and you stood the whole thing."
  logo: "https://riprap.xyz/pools/chairmageddon/logo.svg"
  share: "I stood through it at {event}.\\nUp to {cap} if it lands.\\nI'm in. @riprapxyz"
  event: "Breakpoint"
  smallestPayout: 40
---
## 1. Product

A joke with a payout schedule.

## 3. Qualifying Event

**Chairmageddon** means:

> At the opening ceremony, every seat in the ceremony venue was occupied, and the member stood for the entire opening ceremony.

- **Seat** — a thing designed to be sat on, provided by the venue, and occupied by somebody else.
- **Standing** — remaining on one's feet, without a seat, for the entire ceremony.

A member who found a seat at any point was not standing for the entire ceremony.

## 4. Exclusions

The following are excluded:

- Seats available when the member arrived. Elective standing is a lifestyle, not a peril.
- Members who sat at any point during the ceremony.

## 5. Coverage and Price

| Tier | Entry Fee | Payout |
| ---- | --------: | -----: |
| Flat |       $10 | up to $40 |

## 7. Payout Requests

Filing requires the member's own wallet. The adjudication fee is pre-paid from that wallet; a denied request forfeits it, an approved one returns it with the payment.

## 8. Pool Dissolution

Old winding-up words that the platform note must ignore.

## 10. Example

**1,000 members**

Each contributes: **$10**
Total pool: **$10,000**
Maximum individual payout: **$40**

**Payments made: $8,000**
Remaining pool: **$2,000**

A member who contributed $10 therefore receives their applicable share of the unused pool back.

## 11. Product Promise

**Old promise line.**
`;

/** The marketing-less variant — kind templates fill every absent field. */
const NO_MARKETING_DEF = WORKED_DEF.replace(/marketing:\n(?: {2}.*\n)+/, "");

/** A free-form body: no numbered §s, its own `## Exclusions`, and a tagline
 *  fallback that starts at the first prose paragraph. */
const FREE_FORM_DEF = `---
schema: "riprap-def/v1"
kind: "mutual"
slug: "free-form"
name: "Free Form"
period:
  start: "2026-11-15"
  end: "2026-11-17"
  claims_close: "2026-11-24"
tiers:
  - name: "Flat"
    fee: 10
    cap: 40
proof:
  - slot: "01-ticket.pdf"
    kind: "file"
    label: "Ticket"
---
## Qualifying event

A free-form peril, stated plainly. A second sentence that must not be the tagline.

## Exclusions

- Excluded one.
- Excluded two.

## Anything else

The body rides whole.
`;

/** A pre-canonical #/create doc: bare enum tokens, `smallest_payout`, and
 * the old 10-§ body (exclusions folded into §3). */
const LEGACY_DEF = `---
schema: riprap-def/v1
kind: mutual
slug: "legacy"
name: "Legacy"
period:
  start: "2026-11-15"
  end: "2026-11-17"
  claims_close: "2026-11-24"
tiers:
  - name: "Flat"
    fee: 10
    cap: 40
proof:
  - slot: "01-ticket.pdf"
    kind: file
    label: "Ticket"
marketing:
  smallest_payout: 0
---
# Legacy — terms

## 1. Product

Legacy is a mutual.

## 2. Window

Coverage runs 2026-11-15 to 2026-11-17.

## 3. Qualifying event

A fall.

## 4. Tiers

| Flat | $10 | $40 |

## 5. Pool

One pot.

## 6. Payout requests

- \`01-ticket.pdf\` — Ticket

## 7. End

The pool dissolves.

## 8. Economic principle

Proportional.

## 9. Example

A member pays $10.

## 10. Promise

These terms govern.
`;

const ADDR = "5Yo1BKU8Vy9mRRwXqrjJhtw4CFmfkZiZoW7VSTj5huEq" as Address;
const DEF = parseDefDoc(WORKED_DEF) as RiprapDef;
const NO_MKT_DEF = parseDefDoc(NO_MARKETING_DEF) as RiprapDef;
const FREE_FORM = parseDefDoc(FREE_FORM_DEF) as RiprapDef;
const LISTING = listingFromDef(DEF, ADDR);

describe("parseDefDoc", () => {
  it("parses the machine block and the § body", () => {
    expect(DEF.name).toBe("Chairmageddon");
    expect(DEF.kind).toBe("mutual");
    expect(DEF.tiers).toEqual([{ name: "Flat", fee: 10, cap: 40 }]);
    expect(DEF.proof).toHaveLength(2);
    expect(DEF.marketing?.event).toBe("Breakpoint");
    expect(DEF.body).toContain("## 3. Qualifying Event");
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

  it("reads pre-canonical wizard docs: bare tokens, smallest_payout, 10 §s", () => {
    const legacy = parseDefDoc(LEGACY_DEF) as RiprapDef;
    expect(legacy).not.toBeNull();
    expect(legacy.marketing?.smallestPayout).toBe(0);
    // the old §6/§7/§10 land on the § numbers the page and packs read
    expect(legacy.body).toContain("## 4. Exclusions");
    expect(legacy.body).toContain("## 7. Payout requests");
    expect(legacy.body).toContain("## 8. End");
    expect(legacy.body).toContain("## 11. Promise");
  });

  it("drops a non-http(s) marketing logo at resolution — the field, never the doc", () => {
    const swap = (logo: string) =>
      parseDefDoc(WORKED_DEF.replace(/ {2}logo: .*\n/, `  logo: ${logo}\n`));
    expect(swap('"javascript:alert(1)"')?.marketing?.logo).toBeUndefined();
    expect(swap('"data:image/svg+xml;base64,PHN2Zy8+"')?.marketing?.logo).toBeUndefined();
    expect(swap('"//evil.example/logo.svg"')?.marketing?.logo).toBeUndefined();
    // the doc and the rest of the marketing block survive
    const sanitized = swap('"javascript:alert(1)"');
    expect(sanitized?.name).toBe("Chairmageddon");
    expect(sanitized?.marketing?.blurb).toContain("Every seat taken");
    // an honest http(s) logo passes through untouched
    expect(DEF.marketing?.logo).toBe("https://riprap.xyz/pools/chairmageddon/logo.svg");
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
    expect(listing.tagline).toContain("every seat");
    expect(listing.tagline).not.toContain("means:");
    expect(listing.smallestPayout).toBe(40); // the flat tier's cap
  });

  it("falls back to the body's first prose paragraph for a free-form def", () => {
    const listing = listingFromDef(FREE_FORM, ADDR);
    expect(listing.tagline).toBe("A free-form peril, stated plainly.");
    expect(listing.tagline).not.toContain("second sentence");
    expect(listing.smallestPayout).toBe(40);
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
    expect(config.exclusions.join("\n")).not.toContain("excluded:");
  });

  it("single-sources the proof list and the tier table off the machine block", () => {
    expect(config.proof).toEqual([
      "Event ticket in your own name",
      "Declaration of the facts, signed with your wallet",
    ]);
    expect(config.tiers).toEqual([{ name: "Flat", fee: 10, cap: 40 }]);
  });

  it("renders §10 as a receipt — numbers verbatim from the doc", () => {
    const example = config.example;
    if (example === undefined) throw new Error("the legacy §10 carries figures");
    expect(example.lines).toContainEqual({
      value: "1,000",
      caption: "members",
    });
    expect(example.lines).toContainEqual({
      value: "$10",
      caption: "Each contributes",
    });
    expect(example.total).toEqual({
      value: "$2,000",
      caption: "Remaining pool",
    });
    expect(example.note).toContain("applicable share");
  });

  it("uses the platform promise and end note, never the doc's §11/§8", () => {
    expect(config.promise).toContain("Join a temporary community pool.");
    expect(config.promise.join("\n")).not.toContain("Old promise line");
    expect(config.endNote).toContain("the remaining balance returns to eligible members");
    expect(config.endNote).not.toContain("Old winding-up words");
  });

  it("renders a free-form body whole as markdown, with title-based exclusions", () => {
    const free = poolPageConfigFromDef(FREE_FORM, listingFromDef(FREE_FORM, ADDR));
    expect(free.terms).toBe(true);
    expect(free.definition.trim()).toBe(FREE_FORM.body.trim());
    expect(free.definition).toContain("## Anything else");
    expect(free.definitionNotes).toEqual([]);
    expect(free.exclusions).toEqual(["Excluded one.", "Excluded two."]);
    expect(free.example).toBeUndefined();
    expect(free.promise).toContain("Join a temporary community pool.");
  });

  it("carries the §7 fee note", () => {
    expect(config.feeNote).toContain("adjudication fee");
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
    const known = POOLS[0];
    if (known === undefined) throw new Error("no pools in the directory");
    const id = known.pubkey ?? known.slug;
    expect(poolPageFor(id)).toBe(POOL_PAGES[id]);
    expect(poolPageFor(ADDR)).not.toBe(POOL_PAGES[id]);
  });
});

const testConfig = getDefaultConfig({
  appName: "riprap-test",
  network: "localnet",
});

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
  it("renders the marketing block's headline and the pool's own logo", () => {
    const { container } = renderPage(() => <GenericPoolHero listing={LISTING} def={DEF} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Every seat taken. You stood.",
    );
    const logo = container.querySelector('[data-slot="pool-logo"]');
    if (logo === null) throw new Error("logo not rendered");
    expect(logo.getAttribute("src")).toBe("https://riprap.xyz/pools/chairmageddon/logo.svg");
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

  it("renders no logo img when the def's logo failed the http(s) gate", () => {
    const hostile = parseDefDoc(
      WORKED_DEF.replace(/ {2}logo: .*\n/, '  logo: "javascript:alert(1)"\n'),
    ) as RiprapDef;
    const { container } = renderPage(() => (
      <GenericPoolHero listing={listingFromDef(hostile, ADDR)} def={hostile} />
    ));
    expect(container.querySelector('[data-slot="pool-logo"]')).toBeNull();
    expect(container.innerHTML).not.toContain("javascript:");
  });
});

describe("GenericPoolPage", () => {
  it("renders the honest terminal state for a non-address route id", () => {
    const { container } = renderPage(() => <GenericPoolPage id="not-an-address" />);
    expect(container.textContent).toContain("No pool at this address.");
  });
});
