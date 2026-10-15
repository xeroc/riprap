// CreatePage — the #/create wizard's author+preview smoke lane (the full
// state matrix is the test bean's; here: the mount, the field bindings, the
// Continue gate, the preview anchors, and the draft resume). Copy verbatim
// from meta/marketing/03-website-copy/landing-page.md § /create.

import { fetchMaybeMutualBySeed } from "@riprap/hanse";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreatePage } from "./CreatePage";

vi.mock("@riprap/hanse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@riprap/hanse")>();
  return {
    ...actual,
    fetchMaybeMutualBySeed: vi.fn(async () => null),
  };
});
vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/connector")>();
  return {
    ...actual,
    useWallet: () => ({ isConnected: false, account: null }),
    useKitTransactionSigner: () => ({ signer: null }),
    useCluster: () => ({ clusters: [], cluster: null, setCluster: vi.fn() }),
    useWalletConnectors: () => [],
    useConnectWallet: () => ({ connect: vi.fn() }),
    useDisconnectWallet: () => ({ disconnect: vi.fn() }),
  };
});
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
  }),
}));

const seedMock = vi.mocked(fetchMaybeMutualBySeed);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreatePage />
    </QueryClientProvider>,
  );
}

/** Fill by input id — Field ids are stable and unique (labels repeat across
 * tiers and marketing fields). */
function fill(id: string, value: string) {
  const input = document.getElementById(id);
  if (input === null) throw new Error(`no input #${id}`);
  fireEvent.change(input, { target: { value } });
}

beforeEach(() => {
  seedMock.mockClear();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("#/create author → preview", () => {
  /** The Continue button's disabled flag (no jest-dom in the house style). */
  const continueDisabled = () =>
    (screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled;
  const inputValue = (id: string) => (document.getElementById(id) as HTMLInputElement).value;

  it("mounts on the author step with the copy-doc frame", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Create a pool" })).toBeTruthy();
    expect(screen.getByText("Author → Preview → Deploy → Publish → Verify")).toBeTruthy();
    expect(document.getElementById("def-name")).toBeTruthy();
    expect(document.getElementById("def-definition")).toBeTruthy();
    expect(continueDisabled()).toBe(true);
  });

  it("derives the slug from the name and gates Continue until the form passes", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    await waitFor(() => expect(inputValue("def-slug")).toBe("chairmageddon"));
    // still incomplete: definition, exclusions, tier numbers, window, proof label
    expect(continueDisabled()).toBe(true);

    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    fill("def-exclusions", "injuries you caused yourself");
    fill("tier-0-fee", "10");
    fill("tier-0-cap", "40");
    fill("period-start", "2027-03-01");
    fill("period-end", "2027-03-03");
    fill("period-claims", "2027-03-10");
    fill("proof-0-label", "your event ticket");
    await waitFor(() => expect(continueDisabled()).toBe(false));
  });

  it("preview shows the exact bytes and their anchors (mono), then Back returns", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    fill("def-exclusions", "injuries you caused yourself");
    fill("tier-0-fee", "10");
    fill("tier-0-cap", "40");
    fill("period-start", "2027-03-01");
    fill("period-end", "2027-03-03");
    fill("period-claims", "2027-03-10");
    fill("proof-0-label", "your event ticket");
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/One document is the pool's law/)).toBeTruthy();
    // the exact bytes, mono: the frontmatter head renders verbatim
    expect(screen.getAllByText(/schema: riprap-def\/v1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/^sha256 [0-9a-f]{64}$/)).toBeTruthy();
    expect(screen.getByText(/^domain ref [0-9a-f]{64}$/)).toBeTruthy();
    expect(screen.getByText(/^seed \d+$/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(inputValue("def-name")).toBe("Chairmageddon"));
  });

  it("the draft resumes across a reload (localStorage fields only)", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("riprap:create") ?? "{}").def.name).toBe(
        "Chairmageddon",
      ),
    );
    cleanup();
    renderPage();
    await waitFor(() => expect(inputValue("def-name")).toBe("Chairmageddon"));
    expect(inputValue("def-definition")).toBe(
      "Bodily injury from standing through the opening ceremony.",
    );
  });
});
