# batutas-sdk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a small, pure TypeScript SDK (`batutas-sdk`) exposing the BATUTAS commit-reveal primitives, so the project has a real, installable npm package and a Downloads badge/chart.

**Architecture:** New standalone package at `packages/batutas-sdk/`. Pure functions + constants ported from `frontend-batutas/app/lib/batutas.ts` (minus the browser `localStorage` round helpers). Built with `tsup` to dual ESM/CJS + types, tested with `vitest`, `viem` as a peer dependency. The smart contract and the frontend app are NOT modified.

**Tech Stack:** TypeScript 5, tsup 8, vitest 2/3, viem 2 (peer). Node ≥ 18.

**Repo facts (verified):** origin `https://github.com/EzraNahumury/batutas.git`; local node v22; no root workspace (package stands alone). Source logic lives in `frontend-batutas/app/lib/batutas.ts`.

**Golden keccak vectors (verified via viem, for the encoding-lock test):**
- `buildCommitHash(0, "0x" + "00"×32)` = `0xf39a869f62e75cf5f0bf914688a6b289caf2049435d8e68c5c5e6d05e44913f3`
- `buildCommitHash(2, "0x" + "11"×32)` = `0x0cf9701981ef133c6225b80acce7b2e8169b872e732e265b374e37bb354ba7b8`

**Contract constants (verified, copy verbatim):** `BATUTAS_ADDRESS = "0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf"`, chain id `42220`, explorer `https://celoscan.io`, peg `1000`.

**Working directory:** all `npm`/`npx`/`git add` paths below are relative to repo root `D:\celo\batutas` unless a step says `cd packages/batutas-sdk`. Use `rtk` prefix on git commands per project convention.

**Delivery:** 15 commits across 5 PRs. Branch each PR off latest `main`, push, open PR via `gh`, merge `--merge --delete-branch`, sync `main`, then next PR. Actual `npm publish` is a manual user step after PR 5.

---

## File Structure

```
packages/batutas-sdk/
  src/
    index.ts        # public barrel
    contract.ts     # BATUTAS_ADDRESS, BATUTAS_CHAIN_ID, CELO_EXPLORER, PEG
    moves.ts        # Move/Outcome types + MOVE_NUM/NUM_TO_MOVE/NUM_TO_RESULT
    commit.ts       # makeSecret(), buildCommitHash()
    abi.ts          # batutasAbi as const
  test/
    commit.test.ts
    moves.test.ts
  package.json
  tsconfig.json
  tsup.config.ts
  README.md
  LICENSE
  .npmignore
```

---

## PR 1 — scaffold (`feat/sdk-1-scaffold`)

### Task 1: package.json + directory skeleton

**Files:**
- Create: `packages/batutas-sdk/package.json`
- Create: `packages/batutas-sdk/src/index.ts` (temporary stub so the dir is non-empty)

- [ ] **Step 1: Create branch**

```bash
git checkout main && git pull
git checkout -b feat/sdk-1-scaffold
```

- [ ] **Step 2: Write `packages/batutas-sdk/package.json`**

```json
{
  "name": "batutas-sdk",
  "version": "0.1.0",
  "description": "Commit-reveal SDK for BATUTAS — provably-fair on-chain Rock-Paper-Scissors on Celo Mainnet.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["celo", "rock-paper-scissors", "commit-reveal", "web3", "viem", "batutas"],
  "license": "MIT",
  "engines": { "node": ">=18" },
  "repository": { "type": "git", "url": "git+https://github.com/EzraNahumury/batutas.git", "directory": "packages/batutas-sdk" },
  "peerDependencies": { "viem": "^2" },
  "devDependencies": {
    "tsup": "^8.3.0",
    "typescript": "^5.6.0",
    "viem": "^2.21.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Write temporary stub `packages/batutas-sdk/src/index.ts`**

```ts
export {};
```

- [ ] **Step 4: Commit**

```bash
rtk git add packages/batutas-sdk/package.json packages/batutas-sdk/src/index.ts
rtk git commit -m "chore(sdk): scaffold batutas-sdk package.json and skeleton"
```

### Task 2: tsconfig

**Files:**
- Create: `packages/batutas-sdk/tsconfig.json`

- [ ] **Step 1: Write `packages/batutas-sdk/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules", "test"]
}
```

(The `DOM` lib gives the ambient `crypto` / `Uint8Array` types `makeSecret` needs without pulling Node typings.)

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/tsconfig.json
rtk git commit -m "chore(sdk): add tsconfig"
```

