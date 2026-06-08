"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useBlockNumber, useSwitchChain, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { parseEther, parseEventLogs } from "viem";
import { wagmiConfig } from "../lib/wagmi";
import {
  BATUTAS_ADDRESS,
  BATUTAS_CHAIN_ID,
  CELO_EXPLORER,
  PEG,
  batutasAbi,
  buildCommitHash,
  clearRound,
  loadRound,
  makeSecret,
  saveRound,
  MOVE_NUM,
  NUM_TO_MOVE,
  NUM_TO_RESULT,
  type Move,
  type Outcome,
} from "../lib/batutas";
import StarField from "../components/StarField";
import { useIsMiniPay } from "../lib/useMiniPay";
import { useBackgroundMusic } from "../lib/useBackgroundMusic";
import { Rock, Paper, Scissors, Coin, ArrowUpRight, ShieldCheck, SpeakerOn, SpeakerOff } from "../components/icons";
import type { ComponentType, SVGProps } from "react";

const ZERO_HASH = `0x${"0".repeat(64)}` as const;
const SHORT = `${BATUTAS_ADDRESS.slice(0, 6)}…${BATUTAS_ADDRESS.slice(-4)}`;

const MOVE_LABEL: Record<Move, string> = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
const MOVE_ICON: Record<Move, ComponentType<SVGProps<SVGSVGElement>>> = {
  rock: Rock,
  paper: Paper,
  scissors: Scissors,
};
const MOVES: Move[] = ["rock", "paper", "scissors"];

type Status =
  | "loading"
  | "shuffling"
  | "committing"
  | "securing"
  | "choose"
  | "revealing"
  | "result"
  | "stuck";
type Round = { id: number; you: Move; house: Move; result: Outcome; delta: number };

