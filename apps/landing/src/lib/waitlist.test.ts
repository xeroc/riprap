/**
 * waitlist.test.ts — checks the submitWaitlist seam: the status strings, the
 * n8n POST contract, and the form-reset flag. Ported from the Accord landing.
 */
import { assert, describe, expect, it } from "vitest";

import { submitWaitlist } from "./waitlist";

describe("submitWaitlist", () => {
  it("empty endpoint degrades to the X message", async () => {
    const res = await submitWaitlist("", "you@riprap.xyz", fetch);
    assert.equal(res.ok, false);
    assert.equal(res.message, "Waitlist not wired yet. Ping us on X.");
    assert.equal(res.reset, false);
  });

  it("non-2xx response reports failure", async () => {
    const fetchImpl = (async () => new Response("boom", { status: 500 })) as typeof fetch;
    const res = await submitWaitlist(
      "https://n8n.example.com/webhook",
      "you@riprap.xyz",
      fetchImpl,
    );
    assert.equal(res.ok, false);
    assert.equal(res.message, "Couldn't reach the list. Try again, or ping us on X.");
    assert.equal(res.reset, false);
  });

  it("network error reports failure", async () => {
    const fetchImpl = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    const res = await submitWaitlist(
      "https://n8n.example.com/webhook",
      "you@riprap.xyz",
      fetchImpl,
    );
    assert.equal(res.ok, false);
    assert.equal(res.message, "Couldn't reach the list. Try again, or ping us on X.");
    assert.equal(res.reset, false);
  });

  it("ok response reports success, requests reset, posts the n8n contract", async () => {
    let seenUrl = "";
    let seenInit: RequestInit | undefined;
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seenUrl = String(input);
      seenInit = init;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const res = await submitWaitlist(
      "https://n8n.example.com/webhook",
      "you@riprap.xyz",
      fetchImpl,
    );
    assert.equal(res.ok, true);
    assert.equal(res.message, "On the list. One email when the first pool opens.");
    assert.equal(res.reset, true);
    assert.equal(seenUrl, "https://n8n.example.com/webhook");
    assert.equal(seenInit?.method, "POST");
    expect(seenInit?.headers).toMatchObject({ "Content-Type": "application/json" });
    const body = JSON.parse(String(seenInit?.body));
    assert.equal(body.email, "you@riprap.xyz");
    assert.equal(body.type, "waitlist");
    assert.equal(typeof body.timestamp, "string");
  });
});
