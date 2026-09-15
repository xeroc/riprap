import { describe, expect, it } from "vitest";

import { renderCreated, renderRead, renderSend } from "./output";

describe("output renderers", () => {
  it("renderSend: quiet=sig, json=object, human=✓ line", () => {
    const sig = "4xABCdef";
    expect(renderSend({ quiet: true }, sig)).toBe(sig);
    expect(JSON.parse(renderSend({ json: true }, sig, { state: "PDA" }))).toEqual({
      signature: sig,
      state: "PDA",
    });
    expect(renderSend({}, sig)).toBe(`✓ confirmed: ${sig}`);
  });

  it("renderCreated: quiet=address, json includes address", () => {
    const addr = "AaNWSA1SajQEAM9bps1kD8AoPupnGwDci7XKr5VaXVG9";
    expect(renderCreated({ quiet: true }, addr)).toBe(addr);
    expect(JSON.parse(renderCreated({ json: true }, addr, { bump: 255 }))).toEqual({
      address: addr,
      bump: 255,
    });
  });

  it("renderRead: quiet=primary, json=pretty, human=provided lines; bigint survives json", () => {
    const data = { owner: "x", lamports: 5n };
    expect(renderRead({ quiet: true }, data, { primary: "PDA" })).toBe("PDA");
    expect(renderRead({}, data, { human: ["a", "b"] })).toBe("a\nb");
    expect(JSON.parse(renderRead({ json: true }, { owner: "x" }))).toEqual({ owner: "x" });
    expect(renderRead({ json: true }, data)).toContain('"lamports": "5"');
  });
});