### Task 3: tsup config

**Files:**
- Create: `packages/batutas-sdk/tsup.config.ts`

- [ ] **Step 1: Write `packages/batutas-sdk/tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // viem is a peer dependency — never bundle it into the SDK output.
  external: ["viem"],
});
```

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/tsup.config.ts
rtk git commit -m "chore(sdk): add tsup build config"
```

- [ ] **Step 3: Open PR 1 and merge**

```bash
rtk git push -u origin feat/sdk-1-scaffold
gh pr create --base main --title "feat(sdk): scaffold batutas-sdk package" --body "Scaffolds packages/batutas-sdk: package.json, tsconfig, tsup config. No runtime code yet."
gh pr merge --merge --delete-branch
git checkout main && git pull
```

---

## PR 2 — port core (`feat/sdk-2-core`)

Branch:

```bash
git checkout -b feat/sdk-2-core
```

### Task 4: contract constants

**Files:**
- Create: `packages/batutas-sdk/src/contract.ts`

- [ ] **Step 1: Write `packages/batutas-sdk/src/contract.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/src/contract.ts
rtk git commit -m "feat(sdk): add contract constants (address, chain, explorer, peg)"
```

### Task 5: moves / enums

**Files:**
- Create: `packages/batutas-sdk/src/moves.ts`

- [ ] **Step 1: Write `packages/batutas-sdk/src/moves.ts`**

```ts
/**
 * Move and outcome mappings that mirror the contract enums.
 * Move: Rock=0, Paper=1, Scissors=2.  Result: Lose=0, Draw=1, Win=2.
 */
export type Move = "rock" | "paper" | "scissors";
export type Outcome = "lose" | "draw" | "win";

export const MOVE_NUM: Record<Move, number> = { rock: 0, paper: 1, scissors: 2 };
export const NUM_TO_MOVE: Move[] = ["rock", "paper", "scissors"];
export const NUM_TO_RESULT: Outcome[] = ["lose", "draw", "win"];
```

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/src/moves.ts
rtk git commit -m "feat(sdk): add move/outcome enums and numeric maps"
```

### Task 6: commit helpers

**Files:**
- Create: `packages/batutas-sdk/src/commit.ts`

- [ ] **Step 1: Write `packages/batutas-sdk/src/commit.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/src/commit.ts
rtk git commit -m "feat(sdk): add makeSecret and buildCommitHash helpers"
```

### Task 7: ABI

**Files:**
- Create: `packages/batutas-sdk/src/abi.ts`

- [ ] **Step 1: Write `packages/batutas-sdk/src/abi.ts`**

Copy the `batutasAbi` array **verbatim** from `frontend-batutas/app/lib/batutas.ts` lines 55–149 (the `export const batutasAbi = [ ... ] as const;` block). It must remain byte-identical so decoded events match. The file is exactly:

