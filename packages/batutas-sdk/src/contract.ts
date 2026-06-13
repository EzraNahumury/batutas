/**
 * Deployed BATUTAS game contract on Celo Mainnet (verified on Celoscan).
 * A library must not read framework env vars, so this is a plain constant;
 * consumers who deploy their own instance pass their address to their calls.
 */
export const BATUTAS_ADDRESS =
  "0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf" as const;

/** Celo Mainnet chain id. */
export const BATUTAS_CHAIN_ID = 42220 as const;

/** Block explorer base URL for Celo Mainnet. */
export const CELO_EXPLORER = "https://celoscan.io" as const;

/** Peg: 1 CELO = 1000 batutas. */
export const PEG = 1000 as const;
