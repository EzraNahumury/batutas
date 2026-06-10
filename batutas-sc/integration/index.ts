// BATUTAS frontend integration SDK.
//
// Drop this folder into your frontend (viem/wagmi). It contains the contract
// ABI, address, and the helpers needed for the commit-reveal flow.
//
// Install peer dep in the frontend: `npm i viem`

import { keccak256, encodePacked, type Hex } from "viem";
import batutasAbi from "./batutasAbi.json";

// -----------------------------------------------------------------------------
// Deployment (Celo Mainnet)
// -----------------------------------------------------------------------------

export const BATUTAS_ABI = batutasAbi;
export const BATUTAS_ADDRESS = "0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf" as const;
export const CELO_CHAIN_ID = 42220;

// Economy / peg.
export const BATUTAS_PER_CELO = 1000n;
export const WEI_PER_BATUTA = 10n ** 15n; // 1e18 / 1000

// -----------------------------------------------------------------------------
// Enums (mirror the Solidity ordering exactly)
// -----------------------------------------------------------------------------

export enum Move {
  Rock = 0,
  Paper = 1,
  Scissors = 2,
}

export enum Result {
  Lose = 0,
  Draw = 1,
  Win = 2,
}

export const MOVE_LABEL: Record<Move, string> = {
  [Move.Rock]: "Rock",
  [Move.Paper]: "Paper",
  [Move.Scissors]: "Scissors",
};

export const RESULT_LABEL: Record<Result, string> = {
  [Result.Lose]: "Lose",
  [Result.Draw]: "Draw",
  [Result.Win]: "Win",
};

// -----------------------------------------------------------------------------
// Commit-reveal helpers
// -----------------------------------------------------------------------------

/** Generate a fresh 32-byte secret. Store it client-side until reveal. */
export function randomSecret(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}` as Hex;
}

/**
 * Build the commit hash exactly as the contract expects:
 *   keccak256(abi.encodePacked(uint8 move, bytes32 secret))
 *
 * @returns the commit hash, plus the move and secret to keep for revealing.
 */
export function buildCommit(move: Move, secret: Hex = randomSecret()) {
  const commitHash = keccak256(encodePacked(["uint8", "bytes32"], [move, secret]));
  return { commitHash, secret, move };
}

// -----------------------------------------------------------------------------
// Conversion helpers
// -----------------------------------------------------------------------------

/** CELO (wei) -> batutas (floored, matching the contract). */
export function celoToBatutas(weiAmount: bigint): bigint {
  return weiAmount / WEI_PER_BATUTA;
}

/** batutas -> CELO (wei). */
export function batutasToCelo(batutas: bigint): bigint {
  return batutas * WEI_PER_BATUTA;
}