```ts
/** Minimal ABI — only what the SDK consumer calls / decodes. Mirrors the
    deployed BATUTAS contract; copied verbatim from the frontend. */
export const batutasAbi = [
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "batutas", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "commitMove",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitHash", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "revealMove",
    stateMutability: "nonpayable",
    inputs: [
      { name: "move", type: "uint8" },
      { name: "secret", type: "bytes32" },
    ],
    outputs: [{ type: "uint8" }],
  },
  { type: "function", name: "claimRefund", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingCommit",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "commitHash", type: "bytes32" },
      { name: "commitBlock", type: "uint256" },
    ],
  },
  { type: "function", name: "stake", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "winPayout", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "availableReserve", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "celoIn", type: "uint256", indexed: false },
      { name: "batutasOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Committed",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "commitHash", type: "bytes32", indexed: false },
      { name: "commitBlock", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Revealed",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "playerMove", type: "uint8", indexed: false },
      { name: "houseMove", type: "uint8", indexed: false },
      { name: "result", type: "uint8", indexed: false },
      { name: "stake", type: "uint256", indexed: false },
      { name: "payout", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "batutasIn", type: "uint256", indexed: false },
      { name: "celoOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Refunded",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "stake", type: "uint256", indexed: false },
    ],
  },
] as const;
```

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/src/abi.ts
rtk git commit -m "feat(sdk): add contract ABI (verbatim from frontend)"
```

### Task 8: index barrel (replace stub)

**Files:**
- Modify: `packages/batutas-sdk/src/index.ts`

- [ ] **Step 1: Replace `packages/batutas-sdk/src/index.ts` contents**

```ts
export { BATUTAS_ADDRESS, BATUTAS_CHAIN_ID, CELO_EXPLORER, PEG } from "./contract";
export type { Move, Outcome } from "./moves";
export { MOVE_NUM, NUM_TO_MOVE, NUM_TO_RESULT } from "./moves";
export { makeSecret, buildCommitHash } from "./commit";
export { batutasAbi } from "./abi";
```

- [ ] **Step 2: Type-check the barrel**

Run: `cd packages/batutas-sdk && npm install && npx tsc --noEmit`
Expected: exit 0, no type errors. (`npm install` pulls tsup/typescript/vitest/viem devDeps.)

- [ ] **Step 3: Commit**

```bash
rtk git add packages/batutas-sdk/src/index.ts packages/batutas-sdk/package-lock.json
rtk git commit -m "feat(sdk): export public API from index barrel"
```

- [ ] **Step 4: Open PR 2 and merge**

```bash
rtk git push -u origin feat/sdk-2-core
gh pr create --base main --title "feat(sdk): port pure commit-reveal core" --body "Ports contract constants, move/outcome enums, makeSecret/buildCommitHash, and the contract ABI into batutas-sdk. Pure, no React/DOM-storage. tsc --noEmit clean."
gh pr merge --merge --delete-branch
git checkout main && git pull
```

---

## PR 3 — tests (`feat/sdk-3-tests`)

Branch:

```bash
git checkout -b feat/sdk-3-tests
```

### Task 9: vitest config

**Files:**
- Create: `packages/batutas-sdk/vitest.config.ts`

- [ ] **Step 1: Write `packages/batutas-sdk/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/vitest.config.ts
rtk git commit -m "test(sdk): add vitest config"
```

### Task 10: commit-hash known-vector test (TDD lock)

**Files:**
- Create: `packages/batutas-sdk/test/commit.test.ts`

- [ ] **Step 1: Write `packages/batutas-sdk/test/commit.test.ts`**

```ts
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
```

- [ ] **Step 2: Run the test**

Run: `cd packages/batutas-sdk && npx vitest run test/commit.test.ts`
Expected: PASS (3 passed). The two golden vectors were precomputed with viem and verified.

- [ ] **Step 3: Commit**

```bash
rtk git add packages/batutas-sdk/test/commit.test.ts
rtk git commit -m "test(sdk): lock commit-hash encoding with known vectors"
```

### Task 11: makeSecret + enum tests

**Files:**
- Create: `packages/batutas-sdk/test/moves.test.ts`
- Modify: `packages/batutas-sdk/test/commit.test.ts` (add makeSecret block)

- [ ] **Step 1: Append a `makeSecret` describe block to `packages/batutas-sdk/test/commit.test.ts`**

```ts
describe("makeSecret", () => {
  it("returns 32 bytes as a 0x-prefixed 64-hex-char string", () => {
    const s = makeSecret();
    expect(s).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("produces different values across calls", () => {
    expect(makeSecret()).not.toBe(makeSecret());
  });
});
```

- [ ] **Step 2: Write `packages/batutas-sdk/test/moves.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { MOVE_NUM, NUM_TO_MOVE, NUM_TO_RESULT } from "../src/moves";

describe("move maps", () => {
  it("round-trips every move through MOVE_NUM and NUM_TO_MOVE", () => {
    for (const move of ["rock", "paper", "scissors"] as const) {
      expect(NUM_TO_MOVE[MOVE_NUM[move]]).toBe(move);
    }
  });

  it("maps contract move numbers in order", () => {
    expect(NUM_TO_MOVE).toEqual(["rock", "paper", "scissors"]);
  });

  it("maps result numbers lose/draw/win in order", () => {
    expect(NUM_TO_RESULT).toEqual(["lose", "draw", "win"]);
  });
});
```

- [ ] **Step 3: Run the full suite**

Run: `cd packages/batutas-sdk && npm test`
Expected: PASS — all files, all tests green (commit.test.ts 5, moves.test.ts 3).

- [ ] **Step 4: Commit**

```bash
rtk git add packages/batutas-sdk/test/commit.test.ts packages/batutas-sdk/test/moves.test.ts
rtk git commit -m "test(sdk): cover makeSecret format and enum round-trips"
```

- [ ] **Step 5: Open PR 3 and merge**

```bash
rtk git push -u origin feat/sdk-3-tests
gh pr create --base main --title "test(sdk): add vitest suite" --body "Adds vitest config and tests: commit-hash known-vector lock, makeSecret format/uniqueness, enum round-trips. All green."
gh pr merge --merge --delete-branch
git checkout main && git pull
```

---

## PR 4 — build + metadata (`feat/sdk-4-build`)

Branch:

```bash
git checkout -b feat/sdk-4-build
```

### Task 12: build dist and verify output

**Files:**
- (no source change — produces `dist/`, which is gitignored / not committed)

- [ ] **Step 1: Build**

Run: `cd packages/batutas-sdk && npm run build`
Expected: exit 0. tsup reports ESM `dist/index.js`, CJS `dist/index.cjs`, and `dist/index.d.ts`.

- [ ] **Step 2: Verify the three outputs exist**

Run: `cd packages/batutas-sdk && node -e "for (const f of ['dist/index.js','dist/index.cjs','dist/index.d.ts']) { require('fs').accessSync(f); console.log('ok', f); }"`
Expected: prints `ok dist/index.js`, `ok dist/index.cjs`, `ok dist/index.d.ts`.

- [ ] **Step 3: Smoke-test the built CJS export**

Run: `cd packages/batutas-sdk && node -e "const s=require('./dist/index.cjs'); console.log(s.BATUTAS_CHAIN_ID, typeof s.buildCommitHash);"`
Expected: `42220 function`.

- [ ] **Step 4: Add `packages/batutas-sdk/.gitignore`**

```
node_modules
dist
```

- [ ] **Step 5: Commit**

```bash
rtk git add packages/batutas-sdk/.gitignore
rtk git commit -m "chore(sdk): ignore node_modules and dist; verify build output"
```

### Task 13: README + downloads badge

**Files:**
- Create: `packages/batutas-sdk/README.md`

- [ ] **Step 1: Write `packages/batutas-sdk/README.md`**

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/README.md
rtk git commit -m "docs(sdk): add README with usage and npm downloads badge"
```

### Task 14: LICENSE + metadata polish

**Files:**
- Create: `packages/batutas-sdk/LICENSE`

- [ ] **Step 1: Write `packages/batutas-sdk/LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 EzraNahumury

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Commit**

```bash
rtk git add packages/batutas-sdk/LICENSE
rtk git commit -m "chore(sdk): add MIT LICENSE"
```

- [ ] **Step 3: Open PR 4 and merge**

```bash
rtk git push -u origin feat/sdk-4-build
gh pr create --base main --title "chore(sdk): build verification, README, LICENSE" --body "Verifies tsup dual ESM/CJS+types build and a CJS smoke import, adds .gitignore, README with usage + npm downloads badge, and MIT LICENSE."
gh pr merge --merge --delete-branch
git checkout main && git pull
```

---

## PR 5 — publish prep (`feat/sdk-5-publish`)

Branch:

```bash
git checkout -b feat/sdk-5-publish
```

### Task 15: .npmignore, dry-run, PROGRESS

**Files:**
- Create: `packages/batutas-sdk/.npmignore`
- Create: `packages/batutas-sdk/PUBLISHING.md`
- Modify: `frontend-batutas/PROGRESS.md` (append SDK lines)

- [ ] **Step 1: Write `packages/batutas-sdk/.npmignore`**

```
src
test
tsup.config.ts
tsconfig.json
vitest.config.ts
*.tsbuildinfo
.gitignore
PUBLISHING.md
```

(`files:["dist"]` in package.json already whitelists the tarball; `.npmignore` is a belt-and-suspenders exclude so source/test/config never ship.)

- [ ] **Step 2: Confirm the name is free**

Run: `npm view batutas-sdk version`
Expected: errors with `404 Not Found` (name available). If it returns a version, the name is taken — stop and pick a scoped name `@ezranahumury/batutas-sdk` (set `"publishConfig": { "access": "public" }` in package.json) before publishing.

- [ ] **Step 3: Dry-run publish and inspect the tarball**

Run: `cd packages/batutas-sdk && npm run build && npm publish --dry-run`
Expected: exit 0. The "Tarball Contents" list contains only `dist/*`, `README.md`, `LICENSE`, `package.json` — no `src`, `test`, or config files.

- [ ] **Step 4: Write `packages/batutas-sdk/PUBLISHING.md`**

````markdown
# Publishing batutas-sdk

The package is built and dry-run-clean. Publishing to the npm registry is a
manual step (it needs your npm credentials).

```bash
cd packages/batutas-sdk
npm login                 # one-time, opens browser / asks for OTP
npm run build             # produces dist/ (also runs automatically via prepublishOnly)
npm publish --dry-run     # final sanity check on the tarball
npm publish               # publishes batutas-sdk@<version> to the public registry
```

After publishing:
- Downloads are tracked automatically from the publish date (stats lag ~1 day).
- Daily chart: <https://www.npmjs.com/package/batutas-sdk>.
- The README badge `img.shields.io/npm/dm/batutas-sdk` renders the Downloads metric.

To release an update: `npm version patch && npm publish` (bumps version, builds, publishes).
````

- [ ] **Step 5: Append SDK lines to `frontend-batutas/PROGRESS.md`**

Add these lines at the end of the file:

```
- [sdk] scaffold batutas-sdk package (tsup dual ESM/CJS + types)
- [sdk] port pure commit-reveal core from frontend (no React/storage)
- [sdk] lock commit-hash encoding with known keccak vectors
- [sdk] vitest suite green: secret format, determinism, enum round-trips
- [sdk] README + npm downloads badge; MIT license
- [sdk] dry-run-clean tarball (dist + README + LICENSE only)
```

- [ ] **Step 6: Commit**

```bash
rtk git add packages/batutas-sdk/.npmignore packages/batutas-sdk/PUBLISHING.md frontend-batutas/PROGRESS.md
rtk git commit -m "chore(sdk): add .npmignore, publishing guide, PROGRESS entries"
```

- [ ] **Step 7: Open PR 5 and merge**

```bash
rtk git push -u origin feat/sdk-5-publish
gh pr create --base main --title "chore(sdk): publish prep — npmignore, dry-run guide, PROGRESS" --body "Adds .npmignore, PUBLISHING.md (manual npm publish steps), and PROGRESS entries. Package is dry-run-clean; the actual npm publish is a manual user step."
gh pr merge --merge --delete-branch
git checkout main && git pull
```

---

## After all 5 PRs

The package lives at `packages/batutas-sdk`, builds clean, tests green, dry-run-clean tarball. **You** run the publish (needs npm login):

```bash
cd packages/batutas-sdk && npm login && npm publish
```

Then `npmjs.com/package/batutas-sdk` shows the Downloads chart and the README badge renders. Downloads accrue from real installs.

## Self-review notes

- **Spec coverage:** scaffold (PR1) ✓, pure core port incl. ABI (PR2) ✓, vitest incl. known-vector (PR3) ✓, tsup dual build + README badge + LICENSE + metadata (PR4) ✓, .npmignore + dry-run + PROGRESS (PR5) ✓. Manual publish handoff documented ✓.
- **Env-override decision honored:** `contract.ts` is a plain constant, no `process.env` (spec §contract.ts).
- **No contract / frontend-runtime change:** only `frontend-batutas/PROGRESS.md` (a notes file) is touched outside the new package.
- **Types consistent:** `makeSecret`/`buildCommitHash` signatures identical across commit.ts, index.ts, README, and tests; enum names match across moves.ts/index.ts/tests.
