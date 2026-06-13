// BATUTAS frontend integration SDK.
//
// Thin, framework-agnostic layer over the published `batutas-sdk` package: it
// re-exports the contract ABI, address, chain id and commit-reveal helpers, and
// adds the integration-specific niceties (numeric Move/Result enums, labels, and
// CELO<->batutas conversions) on top.
//
// Install peer deps in the frontend: `npm i batutas-sdk viem`

import type { Hex } from "viem";
import {
  batutasAbi,
  BATUTAS_ADDRESS as SDK_BATUTAS_ADDRESS,
  BATUTAS_CHAIN_ID,
  makeSecret,
  buildCommitHash,
} from "batutas-sdk";

// -----------------------------------------------------------------------------
// Deployment (Celo Mainnet) — sourced from batutas-sdk
// -----------------------------------------------------------------------------

export const BATUTAS_ABI = batutasAbi;
export const BATUTAS_ADDRESS = SDK_BATUTAS_ADDRESS;
export const CELO_CHAIN_ID = BATUTAS_CHAIN_ID;

// Economy / peg. (batutas-sdk exposes PEG as a number; these are the bigint
// forms the on-chain wei math needs.)
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
// Commit-reveal helpers (delegated to batutas-sdk)
// -----------------------------------------------------------------------------

/** Generate a fresh 32-byte secret. Store it client-side until reveal. */
export const randomSecret = makeSecret;

/**
 * Build the commit hash exactly as the contract expects:
 *   keccak256(abi.encodePacked(uint8 move, bytes32 secret))
 *
 * @returns the commit hash, plus the move and secret to keep for revealing.
 */
export function buildCommit(move: Move, secret: Hex = randomSecret()) {
  const commitHash = buildCommitHash(move, secret);
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