function shuffle3(): number[] {
  const a = [0, 1, 2];
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function errMsg(e: unknown): string {
  const m =
    (e as { shortMessage?: string; message?: string })?.shortMessage ||
    (e as { message?: string })?.message ||
    "Transaction failed";
  if (/user rejected|user denied|rejected the request/i.test(m)) return "Transaction rejected in wallet.";
  if (/ReserveTooLow/i.test(m)) return "House reserve too low to back a win right now.";
  if (/InsufficientBalance/i.test(m)) return "Insufficient batutas balance.";
  return m.length > 140 ? m.slice(0, 140) + "…" : m;
}

export default function AppPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { data: latestBlock } = useBlockNumber({ watch: true, chainId: BATUTAS_CHAIN_ID });
  const isMiniPay = useIsMiniPay();

  const [balance, setBalance] = useState(0n);
  const [stakeAmt, setStakeAmt] = useState(25);
  const [winAmt, setWinAmt] = useState(50);

  const [selected, setSelected] = useState<Move | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [openedId, setOpenedId] = useState<number | null>(null);
  const [commitBlock, setCommitBlock] = useState<bigint | null>(null);
  const [houseMove, setHouseMove] = useState<Move | null>(null);
  const [result, setResult] = useState<Outcome | null>(null);
  const [netDelta, setNetDelta] = useState<number | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [modal, setModal] = useState<null | "deposit" | "withdraw">(null);
  const [txPending, setTxPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);

  const secretRef = useRef<`0x${string}` | null>(null);
  const moveNumRef = useRef<number | null>(null);
  const roundId = useRef(1);

  const wrongChain = isConnected && chainId !== BATUTAS_CHAIN_ID;
  const netWin = winAmt - stakeAmt;

  // Loop background music while the player is connected on the right chain.
  // Gated on `mounted` so nothing tries to play during SSR / before hydration.
  const { muted, toggleMute } = useBackgroundMusic(mounted && isConnected && !wrongChain);

  useEffect(() => setMounted(true), []);

  const refresh = useCallback(async (addr: `0x${string}`) => {
    try {
      const base = { address: BATUTAS_ADDRESS, abi: batutasAbi, chainId: BATUTAS_CHAIN_ID } as const;
      const [bal, stk, win] = await Promise.all([
        readContract(wagmiConfig, { ...base, functionName: "balanceOf", args: [addr] }),
        readContract(wagmiConfig, { ...base, functionName: "stake" }),
        readContract(wagmiConfig, { ...base, functionName: "winPayout" }),
      ]);
      setBalance(bal as bigint);
      setStakeAmt(Number(stk));
      setWinAmt(Number(win));
    } catch {
      /* keep last known */
    }
  }, []);

  const startShuffle = useCallback(() => {
    setSelected(null);
    setOpenedId(null);
    setHouseMove(null);
    setResult(null);
    setNetDelta(null);
    setCommitBlock(null);
    setOrder([0, 1, 2]);
    setStatus("shuffling");
  }, []);

  // initial load + resume an in-flight commit
  useEffect(() => {
    if (!mounted || !isConnected || !address || wrongChain) return;
    let cancelled = false;
    (async () => {
      setStatus("loading");
      await refresh(address);
      try {
        const pc = (await readContract(wagmiConfig, {
          address: BATUTAS_ADDRESS,
          abi: batutasAbi,
          chainId: BATUTAS_CHAIN_ID,
          functionName: "pendingCommit",
          args: [address],
        })) as readonly [`0x${string}`, bigint];
        if (cancelled) return;
        const [commitHash, cBlock] = pc;
        if (commitHash && commitHash !== ZERO_HASH) {
          const saved = loadRound(address);
          if (saved) {
            secretRef.current = saved.secret;
            moveNumRef.current = saved.moveNum;
            setSelected(saved.move);
            setCommitBlock(cBlock);
            setStatus("securing");
          } else {
            setCommitBlock(cBlock);
            setStatus("stuck");
          }
        } else {
          startShuffle();
        }
      } catch {
        if (!cancelled) startShuffle();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, isConnected, address, wrongChain, refresh, startShuffle]);

  // securing -> choose once a new block is mined after the commit
  useEffect(() => {
    if (status === "securing" && latestBlock && commitBlock && latestBlock > commitBlock) {
      setStatus("choose");
    }
  }, [status, latestBlock, commitBlock]);

  // shuffle the deck while waiting for a move
  useEffect(() => {
    if (status !== "shuffling") return;
    const t = setInterval(() => setOrder(shuffle3()), 460);
    return () => clearInterval(t);
  }, [status]);

  const commit = async (move: Move) => {
    if (status !== "shuffling" || wrongChain || !address) return;
    if (balance < BigInt(stakeAmt)) {
      setModal("deposit");
      return;
    }
    setGameError(null);
    const secret = makeSecret();
    const moveNum = MOVE_NUM[move];
    const hash = buildCommitHash(moveNum, secret);
    secretRef.current = secret;
    moveNumRef.current = moveNum;
    saveRound(address, { move, moveNum, secret });
    setSelected(move);
    setStatus("committing");
    try {
      const txHash = await writeContractAsync({
        address: BATUTAS_ADDRESS,
        abi: batutasAbi,
        chainId: BATUTAS_CHAIN_ID,
        functionName: "commitMove",
        args: [hash],
      });
      const rcpt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: BATUTAS_CHAIN_ID });
      setCommitBlock(rcpt.blockNumber);
      setStatus("securing");
      refresh(address);
    } catch (e) {
      setGameError(errMsg(e));
      clearRound(address);
      secretRef.current = null;
      moveNumRef.current = null;
      setSelected(null);
      setStatus("shuffling");
    }
  };

  const reveal = async (cardId: number) => {
    if (status !== "choose" || !address) return;
    const secret = secretRef.current;
    const moveNum = moveNumRef.current;
    if (!secret || moveNum === null) {
      setStatus("stuck");
      return;
    }
    setOpenedId(cardId);
    setStatus("revealing");
    setGameError(null);
    try {
      const txHash = await writeContractAsync({
        address: BATUTAS_ADDRESS,
        abi: batutasAbi,
        chainId: BATUTAS_CHAIN_ID,
        functionName: "revealMove",
        args: [moveNum, secret],
      });
      const rcpt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: BATUTAS_CHAIN_ID });
      const evs = parseEventLogs({ abi: batutasAbi, eventName: "Revealed", logs: rcpt.logs });
      const ev = evs.find((l) => l.args.player?.toLowerCase() === address.toLowerCase()) ?? evs[0];
      if (!ev) throw new Error("Result not found on-chain");
      const hMove = NUM_TO_MOVE[Number(ev.args.houseMove)];
      const res = NUM_TO_RESULT[Number(ev.args.result)];
      const net = Number(ev.args.payout) - Number(ev.args.stake);
      setHouseMove(hMove);
      setResult(res);
      setNetDelta(net);
      setStatus("result");
      setHistory((h) =>
        [{ id: roundId.current++, you: selected ?? NUM_TO_MOVE[moveNum], house: hMove, result: res, delta: net }, ...h].slice(0, 24)
      );
      clearRound(address);
      secretRef.current = null;
      moveNumRef.current = null;
      refresh(address);
    } catch (e) {
      setGameError(errMsg(e));
      setStatus("choose");
      setOpenedId(null);
    }
  };

  const refund = async () => {
    if (!address) return;
    setGameError(null);
    setTxPending(true);
    try {
      const txHash = await writeContractAsync({
        address: BATUTAS_ADDRESS,
        abi: batutasAbi,
        chainId: BATUTAS_CHAIN_ID,
        functionName: "claimRefund",
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: BATUTAS_CHAIN_ID });
      clearRound(address);
      secretRef.current = null;
      moveNumRef.current = null;
      await refresh(address);
      startShuffle();
    } catch (e) {
      setGameError(errMsg(e));
    } finally {
      setTxPending(false);
    }
  };

  const doFund = async (kind: "deposit" | "withdraw", batutas: number) => {
    if (!address || batutas <= 0) return;
    setTxError(null);
    setTxPending(true);
    try {
      if (kind === "deposit") {
        await writeContractAsync({
          address: BATUTAS_ADDRESS,
          abi: batutasAbi,
          chainId: BATUTAS_CHAIN_ID,
          functionName: "deposit",
          value: parseEther((batutas / PEG).toString()),
        }).then((h) => waitForTransactionReceipt(wagmiConfig, { hash: h, chainId: BATUTAS_CHAIN_ID }));
      } else {
        await writeContractAsync({
          address: BATUTAS_ADDRESS,
          abi: batutasAbi,
          chainId: BATUTAS_CHAIN_ID,
          functionName: "withdraw",
          args: [BigInt(batutas)],
        }).then((h) => waitForTransactionReceipt(wagmiConfig, { hash: h, chainId: BATUTAS_CHAIN_ID }));
      }
      await refresh(address);
      setModal(null);
    } catch (e) {
      setTxError(errMsg(e));
    } finally {
      setTxPending(false);
    }
  };

  /* ─── gates ─── */
  if (!mounted) {
    return (
      <main className="frame grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-iris/30 border-t-iris" />
      </main>
    );
  }

  if (!isConnected) {
    return (
      <main className="frame grid min-h-screen place-items-center px-6">
        <StarField />
        <div className="relative z-10 max-w-md rounded-3xl glass p-10 text-center">
          <Image src="/batutas-logo.png" alt="BATUTAS" width={56} height={56} className="mx-auto h-14 w-14 drop-shadow-[0_0_16px_rgba(108,92,255,0.6)]" />
          <h1 className="font-display mt-5 text-2xl font-semibold text-white">Connect to play</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            BATUTAS is live on Celo Mainnet. Connect a wallet to deposit CELO, play
            provably-fair Rock·Paper·Scissors on-chain, and withdraw anytime.
          </p>
          {isMiniPay ? (
            <div className="btn-dark mt-7 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-iris/30 border-t-iris" />
              Connecting to MiniPay…
            </div>
          ) : (
            <button onClick={openConnectModal} className="btn-lime mt-7 w-full rounded-full px-6 py-3 text-sm font-semibold">
              Connect Wallet
            </button>
          )}
          <Link href="/" className="mt-4 inline-block text-xs font-medium text-muted transition-colors hover:text-white">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (wrongChain) {
    return (
      <main className="frame grid min-h-screen place-items-center px-6">
        <StarField />
        <div className="relative z-10 max-w-md rounded-3xl glass p-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">Wrong network</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            BATUTAS runs on <span className="text-white">Celo Mainnet</span>. Switch your
            wallet network to continue.
          </p>
          <button
            onClick={() => switchChain({ chainId: BATUTAS_CHAIN_ID })}
            className="btn-lime mt-7 w-full rounded-full px-6 py-3 text-sm font-semibold"
          >
            Switch to Celo
          </button>
          <Link href="/" className="mt-4 inline-block text-xs font-medium text-muted transition-colors hover:text-white">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const balNum = Number(balance);
  const celoEquiv = (balNum / PEG).toLocaleString(undefined, { maximumFractionDigits: 3 });
  const SelIcon = selected ? MOVE_ICON[selected] : null;
  const busy = status === "committing" || status === "securing" || status === "revealing";
  const prompt =
    status === "loading"
      ? "Loading your on-chain state…"
      : status === "shuffling"
        ? balNum < stakeAmt
          ? "Deposit CELO, then pick your move."
          : "Pick your move — this commits your stake on-chain and stops the cards."
        : status === "committing"
          ? "Committing your move on-chain…"
          : status === "securing"
            ? "Securing the round — waiting for the next block…"
            : status === "choose"
              ? "Committed. Tap a card to reveal the house move on-chain."
              : status === "revealing"
                ? "Revealing on-chain…"
                : "";

  return (
    <main className="frame min-h-screen">
      <StarField />

      <header className="relative z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/batutas-logo.png" alt="BATUTAS" width={30} height={30} className="h-7 w-7 drop-shadow-[0_0_10px_rgba(108,92,255,0.55)]" />
            <span className="font-display text-lg font-bold tracking-[0.02em] text-white">BATUTAS</span>
          </Link>
          <span className="hidden rounded-full border border-teal/40 bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-teal sm:inline">
            Celo Mainnet
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute music" : "Mute music"}
            aria-pressed={muted}
            title={muted ? "Unmute music" : "Mute music"}
            className={`grid h-10 w-10 place-items-center rounded-full glass ${muted ? "text-muted" : "text-iris-300"}`}
          >
            {muted ? <SpeakerOff className="h-4 w-4" /> : <SpeakerOn className="h-4 w-4" />}
          </button>
          <div className="hidden items-center gap-2 rounded-full glass px-4 py-2 sm:flex">
            <Coin className="h-4 w-4 text-iris-300" />
            <span className="text-sm font-semibold text-white">{balNum.toLocaleString()}</span>
            <span className="text-xs text-muted">batutas</span>
          </div>
          {isMiniPay ? (
            <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-2 text-xs font-semibold text-lavender">
              <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_8px_2px_rgba(207,255,122,0.8)]" />
              MiniPay{address ? ` · ${address.slice(0, 6)}…${address.slice(-4)}` : ""}
            </span>
          ) : (
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-8">
        {/* live banner */}
        <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-teal/20 bg-teal/[0.06] px-4 py-3 text-xs leading-relaxed text-lavender/85">
          <span className="text-sm text-teal">●</span>
          <span>
            <span className="font-semibold text-teal">Live on Celo Mainnet.</span> Real CELO,
            provably-fair commit–reveal — every round is settled & auditable on-chain.
          </span>
          <a
            href={`${CELO_EXPLORER}/address/${BATUTAS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-teal underline-offset-2 hover:underline"
          >
            {SHORT}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {gameError && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {gameError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* ── game board ── */}
          <section className="rounded-3xl glass p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">Open the house&apos;s hand</h2>
              <span className="text-xs font-medium text-muted">
                stake <span className="text-white">{stakeAmt}</span> · win{" "}
                <span className="text-lime">+{netWin}</span>
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <span className="text-muted">Your move:</span>
              {SelIcon ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-iris/40 bg-iris/15 px-3 py-1 font-semibold text-white">
                  <SelIcon className="h-4 w-4" /> {MOVE_LABEL[selected!]}
                </span>
              ) : (
                <span className="text-lavender/60">— pick below</span>
              )}
            </div>

            {status === "stuck" ? (
              <StuckPanel onRefund={refund} pending={txPending} onReset={() => address && startShuffle()} />
            ) : (
              <>
                {/* deck */}
                <div className="deck mx-auto mt-6 h-[clamp(170px,40vw,230px)] w-full max-w-[440px]">
                  {[0, 1, 2].map((id, i) => {
                    const slot = order[i];
                    const flipped = openedId === id && status === "result";
                    const dimmed = openedId !== null && openedId !== id;
                    const clickable = status === "choose";
                    const HIcon = houseMove ? MOVE_ICON[houseMove] : null;
                    const tone =
                      result === "win"
                        ? "from-[#26341a] to-[#101b08] ring-2 ring-lime/70"
                        : result === "lose"
                          ? "from-[#3a1620] to-[#1a0a10] ring-2 ring-rose-400/70"
                          : "from-[#221e52] to-[#0d0a34] ring-2 ring-lavender/60";
                    return (
                      <div key={id} className="card-slot" style={{ transform: `translateX(calc(${slot} * (100% + 16px)))` }}>
                        <div className={`card-jiggle ${status === "shuffling" ? "shuffling" : ""}`} style={{ animationDelay: `${i * 0.18}s` }}>
                          <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => reveal(id)}
                            aria-label={clickable ? "Reveal this card" : "Card"}
                            className={`block h-full w-full transition-transform ${clickable ? "cursor-pointer hover:-translate-y-2" : "cursor-default"} ${dimmed ? "opacity-45" : ""}`}
                            style={{ perspective: "1000px" }}
                          >
                            <div className={`card-flip ${flipped ? "flipped" : ""}`}>
                              <div className="card-face">
                                <CardBack glow={clickable} />
                              </div>
                              <div className={`card-face front grid place-items-center border border-white/10 bg-gradient-to-br ${tone}`}>
                                {HIcon && <HIcon className="h-16 w-16 text-white" />}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* prompt / result */}
                {status === "result" && result ? (
                  <ResultBanner result={result} delta={netDelta ?? 0} />
                ) : (
                  <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted">
                    {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-iris/30 border-t-iris" />}
                    {prompt}
                  </p>
                )}

                {/* move picker */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {MOVES.map((m) => {
                    const Icon = MOVE_ICON[m];
                    const active = selected === m;
                    const locked = status !== "shuffling" || balNum < stakeAmt;
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={locked}
                        onClick={() => commit(m)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-5 transition-all disabled:opacity-50 ${
                          active
                            ? "border-iris bg-iris/20 text-white"
                            : "border-lavender/12 bg-white/[0.03] text-lavender enabled:hover:-translate-y-0.5 enabled:hover:border-iris/50"
                        }`}
                      >
                        <Icon className="h-8 w-8" />
                        <span className="text-sm font-semibold">{MOVE_LABEL[m]}</span>
                      </button>
                    );
                  })}
                </div>

                {status === "result" ? (
                  <button onClick={startShuffle} className="btn-lime mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold">
                    Play again
                  </button>
                ) : balNum < stakeAmt && status === "shuffling" ? (
                  <button onClick={() => setModal("deposit")} className="btn-lime mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold">
                    Deposit to play
                  </button>
                ) : null}
              </>
            )}
          </section>

          {/* ── sidebar ── */}
          <aside className="space-y-6">
            <section className="rounded-3xl glass p-6">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-iris-300">Balance</span>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-4xl font-semibold leading-none text-white">{balNum.toLocaleString()}</span>
                <span className="pb-1 text-sm text-muted">batutas</span>
              </div>
              <p className="mt-1 text-xs text-muted">≈ {celoEquiv} CELO · peg 1 CELO = {PEG}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => { setTxError(null); setModal("deposit"); }} className="btn-lime rounded-full px-4 py-2.5 text-sm font-semibold">
                  Deposit
                </button>
                <button
                  onClick={() => { setTxError(null); setModal("withdraw"); }}
                  disabled={balNum <= 0}
                  className="btn-dark rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                >
                  Withdraw
                </button>
              </div>
            </section>

            <section className="rounded-3xl glass p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-iris-300">History</span>
                <span className="text-xs text-muted">{history.length} rounds</span>
              </div>
              {history.length === 0 ? (
                <p className="mt-5 text-sm text-muted">No rounds yet. Pick a move and open a card to play your first on-chain round.</p>
              ) : (
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {history.map((r) => (
                    <HistoryRow key={r.id} round={r} />
                  ))}
                </ul>
              )}
            </section>

            <div className="flex items-start gap-3 rounded-2xl border border-lavender/10 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-iris-300" />
              <p>
                Two on-chain steps per round: <span className="text-lavender">commit</span> (lock
                stake) then <span className="text-lavender">reveal</span>. The house move is derived
                from the commit block hash — neither side can rig the deck.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {modal && (
        <FundModal
          kind={modal}
          balance={balNum}
          pending={txPending}
          error={txError}
          onClose={() => !txPending && setModal(null)}
          onConfirm={(batutas) => doFund(modal, batutas)}
        />
      )}
    </main>
  );
}

