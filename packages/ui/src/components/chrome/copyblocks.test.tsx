import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMessage } from "./ChatMessage";
import { CopyBlock } from "./CopyBlock";
import { EmailCard } from "./EmailCard";

const writeText = vi.fn(() => Promise.resolve());

afterEach(() => {
  cleanup();
  writeText.mockClear();
});

// CopyBlock copies through navigator.clipboard — stubbed, AddressChip-style
beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

describe("CopyBlock — labeled copyable block", () => {
  it("renders the label, hint and content; copy button names what it copies", () => {
    render(
      <CopyBlock
        label="blurb — one line"
        value="Peer-to-peer cover on Solana."
        hint="paste into a chat"
      >
        <p>Peer-to-peer cover on Solana.</p>
      </CopyBlock>,
    );
    expect(screen.getByText("blurb — one line")).toBeTruthy();
    expect(screen.getByText("paste into a chat")).toBeTruthy();
    expect(screen.getByText("Peer-to-peer cover on Solana.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "copy blurb — one line" })).toBeTruthy();
  });

  it("copies the exact value verbatim and settles to copied", async () => {
    render(
      <CopyBlock label="email" value={"line one\nline two"}>
        <EmailCard to="a@b.c" subject="s">
          body
        </EmailCard>
      </CopyBlock>,
    );
    fireEvent.click(screen.getByRole("button", { name: "copy email" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("line one\nline two"));
    expect(await screen.findByText("copied")).toBeTruthy();
  });
});

describe("ChatMessage — one chat message on the page's tones", () => {
  it("renders author, verbatim text and meta with the initials tile", () => {
    render(<ChatMessage author="Fabian Schuh" text={"line one\nline two"} meta="sent just now" />);
    expect(screen.getByText("Fabian Schuh")).toBeTruthy();
    const bubble = document.querySelector('[data-slot="chat-message"] p');
    expect(bubble?.textContent).toBe("line one\nline two");
    expect(screen.getByText("sent just now")).toBeTruthy();
    expect(screen.queryByAltText("avatar of Fabian Schuh")).toBeNull();
    expect(screen.getByText("FS")).toBeTruthy(); // initials tile
    expect(
      document.querySelector('[data-slot="chat-message"]')?.getAttribute("data-mode"),
    ).toBeNull(); // no paper inversion
  });

  it("renders the avatar image when given", () => {
    render(<ChatMessage author="Fabian Schuh" text="hi" avatar="/fabian.webp" />);
    expect(screen.getByAltText("avatar of Fabian Schuh")).toBeTruthy();
  });
});

describe("EmailCard — compose frame on the page's tones", () => {
  it("renders to/subject fields and the body verbatim", () => {
    render(
      <EmailCard to="[investor name]" subject="Intro: Riprap">
        {"first line\n\nsecond line"}
      </EmailCard>,
    );
    expect(screen.getByText("[investor name]")).toBeTruthy();
    const body = document.querySelector('[data-slot="email-card-body"]');
    expect(body?.textContent).toBe("first line\n\nsecond line");
    expect(
      document.querySelector('[data-slot="email-card"]')?.getAttribute("data-mode"),
    ).toBeNull();
  });
});
