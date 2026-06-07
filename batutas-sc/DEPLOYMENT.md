# 🚀 BATUTAS — Deployment & Integration

Dokumentasi hasil deploy smart contract **BATUTAS** dan panduan integrasi untuk
frontend (MiniPay / viem / wagmi).

> Status: **LIVE & VERIFIED** di Celo Mainnet ✅

---

## 📍 Alamat Kontrak (pakai ini di frontend)

```
0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf
```

Set di environment frontend:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf
```

---

## 🌐 Detail Jaringan

| | |
|---|---|
| **Network** | Celo Mainnet |
| **Chain ID** | `42220` |
| **RPC URL** | `https://forno.celo.org` |
| **Explorer** | [Celoscan](https://celoscan.io/address/0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf) |
| **Source code (verified)** | [Celoscan #code](https://celoscan.io/address/0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf#code) |

---

## 📦 Detail Deployment

| Field | Value |
|---|---|
| **Contract** | `Batutas` |
| **Address** | `0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf` |
| **Owner (admin)** | `0xa066D8653ED3Ae672f36CaE77dB70c921F6fB8A0` |
| **Deployer** | `0x746860E3a28a351f02B057E17683896b20582102` |
| **Constructor arg** | `0x746860E3a28a351f02B057E17683896b20582102` (initialOwner) |
| **Verified di Celoscan** | ✅ Ya |
| **Reserve terisi** | ✅ 1 CELO = 1000 batutas (game playable) |
| **Compiler** | Solidity `0.8.24`, optimizer `runs: 200` |

> Catatan: deployer hanya membuat kontrak (fakta historis, tanpa hak admin).
> Kendali admin penuh ada di **owner** (`0xa066...B8A0`).
> Record mesin-terbaca: [deployments/celo-mainnet.json](deployments/celo-mainnet.json).

---

## 🪙 Parameter Ekonomi (on-chain)

| Parameter | Nilai | Keterangan |
|---|---|---|
| Peg | 1 CELO = **1000 batutas** | `BATUTAS_PER_CELO` |
| Wei per batuta | `1e15` | `WEI_PER_BATUTA` |
| Stake per ronde | **25** batutas | `stake` (tunable owner) |
| Win payout | **50** batutas | `winPayout` (tunable owner) |
| Reveal deadline | **200** block | `REVEAL_DEADLINE_BLOCKS` |

---

## 🧩 Integrasi Frontend

### 1. ABI

ABI tersedia setelah compile, di:

```
artifacts/contracts/Batutas.sol/Batutas.json   ← field "abi"
```

Jalankan `npm run compile` untuk men-generate-nya (folder `artifacts/` tidak
di-commit). Atau ambil ABI langsung dari tab **Contract → Code** di Celoscan.

### 2. Fungsi utama yang dipakai frontend

```solidity
// Dana
function deposit() external payable;            // kirim CELO, dapat batutas
function withdraw(uint256 batutas) external;    // batutas -> CELO

// Game (commit-reveal)
function commitMove(bytes32 commitHash) external;
function revealMove(Move move, bytes32 secret) external returns (Result);
function claimRefund() external;                // jika lewat deadline reveal

// Views
function balanceOf(address player) external view returns (uint256);
function pendingCommit(address player) external view returns (bytes32, uint256);
```

`Move`: `0 = Rock`, `1 = Paper`, `2 = Scissors`
`Result`: `0 = Lose`, `1 = Draw`, `2 = Win`

### 3. Cara membuat commit hash (WAJIB sama persis)

```ts
import { encodePacked, keccak256, toHex } from "viem";

// secret = 32 byte acak yang DISIMPAN di sisi player sampai reveal
const secret = toHex(crypto.getRandomValues(new Uint8Array(32)));
const commitHash = keccak256(encodePacked(["uint8", "bytes32"], [move, secret]));

// 1) commitMove(commitHash)  -> tunggu confirm
// 2) revealMove(move, secret) -> di block berikutnya
```

> Flow: **commit** dulu (lock stake), tunggu tx confirm, lalu **reveal** di
> block berikutnya. Simpan `secret` di client sampai reveal; jika hilang,
> stake bisa di-`claimRefund()` setelah 200 block.

### 4. Events untuk UI / analitik

```solidity
event Deposited(address indexed player, uint256 celoIn, uint256 batutasOut);
event Committed(address indexed player, bytes32 commitHash, uint256 commitBlock);
event Revealed(address indexed player, Move playerMove, Move houseMove,
               Result result, uint256 stake, uint256 payout);
event Withdrawn(address indexed player, uint256 batutasIn, uint256 celoOut);
event Refunded(address indexed player, uint256 stake);
```

`Revealed` membawa hasil ronde (`result`) + `houseMove` untuk ditampilkan
setelah animasi kartu.

> ⚠️ Pakai **viem / wagmi** (bukan ethers.js) agar kompatibel dengan MiniPay.

---

## 🔧 Cara Reproduksi / Operasional (untuk tim SC)

```bash
cd batutas-sc
npm install
cp .env.example .env        # isi PRIVATE_KEY + CELOSCAN_API_KEY

npm run compile             # generate ABI
npm test                    # 19 unit test

npm run deploy:celo         # deploy ke Celo Mainnet
RESERVE_CELO=1 npx hardhat run scripts/fund-reserve.ts --network celo
npx hardhat verify --network celo <ADDRESS> <OWNER>
```

Script operasional tersedia di [scripts/](scripts/):
`deploy.ts`, `fund-reserve.ts`, `transfer-ownership.ts`, `check-balance.ts`.

---

## 🔒 Keamanan & Catatan

- Admin kontrak dipegang owner aman `0xa066...B8A0` (deployer sudah tidak punya hak).
- Randomness pakai `blockhash` — cocok untuk stake kecil; **upgrade ke VRF**
  sebelum nilai besar (lihat catatan di [Batutas.sol](contracts/Batutas.sol)).
- Reserve invariant menjaga setiap kemenangan selalu terbayar.

Lihat [README.md](README.md) untuk arsitektur lengkap dan
[insight.md](insight.md) untuk kebutuhan & roadmap.
