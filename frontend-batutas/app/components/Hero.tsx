import HeroScene from "./HeroScene";
import LaunchButton from "./LaunchButton";
import { ArrowUpRight } from "./icons";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 pt-16 sm:pt-20">
      {/* background illustration */}
      <HeroScene />

      {/* floating paper-plane craft (top-right) — nods to "Kertas / Paper" */}
      <div
        className="animate-float absolute right-[7%] top-[20%] z-10 hidden w-28 sm:block lg:w-36"
        style={{ animationDelay: "0.4s" }}
      >
        <PaperCraft />
      </div>

      {/* content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <span
          className="reveal glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-lavender"
          style={{ animationDelay: "0s" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_10px_2px_rgba(207,255,122,0.8)]" />
          Provably fair · Celo Mainnet · MiniPay
        </span>

        <h1 className="font-display mt-7 text-white text-glow">
          <span
            className="reveal block text-[clamp(2.4rem,6.4vw,4.6rem)] font-medium leading-[1.05] tracking-tight"
            style={{ animationDelay: "0.08s" }}
          >
            Rock. Paper. Scissors.
          </span>
          <span
            className="reveal block text-[clamp(2.4rem,6.4vw,4.6rem)] font-medium leading-[1.05] tracking-tight"
            style={{ animationDelay: "0.16s" }}
          >
            Settled <span className="text-lime">on-chain.</span>
          </span>
        </h1>

        <p
          className="reveal mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base"
          style={{ animationDelay: "0.28s" }}
        >
          Deposit CELO, play instantly, and withdraw anytime. Every move is
          decided by a provably-fair commit–reveal scheme — so neither you nor
          the house can ever cheat.
        </p>

        <div
          className="reveal mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "0.4s" }}
        >
          <LaunchButton className="btn-lime rounded-full px-7 py-3 text-sm font-semibold">
            Launch Game
          </LaunchButton>
          <a
            href="#how"
            className="btn-dark group inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold"
          >
            How it works
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <p
          className="reveal mt-5 text-xs font-medium tracking-wide text-muted"
          style={{ animationDelay: "0.48s" }}
        >
          🚧 Work in progress — demo coming soon · building in public for Celo Proof of Ship
        </p>
      </div>

      {/* spacer that lets the scene breathe like the reference */}
      <div className="h-[clamp(320px,46vw,640px)]" />
    </section>
  );
}

function PaperCraft() {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 160 120" fill="none" className="w-full drop-shadow-[0_14px_30px_rgba(8,9,40,0.6)]">
      <defs>
        <linearGradient id="craftBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eef0ff" />
          <stop offset="100%" stopColor="#b9b4ff" />
        </linearGradient>
        <linearGradient id="craftShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9a93e6" />
          <stop offset="100%" stopColor="#6c5cff" />
        </linearGradient>
      </defs>
      {/* origami paper-plane / jet */}
      <path d="M8 60 L150 30 L96 64 Z" fill="url(#craftBody)" />
      <path d="M96 64 L150 30 L120 92 Z" fill="url(#craftShade)" />
      <path d="M8 60 L96 64 L60 78 Z" fill="#cfccff" />
      <path d="M96 64 L120 92 L72 80 Z" fill="#8e88e8" />
      {/* cockpit glow */}
      <circle cx="118" cy="52" r="4" fill="#5fe0d6" />
      {/* exhaust trail */}
      <path d="M8 60 C -14 56 -28 62 -44 58" stroke="rgba(95,224,214,0.5)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
