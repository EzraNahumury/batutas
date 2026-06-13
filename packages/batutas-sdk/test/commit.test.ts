import { describe, it, expect } from "vitest";
import { makeSecret, buildCommitHash } from "../src/commit";

describe("buildCommitHash", () => {
  // Golden vectors lock the contract-compatible uint8+bytes32 encoding.
  // A refactor that changes encoding will break these on purpose.
  it("matches the known vector for move 0 and an all-zero secret", () => {
    const secret = ("0x" + "00".repeat(32)) as `0x${string}`;
    expect(buildCommitHash(0, secret)).toBe(
      "0xf39a869f62e75cf5f0bf914688a6b289caf2049435d8e68c5c5e6d05e44913f3",
    );
  });

  it("matches the known vector for move 2 and a 0x11.. secret", () => {
    const secret = ("0x" + "11".repeat(32)) as `0x${string}`;
    expect(buildCommitHash(2, secret)).toBe(
      "0x0cf9701981ef133c6225b80acce7b2e8169b872e732e265b374e37bb354ba7b8",
    );
  });

  it("is deterministic for the same inputs", () => {
    const secret = makeSecret();
    expect(buildCommitHash(1, secret)).toBe(buildCommitHash(1, secret));
  });
});
