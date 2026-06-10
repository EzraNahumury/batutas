# BATUTAS — Frontend Integration SDK

Everything the frontend needs to talk to the live BATUTAS contract. **Self-contained
and framework-agnostic at the core** — copy this folder into your frontend app.

> This folder does not modify the contracts or the frontend; it's a drop-in helper.

## Contents

| File                     | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `batutasAbi.json`        | Contract ABI (54 entries) — import directly, no compile needed            |
| `index.ts`               | Address, chain id, peg constants, enums, and commit-reveal helpers (viem) |
| `useBatutas.example.tsx` | Reference wagmi hook for the full flow                                    |

## Setup

```bash
# in the frontend
npm i viem wagmi @tanstack/react-query
# then copy this `integration/` folder in (e.g. src/lib/batutas/)
```

## Deployment

|          |                                              |
| -------- | -------------------------------------------- |
| Contract | `0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf` |
| Network  | Celo Mainnet (chainId `42220`)               |
| Peg      | 1 CELO = 1000 batutas                        |

## The commit-reveal flow

```ts
import { Move, buildCommit } from "./integration";

// 1) Deposit CELO -> batutas
//    writeContract(deposit, { value: parseEther("0.05") })

// 2) Commit a move — KEEP the secret client-side until reveal
const { commitHash, secret } = buildCommit(Move.Rock);
//    writeContract(commitMove, [commitHash])

// 3) Wait for the commit tx to confirm (reveal must be in a later block)

// 4) Reveal — contract derives the house move and settles
//    writeContract(revealMove, [Move.Rock, secret])

// 5) Withdraw batutas back to CELO
//    writeContract(withdraw, [balance])
```

`buildCommit` reproduces the exact contract preimage:
`keccak256(abi.encodePacked(uint8 move, bytes32 secret))`.

## Enums

```
Move:   Rock = 0, Paper = 1, Scissors = 2
Result: Lose = 0, Draw = 1, Win = 2
```

## MiniPay note

Use **viem/wagmi** (not ethers.js) and the injected connector so the dApp
auto-connects inside MiniPay. Implementing the MiniPay hook is a Proof of Ship
**Booster**.

See the contract docs in [../DEPLOYMENT.md](../DEPLOYMENT.md).
