// The blurb page (#/blurb, unlisted): every copyable block is labeled,
// copy buttons write the exact strings, the words render as a grid of two
// chats with the standard blurb full-width below, the team and kudos
// render from content.ts, the brand block carries the files, the colors
// (tokens.css values with css var + hex + copy), the type, and the story —
// and the pre-round law holds: no round numbers anywhere.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlurbPage } from "./BlurbPage";
import { BRAND_COLORS, EMAIL_FULL, KUDOS, ONE_LINE } from "./content";

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});
afterEach(() => {
  cleanup();
  writeText.mockClear();
});

describe("BlurbPage — the unlisted blurb & brand kit", () => {
  it("renders the header, status line, and a label for every copyable block", () => {
    render(<BlurbPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "About Riprap, ready to copy.",
    );
    expect(screen.getByText(/Everything on this page is meant to be copied/)).toBeTruthy();
    // each CopyBlock names what it copies
    for (const label of [
      "one line — for chats",
      "short blurb — 60 words",
      "standard blurb — 150 words",
      "forwardable email — your voice",
      "email",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("copy buttons write the exact strings (blurb + full email with subject)", async () => {
    render(<BlurbPage />);
    fireEvent.click(screen.getByRole("button", { name: "copy one line — for chats" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(ONE_LINE));

    fireEvent.click(screen.getByRole("button", { name: "copy forwardable email — your voice" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(EMAIL_FULL));
    expect(EMAIL_FULL).toMatch(/^Subject: Intro: riprap/); // subject rides along
  });

  it("the words: two chats side by side, the standard blurb full-width below (never a third grid cell)", () => {
    render(<BlurbPage />);
    const chats = [...document.querySelectorAll('[data-slot="chat-message"]')];
    expect(chats.length).toBe(2); // one line + short blurb
    expect(screen.getAllByAltText("avatar of Fabian Schuh").length).toBe(2);

    // both chat CopyBlocks share the 2-column grid; the standard CopyBlock
    // is outside it and comes after both in document order
    const grid = chats[0].closest('[class*="grid-cols-2"]');
    expect(grid).toBeTruthy();
    const standard = document.querySelector('[data-slot="copy-block"]')?.parentElement
      ? [...document.querySelectorAll('[data-slot="copy-block"]')].find((block) =>
          block.textContent?.includes("standard blurb — 150 words"),
        )
      : null;
    expect(standard).toBeTruthy();
    expect(standard?.closest('[class*="grid-cols-2"]')).toBeNull(); // not in the chat grid
    const shortBlurb = chats[1].closest('[data-slot="copy-block"]');
    expect(standard!.compareDocumentPosition(shortBlurb!)).toBe(Node.DOCUMENT_POSITION_PRECEDING); // standard sits below
    // full width: no max-width cap on the standard block itself
    expect(standard?.className).not.toMatch(/max-w-/);
  });

  it("team: both personas render with current rows, all kudos present", () => {
    render(<BlurbPage />);
    expect(screen.getByAltText("Dr.-Ing. Fabian Schuh")).toBeTruthy();
    expect(screen.getByAltText("Corinna — ai agent")).toBeTruthy();
    expect(screen.getByText("Dr.-Ing. Fabian Schuh · founder")).toBeTruthy();
    expect(screen.getByText("Corinna · ai agent")).toBeTruthy();
    expect(document.body.textContent).toContain("x.com/@xeroc · t.me/xeroc");
    expect(document.body.textContent).toContain("on shift 24/7"); // numerals split mono

    const kudos = [...document.querySelectorAll('[data-slot="kudos"] > li')];
    expect(kudos.length).toBe(KUDOS.length);
    expect(screen.getByText("Accord — on-chain arbitration · live")).toBeTruthy();
    expect(document.body.textContent).toContain("Superteam member");
    const grant = kudos.find((li) => li.textContent?.includes("Solana Foundation grant"));
    const nums = [...(grant?.querySelectorAll("[data-num]") ?? [])].map((s) => s.textContent);
    expect(nums).toContain("2026");
  });

  it("brand kit: four assets, svg + png download for all", () => {
    render(<BlurbPage />);
    const svgs = [
      ...document.querySelectorAll<HTMLAnchorElement>('[data-slot="brand-asset"] a[href$=".svg"]'),
    ];
    expect(svgs.length).toBe(4);
    for (const a of svgs) {
      expect(a.getAttribute("download")).not.toBeNull();
      expect(a.getAttribute("href")).toMatch(/^\/brand\//);
    }
    const pngs = [
      ...document.querySelectorAll<HTMLAnchorElement>('[data-slot="brand-asset"] a[href$=".png"]'),
    ];
    expect(pngs.length).toBe(4); // mark + wordmark + lockup + avatar
    expect(screen.getAllByRole("button", { name: "copy svg" }).length).toBe(4);
  });

  it("brand colors: the working palette as swatch rows — hex only, no internal vars, copy writes the hex", async () => {
    render(<BlurbPage />);
    const rows = [...document.querySelectorAll('[data-slot="brand-color"]')];
    const expected = BRAND_COLORS.reduce((n, group) => n + group.colors.length, 0);
    expect(rows.length).toBe(expected);
    expect(expected).toBeLessThanOrEqual(10); // most-used set, not the full token scale
    expect(document.body.textContent).not.toContain("--riprap-"); // vars are internal

    // the logo group: the three colors baked into the logo files
    const groups = [...document.querySelectorAll('[data-slot="brand-color-group"]')];
    const logo = groups.find((g) => g.querySelector("h4")?.textContent === "logo");
    const logoHexes = [...(logo?.querySelectorAll("span[data-num]") ?? [])].map(
      (el) => el.textContent,
    );
    expect(logoHexes).toEqual(["#F2EFE8", "#A7ADB3", "#3E7CA6"]); // wordmark, stones, accent

    // swatch carries the exact token fill; the copy button writes the hex
    const accent = rows.find((row) => row.textContent?.includes("harbor-blue"));
    const swatch = accent?.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(swatch?.style.backgroundColor).toBe("rgb(62, 124, 166)"); // #3E7CA6
    fireEvent.click(screen.getAllByRole("button", { name: "copy hex" })[0]);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^#[0-9A-F]{6}$/)),
    );
  });

  it("brand story and type: the breakwater origin, the ring anatomy, both faces with licenses", () => {
    render(<BlurbPage />);
    expect(document.body.textContent).toContain("armor on the face of a breakwater");
    expect(document.body.textContent).toContain("one slot deliberately empty");
    expect(screen.getByText("Space Grotesk")).toBeTruthy();
    expect(screen.getByText("JetBrains Mono")).toBeTruthy();
    expect(screen.getAllByText("SIL OFL").length).toBe(2);
  });

  it("contact: three parallel blocks — mailto inbox, both X feeds open x.com in a new tab", () => {
    render(<BlurbPage />);
    const mail = screen.getByRole("link", { name: /fabian@chainsquad\.com/ });
    expect(mail.getAttribute("href")).toBe("mailto:fabian@chainsquad.com");
    expect(screen.getByRole("button", { name: "copy email" })).toBeTruthy();
    const build = screen.getByRole("link", { name: /@riprapxyz/ });
    expect(build.getAttribute("href")).toBe("https://x.com/riprapxyz");
    expect(build.getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("button", { name: "copy x — the build log" })).toBeTruthy();
    const founder = screen.getByRole("link", { name: /@xeroc/ });
    expect(founder.getAttribute("href")).toBe("https://x.com/xer0c");
    expect(founder.getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("button", { name: "copy x — the founder" })).toBeTruthy();
  });

  it("pre-round law: no round numbers anywhere on the page", () => {
    render(<BlurbPage />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/\$700k/i);
    expect(text).not.toMatch(/\$7M/);
    expect(text).not.toMatch(/\$600/);
    expect(text).not.toMatch(/\$800k/i);
  });

  it("the email keeps deck and terms on request, never quoted", () => {
    render(<BlurbPage />);
    const card = document.querySelector('[data-slot="email-card-body"]');
    expect(card?.textContent).toContain("deck and terms on request");
  });
});
