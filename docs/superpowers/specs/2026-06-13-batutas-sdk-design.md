# `batutas-sdk` npm Package — Design

**Date:** 2026-06-13
**Scope:** New standalone TypeScript package `packages/batutas-sdk/`. Frontend and smart contract are
**not** modified this round. Contract is live on Celo Mainnet — never changed; the package only copies
its public address and ABI.
**Status:** Approved, not yet implemented.

## Goal

Publish a small, pure TypeScript SDK to the npm registry so the project has a real, installable package
— and therefore an npm **Downloads** chart / badge (the original ask). The SDK exposes the BATUTAS
commit-reveal primitives so any consumer can build a move commitment and decode results without copying
code out of the frontend.

## Decisions

| Topic | Decision |
|---|---|
| Package name | `batutas-sdk` (unscoped). Confirm it is free on npm before publishing. |
| Contents | Pure SDK only: contract constants, move/outcome enums, `makeSecret`, `buildCommitHash`, ABI. No React, no DOM, no `localStorage`. |
| Source of truth | Logic copied from `frontend-batutas/app/lib/batutas.ts`, minus the round-storage helpers. |
| Runtime dep | `viem` as a **peer dependency** (the consumer already pins viem; avoids version clash). |
| Build | `tsup` → dual ESM + CJS + `.d.ts`. |
| Tests | `vitest`. |
| License | MIT. |
| Publishing | Prepared to a dry-run-clean state. The actual `npm publish` (login + registry push) is run by the user — it needs their npm credentials. |
| Frontend refactor | Out of scope now (YAGNI). The frontend keeps its own `batutas.ts`; it may consume the published package in a later, separate change. |

## Why a separate package (not publish the app)

An npm Downloads chart only exists for a published package. The Next.js app is not a library and should
not go on npm. The commit-reveal helpers, however, are small, pure, and genuinely reusable — a clean,
honest package to publish.

## Architecture

Standalone package directory; the repo has no workspace tooling, so the package installs and builds on
its own.

```
packages/batutas-sdk/
  src/
    index.ts        # public barrel — re-exports everything below
    contract.ts     # BATUTAS_ADDRESS, BATUTAS_CHAIN_ID, CELO_EXPLORER, PEG
    moves.ts        # Move / Outcome types + MOVE_NUM / NUM_TO_MOVE / NUM_TO_RESULT
    commit.ts       # makeSecret(), buildCommitHash()
    abi.ts          # batutasAbi (as const)
  test/
    commit.test.ts  # buildCommitHash vector + makeSecret
    moves.test.ts   # enum round-trips
  package.json
  tsup.config.ts
  tsconfig.json
  README.md
  LICENSE
  .npmignore
```

Each unit has one job:

- **contract.ts** — deployed-contract facts (address, chain id, explorer, peg). Reads optional
  `process.env.NEXT_PUBLIC_CONTRACT_ADDRESS` override? **No** — a published library should not depend on a
  Next.js env var. The address is a hard-coded constant; consumers who redeploy pass their own address to
  whatever they call. Keep it a plain exported constant.
- **moves.ts** — the Move/Outcome string unions and the numeric maps that mirror the contract enums
  (`Move`: Rock=0, Paper=1, Scissors=2 — `Result`: Lose=0, Draw=1, Win=2).
- **commit.ts** — `makeSecret()` (32 random bytes via Web Crypto `crypto.getRandomValues`, hex) and
  `buildCommitHash(moveNum, secret)` = `keccak256(encodePacked(["uint8","bytes32"], [moveNum, secret]))`
  via viem. This encoding must stay byte-identical to the contract.
- **abi.ts** — the `batutasAbi` array `as const`, copied verbatim from the frontend.
- **index.ts** — re-exports the full public surface.

## Public API

