# 🪨📄✂️ BATUTAS — Insight & Planning Smart Contract

> Ringkasan kebutuhan smart contract berdasarkan [README.md](../README.md) + rencana implementasi.
> Game: Rock–Paper–Scissors on-chain, provably-fair (commit–reveal), berjalan di **Celo Mainnet**, dioptimalkan untuk **MiniPay**.

---

## 1. Tujuan & Konteks

- Pemain melawan **protokol/house** (bukan PvP di MVP).
- Alur uang: **Deposit CELO → batutas → main → Win/Lose/Draw → Withdraw CELO**.
- Peg: **1 CELO = 1000 batutas**.
- Hasil **ditentukan on-chain** lewat commit–reveal, animasi frontend hanya UX (tidak menentukan hasil).
- Target: aktivitas on-chain nyata untuk **Celo Proof of Ship** (kontrak terverifikasi di Celoscan).

---

## 2. Kebutuhan Fungsional Smart Contract

### 2.1 Manajemen Dana
- `deposit()` — `payable`, terima CELO, kredit balance batutas pemain (`msg.value * 1000 / 1e18`... lihat catatan desimal di bawah).
- `withdraw(uint256 batutas)` — kurangi balance, kirim CELO setara ke pemain. **Wajib `nonReentrant`**.
- `balanceOf(address)` — view saldo batutas.
- Konversi batutas ↔ CELO harus konsisten & tidak ada pembulatan yang bocor (favor ke house/round-down).

### 2.2 Game (Commit–Reveal)
- `commitMove(bytes32 commitHash)` — kunci stake (mis. 25 batutas), simpan `keccak256(abi.encodePacked(move, secret))`, catat `commitBlock`, set state `Committed`.
- `revealMove(Move move, bytes32 secret) returns (Result)` — verifikasi hash, derive house move dari `blockhash(commitBlock)` + `secret`, settle Win/Lose/Draw, update balance.
- `pendingCommit(address)` — view commit yang belum di-reveal (hash + block).

### 2.3 Settlement / Ekonomi
- **Stake per main:** −25 batutas.
- **Win:** +50 (atau +47/+48 untuk house rake 3–5% agar sustainable).
- **Draw:** stake dikembalikan (push).
- **Lose:** stake hangus (−25).
- EV ≈ 0 (near-fair) dengan parameter di atas.

### 2.4 Keamanan & Timeout
- **Reveal deadline:** jika pemain tak pernah reveal sampai deadline → stake **auto-refund** (state `Refunded`). Cegah dana terkunci.
- **Reserve invariant:** `reserve ≥ maxConcurrentExposure` supaya kemenangan selalu bisa dibayar.
- `fundReserve()` — `payable`, top-up pool pembayaran.

### 2.5 Admin (onlyOwner — disarankan multisig/timelock)
- `setStake(uint256)`
- `setWinPayout(uint256)`
- `fundReserve()`
- Pertimbangkan `pause()` untuk keadaan darurat.

### 2.6 Events (untuk analitik & Proof of Ship)
- `Deposited(address, celoIn, batutasOut)`
- `Committed(address, commitHash, commitBlock)`
- `Revealed(address, move, houseMove, result, stake)`
- `Withdrawn(address, batutas, celoOut)`
- `Refunded(address, stake)`

---

## 3. Enum & State Machine

```solidity
enum Move   { Rock, Paper, Scissors }
enum Result { Lose, Draw, Win }
```

State per ronde: `Idle → Committed → (Revealed → Settled → Idle) | (Refunded → Idle)`

---

## 4. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Fairness** | Commit–reveal (MVP). House move dari `blockhash(commitBlock) ^ secret`. Upgrade ke **VRF** sebelum nilai besar. |
| **Reentrancy** | `nonReentrant` pada `withdraw` & settlement; pull-over-push payout. |
| **Solvabilitas** | Reserve invariant dijaga setiap commit. |
| **Verifikasi** | Kontrak harus diverifikasi di Celoscan (syarat Proof of Ship). |
| **Gas/MiniPay** | Transaksi murah & single-tap; events lengkap. Web3 lib: **viem/wagmi**, BUKAN ethers.js. |
| **Jaringan** | Celo Sepolia (test) → Celo Mainnet (chainId 42220, RPC forno.celo.org). |

---

## 5. Risiko & Catatan Teknis

