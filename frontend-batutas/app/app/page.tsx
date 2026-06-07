"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import StarField from "../components/StarField";
import { Rock, Paper, Scissors, Coin, ArrowUpRight, ShieldCheck } from "../components/icons";
import type { ComponentType, SVGProps } from "react";

/* ─── game constants (mirror README economy) ─── */
const PEG = 1000; // 1 CELO = 1000 batutas
const STAKE = 25;
const WIN_PAYOUT = 50;

type Move = "rock" | "paper" | "scissors";
type Outcome = "win" | "lose" | "draw";
type Status = "shuffling" | "choose" | "revealing" | "result";
type Card = { id: number; move: Move };

const MOVES: Move[] = ["rock", "paper", "scissors"];
const MOVE_INDEX: Record<Move, number> = { rock: 0, paper: 1, scissors: 2 };
const MOVE_LABEL: Record<Move, string> = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
const MOVE_ICON: Record<Move, ComponentType<SVGProps<SVGSVGElement>>> = {
  rock: Rock,
  paper: Paper,
  scissors: Scissors,
};

function decide(you: Move, house: Move): Outcome {
  const d = (MOVE_INDEX[you] - MOVE_INDEX[house] + 3) % 3;
  return d === 0 ? "draw" : d === 1 ? "win" : "lose";
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeCards(): Card[] {
  return shuffle(MOVES).map((m, i) => ({ id: i, move: m }));
}

type Round = { id: number; you: Move; house: Move; result: Outcome; delta: number };

export default function AppPage() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<Move | null>(null);
  const [status, setStatus] = useState<Status>("shuffling");
  const [cards, setCards] = useState<Card[]>(() => MOVES.map((m, i) => ({ id: i, move: m })));
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [openedId, setOpenedId] = useState<number | null>(null);
  const [result, setResult] = useState<Outcome | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [modal, setModal] = useState<null | "deposit" | "withdraw">(null);
  const roundId = useRef(1);

  // randomize the deck after mount (avoids SSR/client mismatch)
  useEffect(() => {
    setMounted(true);
    setCards(makeCards());
  }, []);

  // keep cards drifting between slots while shuffling
  useEffect(() => {
    if (status !== "shuffling") return;
    const t = setInterval(() => setOrder(shuffle([0, 1, 2])), 460);
    return () => clearInterval(t);
  }, [status]);

  const pickMove = (m: Move) => {
    if (status !== "shuffling" || balance < STAKE) return;
    setSelected(m);
    setBalance((b) => b - STAKE); // commit: lock stake
    setStatus("choose");
  };

  const openCard = (id: number) => {
    if (status !== "choose" || !selected) return;
    const houseMove = cards.find((c) => c.id === id)!.move;
    const outcome = decide(selected, houseMove);
    setOpenedId(id);
    setStatus("revealing");
    window.setTimeout(() => {
      const payout = outcome === "win" ? WIN_PAYOUT : outcome === "draw" ? STAKE : 0;
      setBalance((b) => b + payout);
      setResult(outcome);
      setStatus("result");
      setHistory((h) =>
        [{ id: roundId.current++, you: selected, house: houseMove, result: outcome, delta: payout - STAKE }, ...h].slice(0, 24)
      );
    }, 760);
  };

  const playAgain = () => {
    setCards(makeCards());
    setOrder([0, 1, 2]);
    setSelected(null);
    setOpenedId(null);
    setResult(null);
    setStatus("shuffling");
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
            BATUTAS runs on Celo. Connect a wallet to deposit, play provably-fair
            Rock·Paper·Scissors, and withdraw anytime.
          </p>
          <button onClick={openConnectModal} className="btn-lime mt-7 w-full rounded-full px-6 py-3 text-sm font-semibold">
            Connect Wallet
          </button>
          <Link href="/" className="mt-4 inline-block text-xs font-medium text-muted transition-colors hover:text-white">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const celoEquiv = (balance / PEG).toLocaleString(undefined, { maximumFractionDigits: 3 });
  const SelIcon = selected ? MOVE_ICON[selected] : null;
  const prompt =
    status === "shuffling"
      ? balance < STAKE
        ? "Deposit batutas, then pick your move to lock in."
        : "Pick your move below — that locks your stake and stops the cards."
      : status === "choose"
        ? "Cards locked. Tap one to reveal the house move."
        : status === "revealing"
          ? "Revealing…"
          : "";

  return (
    <main className="frame min-h-screen">
      <StarField />

      {/* top bar */}
      <header className="relative z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/batutas-logo.png" alt="BATUTAS" width={30} height={30} className="h-7 w-7 drop-shadow-[0_0_10px_rgba(108,92,255,0.55)]" />
            <span className="font-display text-lg font-bold tracking-[0.02em] text-white">BATUTAS</span>
          </Link>
          <span className="rounded-full border border-lime/40 bg-lime/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-lime">
            Demo
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full glass px-4 py-2 sm:flex">
            <Coin className="h-4 w-4 text-iris-300" />
            <span className="text-sm font-semibold text-white">{balance.toLocaleString()}</span>
            <span className="text-xs text-muted">batutas</span>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-8">
        {/* demo banner */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-lime/25 bg-lime/[0.06] px-4 py-3 text-xs leading-relaxed text-lavender/85">
          <span className="mt-0.5 text-sm text-lime">●</span>
          <p>
            <span className="font-semibold text-lime">Demo mode.</span> Outcomes are
            simulated locally — no real funds move and nothing is written on-chain yet.
            Live rounds settle via on-chain commit–reveal once the BATUTAS contract ships.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* ── game board ── */}
          <section className="rounded-3xl glass p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">Open the house&apos;s hand</h2>
              <span className="text-xs font-medium text-muted">
                stake <span className="text-white">{STAKE}</span> · win <span className="text-lime">+{WIN_PAYOUT}</span>
              </span>
            </div>

            {/* your move chip */}
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

            {/* shuffling deck */}
            <div className="deck mx-auto mt-6 h-[clamp(170px,40vw,230px)] w-full max-w-[440px]">
              {cards.map((c, i) => {
                const slot = order[i];
                const flipped = openedId === c.id;
                const Icon = MOVE_ICON[c.move];
                const clickable = status === "choose";
                const dimmed = openedId !== null && !flipped;
                const frontTone =
                  flipped && result === "win"
                    ? "from-[#26341a] to-[#101b08] ring-2 ring-lime/70"
                    : flipped && result === "lose"
                      ? "from-[#3a1620] to-[#1a0a10] ring-2 ring-rose-400/70"
                      : flipped && result === "draw"
                        ? "from-[#221e52] to-[#0d0a34] ring-2 ring-lavender/60"
                        : "from-[#211569] to-[#0d0a34] ring-1 ring-lavender/15";
                return (
                  <div
                    key={c.id}
                    className="card-slot"
                    style={{ transform: `translateX(calc(${slot} * (100% + 16px)))` }}
                  >
                    <div
                      className={`card-jiggle ${status === "shuffling" ? "shuffling" : ""}`}
                      style={{ animationDelay: `${i * 0.18}s` }}
                    >
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => openCard(c.id)}
                        aria-label={clickable ? "Reveal this card" : "Card"}
                        className={`block h-full w-full transition-transform ${clickable ? "cursor-pointer hover:-translate-y-2" : "cursor-default"} ${dimmed ? "opacity-45" : ""}`}
                        style={{ perspective: "1000px" }}
                      >
                        <div className={`card-flip ${flipped ? "flipped" : ""}`}>
                          {/* face-down */}
                          <div className="card-face">
                            <CardBack glow={clickable} />
                          </div>
                          {/* revealed move */}
                          <div className={`card-face front grid place-items-center border border-white/10 bg-gradient-to-br ${frontTone}`}>
                            <Icon className="h-16 w-16 text-white" />
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
              <ResultBanner result={result} />
            ) : (
              <p className="mt-6 text-center text-xs text-muted">{prompt}</p>
            )}

            {/* move picker */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {MOVES.map((m) => {
                const Icon = MOVE_ICON[m];
                const active = selected === m;
                const locked = status !== "shuffling" || balance < STAKE;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={locked}
                    onClick={() => pickMove(m)}
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

            {/* action */}
            {status === "result" ? (
              <button onClick={playAgain} className="btn-lime mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold">
                Play again
              </button>
            ) : balance < STAKE ? (
              <button onClick={() => setModal("deposit")} className="btn-lime mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold">
                Deposit to play
              </button>
            ) : null}
          </section>

          {/* ── sidebar ── */}
          <aside className="space-y-6">
            {/* balance */}
            <section className="rounded-3xl glass p-6">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-iris-300">Balance</span>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-4xl font-semibold leading-none text-white">{balance.toLocaleString()}</span>
                <span className="pb-1 text-sm text-muted">batutas</span>
              </div>
              <p className="mt-1 text-xs text-muted">≈ {celoEquiv} CELO · peg 1 CELO = {PEG}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setModal("deposit")} className="btn-lime rounded-full px-4 py-2.5 text-sm font-semibold">
                  Deposit
                </button>
                <button
                  onClick={() => setModal("withdraw")}
                  disabled={balance <= 0}
                  className="btn-dark rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                >
                  Withdraw
                </button>
              </div>
            </section>

            {/* history */}
            <section className="rounded-3xl glass p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-iris-300">History</span>
                <span className="text-xs text-muted">{history.length} rounds</span>
              </div>
              {history.length === 0 ? (
                <p className="mt-5 text-sm text-muted">No rounds yet. Pick a move and open a card to start your record.</p>
              ) : (
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {history.map((r) => (
                    <HistoryRow key={r.id} round={r} />
                  ))}
                </ul>
              )}
            </section>

            {/* fairness note */}
            <div className="flex items-start gap-3 rounded-2xl border border-lavender/10 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-iris-300" />
              <p>
                On-chain, the three cards are a <span className="text-lavender">commit–reveal</span> draw — the
                house move is derived from the block hash, so the deck can&apos;t be rigged.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {modal && (
        <FundModal
          kind={modal}
          balance={balance}
          onClose={() => setModal(null)}
          onConfirm={(batutas) => {
            if (modal === "deposit") setBalance((b) => b + batutas);
            else setBalance((b) => Math.max(0, b - batutas));
            setModal(null);
          }}
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

function ResultBanner({ result }: { result: Outcome }) {
  const map = {
    win: { text: "You win  +50 batutas", cls: "border-lime/40 bg-lime/10 text-lime" },
    lose: { text: "You lose  −25 batutas", cls: "border-rose-400/40 bg-rose-500/10 text-rose-300" },
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

function FundModal({
  kind,
  balance,
  onClose,
  onConfirm,
}: {
  kind: "deposit" | "withdraw";
  balance: number;
  onClose: () => void;
  onConfirm: (batutas: number) => void;
}) {
  const isDeposit = kind === "deposit";
  const [celo, setCelo] = useState(isDeposit ? "1" : "");
  const amountBatutas = isDeposit
    ? Math.max(0, Math.round((parseFloat(celo) || 0) * PEG))
    : Math.min(balance, Math.max(0, Math.round((parseFloat(celo) || 0) * PEG)));
  const presets = [0.1, 0.5, 1];
  const maxCelo = balance / PEG;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-3xl glass p-7">
        <h3 className="font-display text-xl font-semibold text-white">{isDeposit ? "Deposit CELO" : "Withdraw to CELO"}</h3>
        <p className="mt-1 text-xs text-muted">
          {isDeposit
            ? `Credited at 1 CELO = ${PEG} batutas.`
            : `Available: ${balance.toLocaleString()} batutas (≈ ${maxCelo.toLocaleString(undefined, { maximumFractionDigits: 3 })} CELO).`}{" "}
          Demo — no real transaction.
        </p>

        <label className="mt-5 block text-[11px] font-semibold uppercase tracking-widest text-iris-300">Amount (CELO)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={celo}
          onChange={(e) => setCelo(e.target.value)}
          placeholder="0.0"
          className="mt-2 w-full rounded-2xl border border-lavender/15 bg-[#0d0a34] px-4 py-3 text-lg font-semibold text-white outline-none focus:border-iris"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {isDeposit ? (
            presets.map((p) => (
              <button
                key={p}
                onClick={() => setCelo(String(p))}
                className="rounded-full border border-lavender/15 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-lavender transition-colors hover:border-iris/50"
              >
                {p} CELO
              </button>
            ))
          ) : (
            <button
              onClick={() => setCelo(String(maxCelo))}
              className="rounded-full border border-lavender/15 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-lavender transition-colors hover:border-iris/50"
            >
              Max
            </button>
          )}
        </div>

        <p className="mt-4 text-sm text-muted">
          You {isDeposit ? "receive" : "redeem"}{" "}
          <span className="font-semibold text-white">{amountBatutas.toLocaleString()}</span> batutas
        </p>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-dark flex-1 rounded-full px-4 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(amountBatutas)}
            disabled={amountBatutas <= 0}
            className="btn-lime flex-1 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            {isDeposit ? "Deposit" : "Withdraw"}
            <ArrowUpRight className="ml-1 inline h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
