import { keccak256, encodePacked, toHex } from "viem";

/**
 * 32 cryptographically-random bytes as a hex string, kept client-side until
 * reveal. Uses the global Web Crypto API (browsers and Node >= 18).
 */
export function makeSecret(): `0x${string}` {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return toHex(b);
}

/**
 * keccak256(abi.encodePacked(uint8 move, bytes32 secret)). Must stay
 * byte-identical to the contract's commit-hash derivation.
 */
export function buildCommitHash(
  moveNum: number,
  secret: `0x${string}`,
): `0x${string}` {
  return keccak256(encodePacked(["uint8", "bytes32"], [moveNum, secret]));
}