- ⚠️ **blockhash grindable** oleh block producer → hanya untuk stake kecil. Untuk real-money: pakai VRF.
- ⚠️ `blockhash()` hanya tersedia untuk 256 block terakhir → reveal deadline harus < 256 block, atau simpan seed alternatif.
- ⚠️ **Presisi desimal:** CELO 18 desimal vs batutas (integer). Tentukan apakah batutas disimpan internal (uint) atau ERC-20 (`BatutasToken.sol`). MVP: balance internal lebih simpel.
- ⚠️ **Regulasi:** game of chance + real money bisa kena aturan judi (dilarang di beberapa negara termasuk Indonesia). Pertimbangkan play-money/testnet dulu atau model PvP+rake.
- ⚠️ **Front-running reveal:** pastikan house move tidak bisa diprediksi pemain sebelum commit di-lock.

---

## 6. Planning / Roadmap Implementasi

### Tahap 0 — Setup (½ hari)
- [ ] Scaffold via **Celo Composer** (`npx @celo/celo-composer@latest create`).
- [ ] Struktur: `packages/hardhat` (kontrak) + `packages/react-app` (Next.js).
- [ ] Konfigurasi `.env` (PRIVATE_KEY throwaway, CELOSCAN_API_KEY).

### Tahap 1 — Desain Kontrak (Week 1 · Scope)
- [ ] Finalisasi parameter ekonomi (stake/win/draw/lose) & house rake.
- [ ] Tetapkan model balance: internal uint vs ERC-20.
- [ ] Definisikan interface lengkap + events + state machine.
- [ ] Tentukan reveal deadline (block window) & mekanisme refund.

### Tahap 2 — Implementasi `Batutas.sol` (Week 2 · Ship)
- [ ] `deposit()` / `withdraw()` dengan konversi peg & `nonReentrant`.
- [ ] `commitMove()` — lock stake, simpan hash + commitBlock.
- [ ] `revealMove()` — verifikasi hash, derive house move, settle, update balance + emit event.
- [ ] Logika hasil RPS (Win/Lose/Draw) + payout.
- [ ] Reveal deadline + `claimRefund()`/auto-refund.
- [ ] Reserve invariant + `fundReserve()`.
- [ ] Fungsi admin (`setStake`, `setWinPayout`, `pause`).

### Tahap 3 — Testing (Week 2)
- [ ] Unit test: deposit, withdraw, commit, reveal happy-path.
- [ ] Edge cases: reveal salah secret, double commit, reveal setelah deadline, withdraw > balance.
- [ ] Test ekonomi: EV netral, reserve tidak pernah negatif.
- [ ] Test reentrancy & overflow.
- [ ] Fuzz/invariant test (opsional, Foundry/Echidna).

### Tahap 4 — Deploy Testnet (Week 2–3)
- [ ] Deploy ke **Celo Sepolia**, ambil faucet.
- [ ] Verifikasi kontrak di Celoscan testnet.
- [ ] Integrasi frontend (viem/wagmi) + uji di MiniPay dApp browser.

### Tahap 5 — Mainnet (Week 3 · Refine)
- [ ] Deploy ke **Celo Mainnet** (chainId 42220).
- [ ] `npx hardhat verify` → kontrak terverifikasi.
- [ ] Set `NEXT_PUBLIC_CONTRACT_ADDRESS`, deploy frontend ke Vercel.
- [ ] Tambah analitik dari events, kumpulkan user nyata.

### Tahap 6 — Polish & Present (Week 4)
- [ ] Audit ringan / review keamanan.
- [ ] Implementasi **MiniPay hook** (Booster Proof of Ship).
- [ ] Demo 4 menit + dokumentasi.

### Future
- [ ] VRF-based randomness (ganti blockhash).
- [ ] Mode PvP / turnamen (mengurangi risiko regulasi house).
- [ ] Leaderboard, streak rewards, daily free play.

---

## 7. Checklist Keamanan Kontrak (wajib sebelum mainnet)

- [ ] `nonReentrant` pada withdraw & settlement.
- [ ] Pull-over-push payout.
- [ ] Reveal deadline + auto-refund.
- [ ] Reserve invariant `reserve ≥ maxConcurrentExposure`.
- [ ] Events untuk setiap perubahan state.
- [ ] Checks-Effects-Interactions pattern.
- [ ] Akses admin via multisig/timelock.
- [ ] Audit sebelum memegang nilai signifikan.
- [ ] Kontrak terverifikasi di Celoscan.
