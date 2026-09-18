import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JurorUpsellDialog } from "./JurorUpsellDialog";

afterEach(cleanup);

// copy-free kit: every string and the stake figure arrive as props
const PROPS = {
  minStake: "$10",
  title: "The pool needs jurors",
  body: "Members who stake can be drawn to review claims.",
};

describe("JurorUpsellDialog — OK-only, copy-free, minStake mono", () => {
  it("renders title and body verbatim from props", () => {
    render(<JurorUpsellDialog open onOk={() => {}} {...PROPS} />);
    expect(screen.getByText(PROPS.title)).toBeTruthy();
    expect(screen.getByText(PROPS.body)).toBeTruthy();
  });

  it("minStake: mono-number-lg with data-num on a strong hairline plate, radius 0", () => {
    render(<JurorUpsellDialog open onOk={() => {}} {...PROPS} />);
    const figure = screen.getByText("$10");
    expect(figure.className).toContain("[font:var(--riprap-mono-number-lg)]");
    expect(figure.hasAttribute("data-num")).toBe(true);
    const plate = figure.parentElement;
    expect(plate?.className).toContain("bg-strong");
    expect(plate?.className).toContain("border-hairline");
    expect(plate?.className).toContain("rounded-none");
  });

  it("OK-only: exactly one action button; clicking calls onOk", () => {
    const onOk = vi.fn();
    render(<JurorUpsellDialog open onOk={onOk} {...PROPS} />);
    const buttons = screen.getAllByRole("button").filter((b) => !b.textContent.match(/^\s*$/)); // ignore icon-only close
    expect(buttons.map((b) => b.textContent.trim())).toEqual(["OK"]);
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it("dismissal paths are onOk too: Escape acknowledges", () => {
    const onOk = vi.fn();
    render(<JurorUpsellDialog open onOk={onOk} {...PROPS} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it("closed renders nothing", () => {
    render(<JurorUpsellDialog open={false} onOk={() => {}} {...PROPS} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
