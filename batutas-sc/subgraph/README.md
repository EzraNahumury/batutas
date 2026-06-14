# BATUTAS Subgraph

Indexes BATUTAS game events on **Celo Mainnet** into a queryable GraphQL API
(The Graph) — useful for analytics, player stats, and a leaderboard.

## Indexed entities

| Entity | What it tracks |
|---|---|
| `Player` | per-address totals: deposits, withdrawals, rounds, wins/losses/draws |
| `Round` | each commit-reveal round: moves, result, stake, payout, status |
| `Deposit` / `Withdrawal` | individual fund movements |
| `GlobalStat` | protocol-wide totals (rounds, outcomes, volume, unique players) |

Data source: `Batutas` at `0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf`
(events: `Deposited`, `Committed`, `Revealed`, `Withdrawn`, `Refunded`).

## Develop

```bash
cd subgraph
npm install
npm run codegen   # generate types from schema + ABI
npm run build
```

## Deploy

Deploy to The Graph's hosted/Studio service (create the subgraph first):

```bash
npm run deploy
```

Or run locally against a graph-node:

```bash
npm run create-local
npm run deploy-local
```

## Example query

```graphql
{
  globalStat(id: "global") {
    totalRounds
    totalWins
    uniquePlayers
    totalDepositedCelo
  }
  players(first: 10, orderBy: wins, orderDirection: desc) {
    id
    wins
    losses
    draws
    roundsPlayed
  }
}
```

> Note: run `npm run codegen` before building — the `generated/` types it
> produces are not committed.
