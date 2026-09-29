// evidenceServer — the per-cluster daemon map (directive 2026-09-29): the
// functions are pure and env-free; every case below traces to that directive
// (devnet → api.devnet.useaccord.xyz, mainnet → api.useaccord.xyz, localnet
// shares devnet unless pinned, no-cluster boot frame → devnet).
import { describe, expect, it } from "vitest";
import { evidenceDaemonUrlForCluster, evidenceDaemonUrlsFromEnv } from "./evidenceServer";

describe("evidenceDaemonUrlsFromEnv — defaults + the localnet→devnet cross-fallback", () => {
  it("empty env: the two production hosts, localnet sharing devnet", () => {
    expect(evidenceDaemonUrlsFromEnv({})).toEqual({
      devnet: "https://api.devnet.useaccord.xyz",
      mainnet: "https://api.useaccord.xyz",
      localnet: "https://api.devnet.useaccord.xyz",
    });
  });

  it("each cluster is overridable independently", () => {
    expect(
      evidenceDaemonUrlsFromEnv({
        VITE_EVIDENCE_DAEMON_URL_DEVNET: "http://localhost:8080",
        VITE_EVIDENCE_DAEMON_URL_MAINNET: "https://evidence.example",
        VITE_EVIDENCE_DAEMON_URL_LOCALNET: "http://surfpool:8080",
      }),
    ).toEqual({
      devnet: "http://localhost:8080",
      mainnet: "https://evidence.example",
      localnet: "http://surfpool:8080",
    });
  });

  it("a devnet override redirects localnet too — unless localnet is pinned", () => {
    const overridden = evidenceDaemonUrlsFromEnv({
      VITE_EVIDENCE_DAEMON_URL_DEVNET: "http://localhost:8080",
    });
    expect(overridden.localnet).toBe("http://localhost:8080");

    const pinned = evidenceDaemonUrlsFromEnv({
      VITE_EVIDENCE_DAEMON_URL_DEVNET: "http://localhost:8080",
      VITE_EVIDENCE_DAEMON_URL_LOCALNET: "http://surfpool:8080",
    });
    expect(pinned.localnet).toBe("http://surfpool:8080");
  });
});

describe("evidenceDaemonUrlForCluster — the switch (default → devnet)", () => {
  const urls = evidenceDaemonUrlsFromEnv({
    VITE_EVIDENCE_DAEMON_URL_DEVNET: "http://devnet-host",
    VITE_EVIDENCE_DAEMON_URL_MAINNET: "http://mainnet-host",
    VITE_EVIDENCE_DAEMON_URL_LOCALNET: "http://localnet-host",
  });

  it("mainnet ids → the mainnet host", () => {
    expect(evidenceDaemonUrlForCluster("solana:mainnet", urls)).toBe("http://mainnet-host");
    expect(evidenceDaemonUrlForCluster("solana:mainnet-beta", urls)).toBe("http://mainnet-host");
  });

  it("localnet → its (cross-fallen-back) host", () => {
    expect(evidenceDaemonUrlForCluster("solana:localnet", urls)).toBe("http://localnet-host");
  });

  it("devnet, unknown ids, and the no-cluster boot frame → devnet", () => {
    expect(evidenceDaemonUrlForCluster("solana:devnet", urls)).toBe("http://devnet-host");
    expect(evidenceDaemonUrlForCluster("solana:testnet", urls)).toBe("http://devnet-host");
    expect(evidenceDaemonUrlForCluster(null, urls)).toBe("http://devnet-host");
    expect(evidenceDaemonUrlForCluster(undefined, urls)).toBe("http://devnet-host");
  });
});
