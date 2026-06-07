import { Lock, Reveal, Scale } from "./icons";
import type { ComponentType, SVGProps } from "react";

type Phase = {
  step: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
};

const PHASES: Phase[] = [
  {
    step: "Commit",
    icon: Lock,
    title: "You commit a hash",
    desc: "Submit keccak256(move, secret) plus your stake. The chain hasn't produced the commit block's hash yet — nothing is predictable.",
  },
  {
    step: "Reveal",
    icon: Reveal,
    title: "You reveal move + secret",
    desc: "The contract verifies your hash, then derives the house move from blockhash(commitBlock) combined with your secret.",
  },
  {
    step: "Settle",
    icon: Scale,
    title: "On-chain settlement",
    desc: "Win, Lose or Draw is decided and applied to your balance — the contract is the sole source of truth, never the animation.",
  },
];

export default function Fairness() {
  return (
    <section id="fairness" className="relative z-10 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* left copy */}
          <div data-reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-iris-300">
              Provably-fair randomness
            </span>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-medium leading-tight text-white">
              Nobody can cheat — not even the house
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              On a public chain, everything the contract knows is public — so the
              house can&apos;t keep a secret. A two-step{" "}
              <span className="text-lavender">commit–reveal</span> flow makes the
              player unable to change their move after seeing the house, and the
              house unable to react to the player.
            </p>
            <p className="mt-4 inline-flex items-start gap-2 rounded-2xl glass px-4 py-3 text-xs leading-relaxed text-lavender/80">
              <span className="mt-0.5 text-lime">▲</span>
              For real-money mainnet, block-hash randomness upgrades to a{" "}
              <span className="text-white">Verifiable Random Function (VRF)</span>{" "}
              before handling meaningful value.
            </p>
          </div>

          {/* right phases */}
          <div className="space-y-4">
            {PHASES.map(({ step, icon: Icon, title, desc }, i) => (
              <div
                key={step}
                data-reveal
                style={{ transitionDelay: `${i * 90}ms` }}
                className="tile flex gap-4 rounded-3xl glass p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-iris/30 bg-iris/15 text-lavender">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-semibold uppercase tracking-widest text-iris-300">
                      {String(i + 1).padStart(2, "0")} · {step}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
