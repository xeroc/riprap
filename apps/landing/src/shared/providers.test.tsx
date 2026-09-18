// React-19 compatibility gate for ConnectorKit: upstream declares >=18.0.0
// peer-legal but tests on 18 — this render test is the milestone-mandated
// proof that the AppProvider stack mounts under React 19 before any UI is
// built on top of it.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SolanaProviders } from "./providers";
import { useClusterRpc, useHanseEnv } from "./rpc";

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
    expect(screen.getByTestId("endpoint").textContent).toContain("api.devnet.solana.com");
  });

  it("useHanseEnv stays null until a wallet connects", () => {
    renderProbe();
    expect(screen.getByTestId("env").textContent).toBe("null");
  });
});
