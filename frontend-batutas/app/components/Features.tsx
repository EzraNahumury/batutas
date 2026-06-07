import { ShieldCheck, Tap, Coin, Pulse } from "./icons";
import type { ComponentType, SVGProps } from "react";

type Feature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  sub: string;
  desc: string;
};

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Provably Fair",
    sub: "Commit–reveal · VRF-ready",
    desc: "Every outcome is verifiable on-chain. The house cannot react to your move, and you cannot change yours after the reveal.",
  },
  {
    icon: Tap,
    title: "One-Tap UX",
    sub: "Built for MiniPay",
    desc: "Auto-connects inside Opera's MiniPay wallet. Single-tap, low-cost transactions with clear pending and confirmed states.",
  },
  {
    icon: Coin,
    title: "Batutas Balance",
    sub: "Pegged to CELO",
    desc: "Deposit CELO and play with in-app batutas at a transparent 1 CELO = 1000 peg. Cash out back to CELO whenever you like.",
  },
  {
    icon: Pulse,
    title: "On-Chain History",
    sub: "Every round auditable",
    desc: "Deposits, commits, reveals and withdrawals all emit events — a fully transparent, auditable record of play.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative z-10 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div data-reveal className="max-w-xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-iris-300">
            What we build
          </span>
          <h2 className="font-display mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-medium leading-tight text-white">
            Inside BATUTAS
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, sub, desc }, i) => (
            <div
              key={title}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              className="group"
            >
              <div className="tile flex h-12 w-12 items-center justify-center rounded-2xl border border-iris/30 bg-gradient-to-br from-iris/30 to-azure/10 text-lavender shadow-[0_8px_24px_-10px_rgba(108,92,255,0.7)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-iris-300">
                {sub}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