/* ─────────── subcomponents ─────────── */

function CardBack({ glow }: { glow?: boolean }) {
  return (
    <div className="relative h-full w-full rounded-[18px] border border-iris/45 bg-gradient-to-br from-[#271c84] via-[#1a1160] to-[#0e0a38]">
      <div className="absolute inset-[6px] rounded-[13px] border border-teal/25" />
      <svg viewBox="0 0 120 168" className="absolute inset-0 h-full w-full opacity-90" aria-hidden>
        <g fill="none" stroke="#6c5cff" strokeWidth="1" opacity="0.55">
          <circle cx="60" cy="84" r="46" />
          <circle cx="60" cy="84" r="34" />
          <circle cx="60" cy="84" r="22" />
        </g>
        <g stroke="#5fe0d6" strokeWidth="1.1" opacity="0.7" fill="none">
          <path d="M60 40 L66 78 L104 84 L66 90 L60 128 L54 90 L16 84 L54 78 Z" />
          <path d="M60 52 L63 81 L88 84 L63 87 L60 116 L57 87 L32 84 L57 81 Z" />
        </g>
        <circle cx="60" cy="84" r="5" fill="#5fe0d6" />
        <g fill="#b8aeff" opacity="0.7">
          <circle cx="60" cy="20" r="1.6" />
          <circle cx="60" cy="148" r="1.6" />
          <circle cx="18" cy="30" r="1.2" />
          <circle cx="102" cy="30" r="1.2" />
          <circle cx="18" cy="138" r="1.2" />
          <circle cx="102" cy="138" r="1.2" />
        </g>
      </svg>
      {glow && <div className="absolute inset-0 rounded-[18px] ring-1 ring-iris/50 anim-beacon" />}
    </div>
  );
}

