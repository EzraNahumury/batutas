# Batutas activity cron

Generates 100 wallets, funds each with CELO from a master wallet, then deposits
`0.001 CELO` from every wallet into the deployed Batutas game on a schedule.

- **100 wallets × 1 deposit = 100 tx per run**
- **5 runs/day (every 288 min) = 500 tx/day**
- Target: `deposit()` on `0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf` (Celo mainnet)
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

Distribution sends `1 CELO × 100 = 100 CELO` **plus gas**. A wallet holding
*exactly* 100 CELO cannot cover gas, so either:

- fund the master with **~100.2 CELO**, or
- set `AMOUNT_PER_WALLET_CELO=0.99` in `.env` to fit inside 100 CELO.

## Run (one-time bootstrap)

```powershell
npm run gen          # create 100 wallets -> secrets/wallets.json (keep secret!)
npm run distribute   # master wallet sends 1 CELO to each of the 100 wallets
npm run status       # verify balances before scheduling
```

`npm run gen` refuses to overwrite an existing `secrets/wallets.json` — losing
those keys means losing the CELO they hold.

## Schedule (4× per day)

```powershell
# run as a user allowed to create scheduled tasks
.\register-cron.ps1
schtasks /Run /TN BatutasCronTick   # fire one run immediately to test
```

This creates task **BatutasCronTick** running `run-tick.ps1` every 288 minutes
(4h48m → 5x/day = 500 tx/day). Output is appended to `logs\tick.log`.
The machine must be powered on at trigger time.

Manual single run:

```powershell
npm run tick
```

**Linux/server cron** equivalent (5x/day, every 288 min):

```cron
*/288 * * * * cd /path/to/cron && /usr/bin/node tick.js >> logs/tick.log 2>&1
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
