import { describe, expect, it } from "vitest";

import { accountRoleLabel, groupBigInt, isoFromUnixSeconds, truncateAddress } from "./format";

describe("format", () => {
  it("truncates long addresses and leaves short ones whole", () => {
    expect(truncateAddress("cordhVoshqRV6kzGBmM89A66wuusJGsDCvLMHPLyKed")).toBe("cordh…yKed");
    expect(truncateAddress("abc")).toBe("abc");
  });

  it("groups bigints with underscores", () => {
    expect(groupBigInt(1000000n)).toBe("1_000_000");
    expect(groupBigInt(0)).toBe("0");
    expect(groupBigInt(-1234567n)).toBe("-1_234_567");
  });

  it("renders unix-seconds as ISO, null-safe", () => {
    expect(isoFromUnixSeconds(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(isoFromUnixSeconds(null)).toBeNull();
  });

  it("labels Kit account roles", () => {
    // READONLY=0, WRITABLE=1, READONLY_SIGNER=2, WRITABLE_SIGNER=3
    expect(accountRoleLabel(0)).toBe("readonly");
    expect(accountRoleLabel(1)).toBe("writable");
    expect(accountRoleLabel(2)).toBe("readonly signer");
    expect(accountRoleLabel(3)).toBe("writable signer");
  });
});
