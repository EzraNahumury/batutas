type Phase = { week: string; theme: string; glyph: string; goal: string };

const PHASES: Phase[] = [
  { week: "Week 1", theme: "Scope", glyph: "◆", goal: "Lock the economy & fairness model, finalize commit–reveal design and wireframes." },
  { week: "Week 2", theme: "Ship", glyph: "⚡", goal: "Contracts on Sepolia plus a working frontend — a playable demo, built in public." },
  { week: "Week 3", theme: "Refine", glyph: "◎", goal: "Deploy & verify on mainnet, add analytics, gather feedback — real users, real txs." },
  { week: "Week 4", theme: "Present", glyph: "★", goal: "Polish the UX, record the demo and define growth — final leaderboard snapshot." },
];

const FUTURE = ["VRF randomness", "PvP / tournaments", "Leaderboard & streaks", "Daily free play"];

export default function Roadmap() {
  return (
    <section id="roadmap" className="relative z-10 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div data-reveal className="mx-auto max-w-xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-iris-300">
            Roadmap
          </span>
          <h2 className="font-display mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-medium leading-tight text-white">
            Mapped to Proof of Ship
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            A monthly rhythm built for Celo&apos;s Proof of Ship — Season 2.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((p, i) => (
            <div
              key={p.week}
              data-reveal
              style={{ transitionDelay: `${i * 100}ms` }}
              className="tile rounded-3xl glass p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                  {p.week}
                </span>
                <span className="text-lg text-iris">{p.glyph}</span>
              </div>
              <h3 className="font-display mt-3 text-xl font-semibold text-white">
                {p.theme}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.goal}</p>
            </div>
          ))}
        </div>

        <div data-reveal className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-iris-300">
            Beyond
          </span>
          {FUTURE.map((f) => (
            <span
              key={f}
              className="rounded-full border border-lavender/15 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-lavender/85"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