function ResultBanner({ result, delta }: { result: Outcome; delta: number }) {
  const sign = delta > 0 ? `+${delta}` : `${delta}`;
  const map = {
    win: { text: `You win  ${sign} batutas`, cls: "border-lime/40 bg-lime/10 text-lime" },
    lose: { text: `You lose  ${sign} batutas`, cls: "border-rose-400/40 bg-rose-500/10 text-rose-300" },
    draw: { text: "Draw  stake returned", cls: "border-lavender/30 bg-lavender/10 text-lavender" },
  }[result];
  return <div className={`mt-6 rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${map.cls}`}>{map.text}</div>;
}

function HistoryRow({ round }: { round: Round }) {
  const You = MOVE_ICON[round.you];
  const House = MOVE_ICON[round.house];
  const tone = round.result === "win" ? "text-lime" : round.result === "lose" ? "text-rose-300" : "text-lavender";
  return (
    <li className="flex items-center justify-between rounded-2xl border border-lavender/8 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2 text-lavender">
        <You className="h-4 w-4" />
        <span className="text-xs text-muted">vs</span>
        <House className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold capitalize ${tone}`}>{round.result}</span>
        <span className={`w-12 text-right text-sm font-semibold ${round.delta > 0 ? "text-lime" : round.delta < 0 ? "text-rose-300" : "text-muted"}`}>
          {round.delta > 0 ? "+" : ""}
          {round.delta}
        </span>
      </div>
    </li>
  );
}

function StuckPanel({ onRefund, onReset, pending }: { onRefund: () => void; onReset: () => void; pending: boolean }) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100/90">
      <p className="font-semibold text-amber-200">Unrevealed round found</p>
      <p className="mt-2 leading-relaxed">
        You have a committed round on-chain but its secret isn&apos;t in this browser, so it can&apos;t
        be revealed. You can reclaim the staked batutas with <span className="font-semibold">claimRefund</span>{" "}
        once the 200-block reveal window has passed.
      </p>
      <div className="mt-4 flex gap-3">
        <button onClick={onRefund} disabled={pending} className="btn-lime rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
          {pending ? "Claiming…" : "Claim refund"}
        </button>
        <button onClick={onReset} disabled={pending} className="btn-dark rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
          Dismiss
        </button>
      </div>
    </div>
  );
}

function FundModal({
  kind,
  balance,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  kind: "deposit" | "withdraw";
  balance: number;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (batutas: number) => void;
}) {
  const isDeposit = kind === "deposit";
  const [celo, setCelo] = useState(isDeposit ? "1" : "");
  const raw = Math.max(0, Math.round((parseFloat(celo) || 0) * PEG));
  const amountBatutas = isDeposit ? raw : Math.min(balance, raw);
  const presets = [0.1, 0.5, 1];
  const maxCelo = balance / PEG;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-3xl glass p-7">
        <h3 className="font-display text-xl font-semibold text-white">{isDeposit ? "Deposit CELO" : "Withdraw to CELO"}</h3>
        <p className="mt-1 text-xs text-muted">
          {isDeposit
            ? `Sends real CELO at 1 CELO = ${PEG} batutas.`
            : `Available: ${balance.toLocaleString()} batutas (≈ ${maxCelo.toLocaleString(undefined, { maximumFractionDigits: 3 })} CELO).`}
        </p>

        <label className="mt-5 block text-[11px] font-semibold uppercase tracking-widest text-iris-300">Amount (CELO)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={celo}
          disabled={pending}
          onChange={(e) => setCelo(e.target.value)}
          placeholder="0.0"
          className="mt-2 w-full rounded-2xl border border-lavender/15 bg-[#0d0a34] px-4 py-3 text-lg font-semibold text-white outline-none focus:border-iris disabled:opacity-60"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {(isDeposit ? presets.map(String) : [String(maxCelo)]).map((p) => (
            <button
              key={p}
              disabled={pending}
              onClick={() => setCelo(p)}
              className="rounded-full border border-lavender/15 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-lavender transition-colors hover:border-iris/50 disabled:opacity-50"
            >
              {isDeposit ? `${p} CELO` : "Max"}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted">
          You {isDeposit ? "receive" : "redeem"} <span className="font-semibold text-white">{amountBatutas.toLocaleString()}</span> batutas
        </p>

        {error && <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={pending} className="btn-dark flex-1 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(amountBatutas)}
            disabled={amountBatutas <= 0 || pending}
            className="btn-lime flex-1 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            {pending ? "Confirm in wallet…" : isDeposit ? "Deposit" : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}
