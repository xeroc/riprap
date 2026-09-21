import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type * as MotionReact from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoveredOverlay } from "./CoveredOverlay";

const { reducedMotion } = vi.hoisted(() => ({ reducedMotion: { current: false } }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof MotionReact>();
  return { ...actual, useReducedMotion: () => reducedMotion.current };
});

afterEach(cleanup);

// copy-free kit: every word and figure arrives as props (the landing copy
// doc § Covered overlay owns the real strings; these mirror its shape)
const PROPS = {
  stamp: "Covered — Standard",
  headline: "You're in the ring.",
  figures: [
    <span key="fee">
      <span data-num className="font-mono">
        $20
      </span>{" "}
      in
    </span>,
    <span key="cap">
      up to{" "}
      <span data-num className="font-mono">
        $2,000
      </span>{" "}
      out
    </span>,
    <span key="total">
      pool holds{" "}
      <span data-num className="font-mono">
        $4,020
      </span>
    </span>,
  ],
  juror: {
    label: "Juror",
    body: "Stake $10, get drawn to read the evidence, get paid when coherent.",
    action: "Become a juror",
    href: "#/app#jurors",
  },
};

describe("CoveredOverlay — the join moment, copy-free, settle-only", () => {
  it("renders the stamp, headline, and every figure verbatim from props", () => {
    render(<CoveredOverlay open onDismiss={() => {}} {...PROPS} />);
    expect(screen.getAllByText(PROPS.stamp).length).toBe(2);
    expect(screen.getByRole("heading", { name: PROPS.headline })).toBeTruthy();
    expect(screen.getByText(/\$20/)).toBeTruthy();
    expect(screen.getByText(/\$2,000/)).toBeTruthy();
    expect(screen.getByText(/\$4,020/)).toBeTruthy();
  });

  it("stamp is the badge stamp with data-num (numbers are the hero)", () => {
    render(<CoveredOverlay open onDismiss={() => {}} {...PROPS} />);
    const stamp = screen
      .getAllByText(PROPS.stamp)
      .map((el) => el.closest('[data-slot="badge-stamp"]'))
      .find((el): el is HTMLElement => el !== null);
    expect(stamp).toBeDefined();
    expect(stamp?.hasAttribute("data-num")).toBe(true);
  });

  it("juror field: label, body, and the outline action linking the anchor", () => {
    render(<CoveredOverlay open onDismiss={() => {}} {...PROPS} />);
    expect(screen.getByText("Juror")).toBeTruthy();
    expect(screen.getByText(PROPS.juror.body)).toBeTruthy();
    const link = screen.getByRole("link", { name: "Become a juror" });
    expect(link.getAttribute("href")).toBe("#/app#jurors");
  });

  it("Continue and Escape are dismiss paths (dialog semantics, one exit)", () => {
    const onDismiss = vi.fn();
    render(<CoveredOverlay open onDismiss={onDismiss} {...PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("dialog semantics: labelled by the headline, described by the stamp", () => {
    render(<CoveredOverlay open onDismiss={() => {}} {...PROPS} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("the scene: shield, diamond, shard spray, confetti, and the closing ring mount", async () => {
    render(<CoveredOverlay open onDismiss={() => {}} {...PROPS} />);
    const scene = document.querySelector('[data-slot="covered-scene"]');
    expect(scene?.getAttribute("aria-hidden")).toBe("true");
    expect(scene?.querySelector('[data-slot="covered-shield"]')).toBeTruthy();
    expect(scene?.querySelector('[data-slot="covered-threat"]')).toBeTruthy();
    expect(scene?.querySelectorAll('[data-slot="covered-shard"]').length).toBe(10);
    // confetti escapes the scene: a fullscreen layer, 24 bits across the viewport
    expect(document.querySelectorAll('[data-slot="covered-confetti"]').length).toBe(24);
    expect(document.querySelector('[data-slot="covered-confetti-layer"]')?.className).toContain(
      "inset-0",
    );
    // the ring mounts late (1.5s) — the scene's payoff after the deflect
    await waitFor(() => expect(scene?.querySelector('[data-slot="covered-ring"]')).toBeTruthy(), {
      timeout: 2500,
    });
  });

  it("fullscreen: the scrim blurs the page — no card, no border box", () => {
    const { container } = render(<CoveredOverlay open onDismiss={() => {}} {...PROPS} />);
    const scrim = container.ownerDocument.querySelector('[data-slot="covered-scrim"]');
    expect(scrim?.className).toContain("backdrop-blur");
    expect(scrim?.className).toContain("inset-0");
    // the content spreads fullscreen instead of a bordered card
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("inset-0");
    expect(dialog.className).not.toContain("border");
  });

  it("prefers-reduced-motion: the settled composite, no scene sprites", () => {
    reducedMotion.current = true;
    render(<CoveredOverlay open onDismiss={() => {}} {...PROPS} />);
    const scene = document.querySelector('[data-slot="covered-scene"]');
    expect(scene?.querySelector('[data-slot="covered-shield"]')).toBeNull();
    expect(document.querySelector('[data-slot="covered-confetti"]')).toBeNull();
    // copy is all present immediately — the final state, no arrival waits
    expect(screen.getAllByText(PROPS.stamp).length).toBe(2);
    expect(screen.getByRole("heading", { name: PROPS.headline })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    reducedMotion.current = false;
  });
});
