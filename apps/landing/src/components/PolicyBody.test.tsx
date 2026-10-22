// PolicyBody.test.tsx — the free-form policy renderer: markdown + GFM,
// raw HTML skipped, URL schemes allowlisted, and numerals in mono.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PolicyBody, safePolicyUrl } from "./PolicyBody";

afterEach(cleanup);

describe("PolicyBody", () => {
  it("renders markdown with GFM tables, task lists, and strikethrough", () => {
    const { container } = render(
      <PolicyBody
        markdown={
          "## Terms\n\n| Tier | Fee |\n| --- | --- |\n| Flat | $10 |\n\n- [x] Read\n\n~~gone~~"
        }
      />,
    );
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Terms");
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("Flat")).toBeTruthy();
    expect(container.querySelector("del")?.textContent).toBe("gone");
    expect(container.querySelector('input[type="checkbox"]')).toBeTruthy();
  });

  it("skips raw HTML entirely", () => {
    const { container } = render(
      <PolicyBody
        markdown={
          '<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\nA <b>bold</b> claim.'
        }
      />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("claim.");
  });

  it("drops javascript:/data: links and hardens external links", () => {
    const { container } = render(
      <PolicyBody
        markdown={
          "[bad](javascript:alert(1)) [data](data:text/html,hi) [good](https://example.com)"
        }
      />,
    );
    const links = [...container.querySelectorAll("a")];
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute("href")).toBe("https://example.com");
    expect(links[0]?.getAttribute("rel")).toBe("nofollow noopener noreferrer");
    expect(links[0]?.getAttribute("target")).toBe("_blank");
  });

  it("wraps numerals in data-num mono spans", () => {
    const { container } = render(<PolicyBody markdown={"Claim $1,000 within 10 days."} />);
    const numerals = [...container.querySelectorAll("[data-num]")].map((node) => node.textContent);
    expect(numerals).toContain("1,000");
    expect(numerals).toContain("10");
  });
});

describe("safePolicyUrl", () => {
  it("allows http(s), mailto, anchors, and relative paths", () => {
    for (const url of [
      "https://example.com/terms",
      "http://example.com",
      "mailto:pool@example.com",
      "#coverage",
      "/terms",
      "images/logo.png",
    ]) {
      expect(safePolicyUrl(url)).toBe(url);
    }
  });

  it("rejects javascript:, data:, and malformed URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "https://exa mple.com",
    ]) {
      expect(safePolicyUrl(url)).toBe("");
    }
  });
});