```ts
export const BATUTAS_ADDRESS: `0x${string}`;
export const BATUTAS_CHAIN_ID: number;   // 42220
export const CELO_EXPLORER: string;       // https://celoscan.io
export const PEG: number;                 // 1000

export type Move = "rock" | "paper" | "scissors";
export type Outcome = "lose" | "draw" | "win";
export const MOVE_NUM: Record<Move, number>;
export const NUM_TO_MOVE: Move[];
export const NUM_TO_RESULT: Outcome[];

export function makeSecret(): `0x${string}`;
export function buildCommitHash(moveNum: number, secret: `0x${string}`): `0x${string}`;

export const batutasAbi: readonly [...]; // viem-compatible, `as const`
```

## Data flow (consumer)

```
makeSecret() ───────────────▶ secret (kept client-side until reveal)
MOVE_NUM[move] + secret ────▶ buildCommitHash() ──▶ commitHash ──▶ contract.commitMove
contract Revealed event ────▶ NUM_TO_MOVE / NUM_TO_RESULT ──▶ human-readable result
```

## Web Crypto note

`makeSecret` uses the global `crypto.getRandomValues`, available in browsers and in Node 18+. No Node
`crypto` import, so the bundle stays isomorphic. Documented as requiring Node ≥ 18 in `engines`.

## Error handling

Pure functions; minimal failure surface. `buildCommitHash` lets viem throw on a malformed secret/move
(invalid hex, out-of-range uint8) rather than swallowing — callers get a clear error. No try/catch theater.

## Testing / verification

`vitest`, run before each PR merge that changes code:

- `buildCommitHash` matches a **fixed known vector**: a hard-coded `(moveNum, secret)` → expected hash,
  locking the contract-compatible `uint8+bytes32` encoding so a future refactor can't silently break it.
- `makeSecret` returns a `0x` + 64 hex-char string (32 bytes) and two calls differ.
- `MOVE_NUM` / `NUM_TO_MOVE` round-trip for all three moves; `NUM_TO_RESULT` maps 0/1/2 correctly.
- `tsup` build is clean and `dist/` contains ESM, CJS, and `.d.ts`.

## Publishing

1. Confirm the name is free: `npm view batutas-sdk` (expect 404).
2. `package.json`: `name`, `version` 0.1.0, `description`, `type:"module"`, `main` (CJS), `module` (ESM),
   `types`, `exports` map, `files:["dist"]`, `peerDependencies.viem`, `engines.node>=18`, `license:"MIT"`,
   `repository`, `keywords` (celo, rps, commit-reveal, web3).
3. `npm publish --dry-run` → inspect the tarball file list (only `dist`, `README`, `LICENSE`, `package.json`).
4. **User** runs `npm login` then `npm publish`. (Cannot be automated here — needs npm credentials.)
5. After publish, npm tracks downloads automatically; the README badge
   `https://img.shields.io/npm/dm/batutas-sdk` renders the Downloads metric, and
   `npmjs.com/package/batutas-sdk` shows the daily chart.

## Out of scope (YAGNI)

- Refactoring the frontend to import this package.
- A viem read-client wrapper (getBalance/getPendingCommit).
- `localStorage` round persistence (app-specific, browser-coupled).
- CI auto-publish workflow (can add later once the package exists).
- Any smart-contract change.

## Delivery — 15 commits across 5 PRs (merge each before the next)

| PR | Branch | Commits |
|---|---|---|
| 1 — scaffold | `feat/sdk-1-scaffold` | 1 package.json + dir skeleton · 2 tsconfig · 3 tsup config + this spec |
| 2 — port core | `feat/sdk-2-core` | 4 contract constants · 5 moves/enums · 6 commit helpers · 7 abi · 8 index barrel |
| 3 — tests | `feat/sdk-3-tests` | 9 vitest setup · 10 commit-hash known-vector test · 11 secret + enum tests |
| 4 — build + meta | `feat/sdk-4-build` | 12 build dist + verify output · 13 README + downloads badge · 14 LICENSE + package metadata |
| 5 — publish prep | `feat/sdk-5-publish` | 15 .npmignore + dry-run notes + PROGRESS update |

Each PR: branch off latest `main`, push, open PR, merge with `--delete-branch`, sync `main`, repeat.
The actual registry publish is a manual user step after PR 5.
