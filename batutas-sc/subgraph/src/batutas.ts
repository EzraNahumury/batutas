import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Deposited,
  Committed,
  Revealed,
  Withdrawn,
  Refunded,
} from "../generated/Batutas/Batutas";
import { Player, Round, Deposit, Withdrawal, GlobalStat } from "../generated/schema";

const GLOBAL_ID = "global";

function loadGlobal(): GlobalStat {
  let g = GlobalStat.load(GLOBAL_ID);
  if (g == null) {
    g = new GlobalStat(GLOBAL_ID);
    g.totalRounds = 0;
    g.totalWins = 0;
    g.totalLosses = 0;
    g.totalDraws = 0;
    g.totalDepositedCelo = BigInt.zero();
    g.totalWithdrawnCelo = BigInt.zero();
    g.uniquePlayers = 0;
  }
  return g;
}

function loadOrCreatePlayer(addr: Bytes): Player {
  let p = Player.load(addr);
  if (p == null) {
    p = new Player(addr);
    p.totalDeposited = BigInt.zero();
    p.totalWithdrawn = BigInt.zero();
    p.roundsPlayed = 0;
    p.wins = 0;
    p.losses = 0;
    p.draws = 0;

    const g = loadGlobal();
    g.uniquePlayers = g.uniquePlayers + 1;
    g.save();
  }
  return p;
}

export function handleDeposited(event: Deposited): void {
  const player = loadOrCreatePlayer(event.params.player);
  player.totalDeposited = player.totalDeposited.plus(event.params.celoIn);
  player.save();

  const deposit = new Deposit(event.transaction.hash.concatI32(event.logIndex.toI32()));
  deposit.player = player.id;
  deposit.celoIn = event.params.celoIn;
  deposit.batutasOut = event.params.batutasOut;
  deposit.timestamp = event.block.timestamp;
  deposit.save();

  const g = loadGlobal();
  g.totalDepositedCelo = g.totalDepositedCelo.plus(event.params.celoIn);
  g.save();
}

export function handleCommitted(event: Committed): void {
  const player = loadOrCreatePlayer(event.params.player);

  const round = new Round(event.transaction.hash.concatI32(event.logIndex.toI32()));
  round.player = player.id;
  round.stake = BigInt.zero();
  round.payout = BigInt.zero();
  round.status = "Committed";
  round.committedAtBlock = event.params.commitBlock;
  round.committedAt = event.block.timestamp;
  round.save();

  player.activeRound = round.id;
  player.save();
}

export function handleRevealed(event: Revealed): void {
  const player = loadOrCreatePlayer(event.params.player);

  const activeId = player.activeRound;
  let round: Round | null = activeId !== null ? Round.load(activeId as Bytes) : null;
  if (round == null) {
    round = new Round(event.transaction.hash.concatI32(event.logIndex.toI32()));
    round.player = player.id;
    round.committedAtBlock = event.block.number;
    round.committedAt = event.block.timestamp;
  }

  round.playerMove = event.params.playerMove;
  round.houseMove = event.params.houseMove;
  round.result = event.params.result;
  round.stake = event.params.stake;
  round.payout = event.params.payout;
  round.status = "Revealed";
  round.revealedAt = event.block.timestamp;
  round.save();

  player.roundsPlayed = player.roundsPlayed + 1;
  const g = loadGlobal();
  g.totalRounds = g.totalRounds + 1;

  // result: 0 = Lose, 1 = Draw, 2 = Win
  if (event.params.result == 2) {
    player.wins = player.wins + 1;
    g.totalWins = g.totalWins + 1;
  } else if (event.params.result == 1) {
    player.draws = player.draws + 1;
    g.totalDraws = g.totalDraws + 1;
  } else {
    player.losses = player.losses + 1;
    g.totalLosses = g.totalLosses + 1;
  }

  player.activeRound = null;
  player.save();
  g.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  const player = loadOrCreatePlayer(event.params.player);
  player.totalWithdrawn = player.totalWithdrawn.plus(event.params.celoOut);
  player.save();

  const w = new Withdrawal(event.transaction.hash.concatI32(event.logIndex.toI32()));
  w.player = player.id;
  w.batutasIn = event.params.batutasIn;
  w.celoOut = event.params.celoOut;
  w.timestamp = event.block.timestamp;
  w.save();

  const g = loadGlobal();
  g.totalWithdrawnCelo = g.totalWithdrawnCelo.plus(event.params.celoOut);
  g.save();
}

export function handleRefunded(event: Refunded): void {
  const player = loadOrCreatePlayer(event.params.player);
  const activeId = player.activeRound;
  if (activeId !== null) {
    const round = Round.load(activeId as Bytes);
    if (round != null) {
      round.status = "Refunded";
      round.save();
    }
  }
  player.activeRound = null;
  player.save();
}
