import { Wallet, Hand, Link2, ArrowUpRight } from "./icons";
import type { ComponentType, SVGProps } from "react";

type Step = {
  no: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
};

const STEPS: Step[] = [
  { no: "01", icon: Wallet, title: "Deposit CELO", desc: "Send CELO and receive in-game batutas at 1 CELO = 1000." },
  { no: "02", icon: Hand, title: "Pick R / P / S", desc: "Lock in your move — rock, paper or scissors — behind the hidden card." },
  { no: "03", icon: Link2, title: "Settle on-chain", desc: "commit + reveal decides the house move. Win +50 · Draw push · Lose −25." },
  { no: "04", icon: ArrowUpRight, title: "Withdraw", desc: "Convert batutas back to CELO and cash out at any time." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative z-10 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div data-reveal className="mx-auto max-w-xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-iris-300">
            How it works
          </span>
          <h2 className="font-display mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-medium leading-tight text-white">
            From deposit to payout
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            A frictionless loop designed for MiniPay — the on-screen shuffle is
            just sugar, the chain is the source of truth.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* connecting line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px lg:block">
            <div className="divider-glow h-px" />
          </div>

          {STEPS.map(({ no, icon: Icon, title, desc }, i) => (
            <div
              key={no}
              data-reveal
              style={{ transitionDelay: `${i * 100}ms` }}
              className="relative text-center lg:text-left"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl glass text-lavender lg:mx-0">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-5 font-display text-sm font-semibold tracking-widest text-iris-300">
                {no}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
              <p className="mx-auto mt-2 max-w-[15rem] text-sm leading-relaxed text-muted lg:mx-0">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
