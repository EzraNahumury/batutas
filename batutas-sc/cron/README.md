# Batutas activity cron

Generates 500 wallets, funds each with CELO from a master wallet, then deposits
`0.001 CELO` from every wallet into the deployed Batutas game on a schedule.

## DAU 600 = two paths (do not merge)

| Path | Wallets | Where | Schedule |
|------|---------|-------|----------|
| Original | 100 | GitHub Actions (`WALLETS_JSON` secret) | 00:00 UTC |
| New (this file) | 500 | Local Windows Task | 15:00 local |

The original 100 private keys live only in the GitHub secret and on the machine
that created them — they **cannot be read back** from the secret, so the two sets
can't be combined into one file. Run them in parallel instead:
**100 (cloud) + 500 (local) = 600 unique addresses/day = DAU 600.**

- **500 unique local wallets × 1 deposit/day**
- **1 run/day** is enough — every wallet transacts once. Extra runs reuse the
  same wallets (no new DAU), only burn gas.
- Target: `deposit()` on `0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf` (Celo mainnet)
- ⚠️ Never overwrite the `WALLETS_JSON` secret — losing the old 100 keys drops
  DAU back toward 500 and strands their on-chain funds.
- `0.001 CELO` = exactly **1 batuta** (`WEI_PER_BATUTA = 1e18 / 1000`); anything
  smaller reverts with `DepositTooSmall()`.

Standalone: only needs `node` + `ethers`. Does not use the hardhat runtime.

## Setup

```powershell
cd C:\batutas\batutas-sc\cron
npm install
Copy-Item .env.example .env
```

Edit `.env` and set `FUNDER_PRIVATE_KEY` to the master wallet that holds the CELO.

### Fund the master wallet first

Distribution sends `AMOUNT_PER_WALLET_CELO × 500` **plus gas**. At the default
`0.01` that is `5 CELO` + gas — enough for a short experiment (~3 ticks/wallet).
Fund the master with **~5.2 CELO** (or scale up for a longer run).

## Run (one-time bootstrap)

```powershell
npm run gen          # create 500 wallets -> secrets/wallets.json (keep secret!)
npm run distribute   # master wallet sends 0.01 CELO to each of the 500 wallets
npm run status       # verify balances before scheduling
```

`npm run gen` refuses to overwrite an existing `secrets/wallets.json` — losing
those keys means losing the CELO they hold.

## Schedule (1× per day)

```powershell
# run as a user allowed to create scheduled tasks
.\register-cron.ps1
schtasks /Run /TN BatutasCronTick   # fire one run immediately to test
```

This creates task **BatutasCronTick** running `run-tick.ps1` daily at **15:00**
(500 local wallets × 1 deposit = 500 unique addresses; +100 cloud = DAU 600).
Output is appended to `logs\tick.log`. The machine must be powered on at 15:00.

Manual single run:

```powershell
npm run tick
```

**Linux/server cron** equivalent (1x/day at 00:00):

```cron
0 0 * * * cd /path/to/cron && /usr/bin/node tick.js >> logs/tick.log 2>&1
```

## Runway — gas dominates, not the deposit

Each tick costs `0.001 CELO deposit + gas` per wallet. On Celo the **gas cost
usually dwarfs the deposit**, so total lifetime depends almost entirely on the
gas price at the time:

| Gas price | Cost / tx | ~Burn / day (400 tx) | 100 CELO lasts |
|-----------|-----------|----------------------|----------------|
| ~200 gwei (spike) | ~0.007–0.011 CELO | ~2.8–4.4 CELO | **~22–36 days** |
| ~25 gwei (normal) | ~0.002 CELO | ~0.8 CELO | **~100–125 days** |
| deposit only (no gas, unrealistic) | 0.001 CELO | 0.4 CELO | 250 days |

At a 200 gwei spike only ~10–15% of each tx is the deposit; the rest is gas, so
most of the 100 CELO is **burned as fees**, not converted. `npm run status`
prints the current remaining runway against live conditions.

Note: the deposit portion becomes in-game **batutas** held by the contract; it
is not spent, just converted, and wallets can `withdraw()` it back later. Gas,
however, is gone for good.

## Security

- `secrets/` and `.env` are gitignored. **Never commit private keys.**
- Use throwaway wallets only — these keys sit in plaintext on disk.
- `secrets/wallets.json` is the only copy of the 100 private keys; back it up if
  the CELO in those wallets matters.

## Files

| File | Purpose |
|------|---------|
| `generate-wallets.js` | create N random wallets → `secrets/` |
| `distribute.js` | master wallet → 1 CELO to each wallet |
| `tick.js` | one run: every wallet deposits `0.001 CELO` |
| `status.js` | balances + in-game batutas + runway |
| `run-tick.ps1` | scheduler wrapper (logs to `logs/tick.log`) |
| `register-cron.ps1` | register the every-6h Windows task |
| `lib.js` | shared config/helpers |
