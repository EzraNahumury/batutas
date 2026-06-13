# batutas-sdk

[![npm version](https://img.shields.io/npm/v/batutas-sdk.svg)](https://www.npmjs.com/package/batutas-sdk)
[![npm downloads](https://img.shields.io/npm/dm/batutas-sdk.svg)](https://www.npmjs.com/package/batutas-sdk)

Commit-reveal SDK for **BATUTAS** — provably-fair on-chain Rock-Paper-Scissors on Celo Mainnet.

Pure helpers and constants: no React, no DOM storage. `viem` is a peer dependency.

## Install

```bash
npm install batutas-sdk viem
```

## Usage

```ts
import {
  makeSecret,
  buildCommitHash,
  MOVE_NUM,
  NUM_TO_MOVE,
  NUM_TO_RESULT,
  BATUTAS_ADDRESS,
  BATUTAS_CHAIN_ID,
  batutasAbi,
} from "batutas-sdk";

// 1. Make a move commitment
const secret = makeSecret();                       // keep client-side until reveal
const commitHash = buildCommitHash(MOVE_NUM.rock, secret);
// ...call commitMove(commitHash) on BATUTAS_ADDRESS via wagmi/viem...

// 2. Reveal later with (MOVE_NUM.rock, secret)

// 3. Decode a Revealed event
const houseMove = NUM_TO_MOVE[houseMoveNum];        // "rock" | "paper" | "scissors"
const outcome = NUM_TO_RESULT[resultNum];           // "lose" | "draw" | "win"
```

## API

| Export | Description |
|---|---|
| `makeSecret()` | 32 random bytes (Web Crypto) as `0x`-hex; the reveal secret. |
| `buildCommitHash(moveNum, secret)` | `keccak256(encodePacked(uint8, bytes32))` — matches the contract. |
| `MOVE_NUM` / `NUM_TO_MOVE` | Move ↔ number (Rock=0, Paper=1, Scissors=2). |
| `NUM_TO_RESULT` | Result number → `"lose" \| "draw" \| "win"` (0/1/2). |
| `BATUTAS_ADDRESS` | Deployed contract on Celo Mainnet. |
| `BATUTAS_CHAIN_ID` | `42220`. |
| `CELO_EXPLORER` / `PEG` | `https://celoscan.io` / `1000`. |
| `batutasAbi` | viem-compatible ABI (`as const`). |

## License

MIT
