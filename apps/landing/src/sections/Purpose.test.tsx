// §1.3 — the purpose band renders the copy doc's three beats verbatim, the
// fixed-purpose sentence, and the CTA row (copy doc §1.3, 2026-10-20 pass).

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Purpose } from "./Purpose";

afterEach(cleanup);

describe("§1.3 purpose band (copy doc §1.3)", () => {
  it("renders the three beat headings in order, hairline-divided", () => {
    const { container } = render(<Purpose />);
    const beats = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(beats).toEqual([
      "Anyone sets it.",
      "It's fixed forever.",
      "Every payout is judged against it.",
    ]);
    // the §2 step anatomy: ruled rows, mono accent ordinals
    const rows = [...container.querySelectorAll('[data-slot="purpose-beat"]')];
    expect(rows.length).toBe(3);
    for (const row of rows) expect(row.className).toContain("border-hairline");
    const ordinals = rows.map((r) => r.querySelector("span[aria-hidden='true']")?.textContent);
    expect(ordinals).toEqual(["01", "02", "03"]);
  });

  it("states the fixed-purpose law (hash-pinned, a different purpose is a different pool)", () => {
    render(<Purpose />);
    expect(screen.getByText(/the terms are hashed and pinned on-chain/i)).toBeTruthy();
    expect(screen.getByText(/a different purpose is a different pool\./i)).toBeTruthy();
  });

  it("carries the CTA row: Create a pool → #/create, with the muted note", () => {
    render(<Purpose />);
    expect(screen.getByRole("link", { name: "Create a pool" }).getAttribute("href")).toBe(
      "#/create",
    );
    expect(
      screen.getByText("Whatever purpose you want — it's fixed from the moment the pool exists."),
    ).toBeTruthy();
  });
});
