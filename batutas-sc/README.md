# 🪨📄✂️ BATUTAS — Smart Contracts

[![Smart Contracts CI](https://github.com/EzraNahumury/batutas/actions/workflows/smart-contracts.yml/badge.svg)](https://github.com/EzraNahumury/batutas/actions/workflows/smart-contracts.yml)

Provably-fair, on-chain Rock–Paper–Scissors against the protocol, built with
**Hardhat + Solidity 0.8.24** for **Celo Mainnet** and optimized for **MiniPay**.

Players deposit CELO for in-game **batutas**, play a commit–reveal round, and
withdraw batutas back to CELO at a fixed peg (**1 CELO = 1000 batutas**).

> Package scope: this folder contains **only the smart contracts** (contracts,
> tests, deploy script). The frontend lives elsewhere in the repo.

---

## 📁 Layout

```
batutas-sc/
├── contracts/
│   ├── Batutas.sol            # core game: funds, commit-reveal, settlement, admin
│   ├── interfaces/
│   │   └── IBatutas.sol       # player-facing ABI + events
│   ├── libraries/
│   │   └── RPSLogic.sol       # pure Rock-Paper-Scissors rules (no state)
│   └── types/
│       └── GameTypes.sol      # shared enums: Move, Result, RoundStatus
├── scripts/
│   └── deploy.ts              # deploy + Celoscan auto-verify
├── test/
│   └── Batutas.test.ts        # full unit suite
├── hardhat.config.ts          # Celo Mainnet + Celo Sepolia networks
└── .env.example
```

**Separation of concern:** game rules ([RPSLogic](contracts/libraries/RPSLogic.sol))
and the public ABI ([IBatutas](contracts/interfaces/IBatutas.sol)) are isolated
from fund handling and round bookkeeping in [Batutas.sol](contracts/Batutas.sol).

---

## 🪙 Economy

| Action | Batutas | CELO (peg 1 CELO = 1000) |
|---|---:|---|
| Deposit 1 CELO | +1000 | 1.000 |
| Stake per round | −25 | 0.025 |
| **Win** payout | **+50** | 0.050 |
| **Draw** | stake returned (push) | 0.000 |
| **Lose** | 0 | −0.025 |
| Withdraw 1000 batutas | −1000 | 1.000 |

Defaults are tunable on-chain via `setStake` / `setWinPayout` (owner only).
With stake 25 / win 50 the expected value is ~0 (near-fair). Set the win payout
slightly below 2× to keep a small house rake that funds the reserve.

**Reserve invariant:** every commit locks the house's potential exposure
(`winPayout − stake`) from `availableReserve`, so a win is always payable. Fund
the reserve with `fundReserve()` before opening play.

---

## 🎲 Commit–Reveal Flow

1. **Commit** — `commitMove(keccak256(abi.encodePacked(move, secret)))` locks the
   stake and records `commitBlock`.
2. **Reveal** — `revealMove(move, secret)` verifies the hash, then derives the
   house move from `keccak256(blockhash(commitBlock), secret)` and settles.
3. **Refund** — if the player never reveals within `REVEAL_DEADLINE_BLOCKS` (200),
   `claimRefund()` returns the stake and releases the reserve lock.

The commit preimage the frontend must reproduce:

```ts
const commitHash = ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
```

> ⚠️ **Security — randomness.** The house move uses `blockhash`, which is
> (a) grindable by block producers and (b) vulnerable to selective non-reveal
> (a player can compute the result before revealing and let a losing round
> expire for a refund). This is acceptable for low-stakes play only. **Upgrade
> to a VRF before handling meaningful value.**

---

## 🛠️ Setup

```bash
cd batutas-sc
npm install
cp .env.example .env   # fill PRIVATE_KEY (throwaway) + CELOSCAN_API_KEY
```

## 🧪 Compile & Test

```bash
npm run compile
npm test          # 53 tests: funds, commit-reveal, reserve, access control, pause
npm run coverage  # solidity-coverage report (./coverage)
npm run test:gas  # per-function gas usage report
```

**Coverage (production contracts):** 100% statements · 100% functions ·
100% lines · ~92% branches. Test-only helpers are excluded via `.solcover.js`.

## 🚀 Deploy

```bash
npm run deploy:sepolia   # Celo Sepolia testnet (chainId 11142220)
npm run deploy:celo      # Celo Mainnet (chainId 42220)
```

After deploy, fund the reserve, set `NEXT_PUBLIC_CONTRACT_ADDRESS`, and verify:

```bash
npx hardhat verify --network celo <ADDRESS> <DEPLOYER_ADDRESS>
```

---

## 📜 Contract API

```solidity
// Funds
function deposit() external payable;
function withdraw(uint256 batutas) external;

// Game (commit-reveal)
function commitMove(bytes32 commitHash) external;
function revealMove(Move move, bytes32 secret) external returns (Result);
function claimRefund() external;

// Reserve
function fundReserve() external payable;
function withdrawReserve(uint256 batutas) external; // onlyOwner

// Admin
function setStake(uint256 newStake) external;       // onlyOwner
function setWinPayout(uint256 newWinPayout) external; // onlyOwner
function pause() external;                            // onlyOwner
function unpause() external;                          // onlyOwner

// Views
function balanceOf(address player) external view returns (uint256);
function pendingCommit(address player) external view returns (bytes32, uint256);
```

---

## 🔒 Security Notes

- ✅ `nonReentrant` on every CELO transfer (`withdraw`, `withdrawReserve`).
- ✅ Checks-Effects-Interactions ordering throughout.
- ✅ Reserve invariant keeps wins solvent.
- ✅ Reveal deadline + `claimRefund` so stakes are never trapped.
- ✅ Custom errors + events on every state change (analytics / Proof of Ship).
- ⚠️ `blockhash` randomness — replace with a VRF before real-money launch.
- ⚠️ Get an audit before holding meaningful value, and review gambling
  regulation in target jurisdictions.

See [insight.md](insight.md) for the full requirements and roadmap.

---

Released under the **MIT License**. Built for Celo Proof of Ship — Season 2.
