// React-19 compatibility gate for ConnectorKit: upstream declares >=18.0.0
// peer-legal but tests on 18 — this render test is the milestone-mandated
// proof that the AppProvider stack mounts under React 19 before any UI is
// built on top of it.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SolanaProviders } from "./providers";
import { useClusterRpc, useHanseEnv } from "./rpc";

// A local `.env` override (documented VITE_DEVNET_RPC) must not flip this
// suite's "default endpoint" assertion. providers.tsx captures the value at
// module init, and ES imports hoist above a plain stubEnv — hoist the stub.
vi.hoisted(() => vi.stubEnv("VITE_DEVNET_RPC", undefined));

function Probe() {
  const clusterRpc = useClusterRpc();
  const hanseEnv = useHanseEnv();
  return (
    <div>
      <span data-testid="endpoint">{clusterRpc?.endpoint ?? "none"}</span>
      <span data-testid="env">{hanseEnv ? "signer" : "null"}</span>
    </div>
  );
}

function renderProbe() {
  return render(
    <SolanaProviders>
      <Probe />
    </SolanaProviders>,
  );
}

afterEach(cleanup);

describe("SolanaProviders (ConnectorKit AppProvider under React 19)", () => {
  it("mounts and binds read-only RPC to the default devnet cluster", () => {
    renderProbe();
    // a local .env may point devnet at a private RPC pool — the invariant is
    // the default CLUSTER (devnet), not the public fallback URL
    expect(screen.getByTestId("endpoint").textContent).toContain("devnet");
  });

  it("useHanseEnv stays null until a wallet connects", () => {
    renderProbe();
    expect(screen.getByTestId("env").textContent).toBe("null");
  });
});
