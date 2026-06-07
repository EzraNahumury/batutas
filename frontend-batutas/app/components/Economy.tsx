type Stat = { value: string; unit?: string; label: string };

const STATS: Stat[] = [
  { value: "1", unit: ": 1000", label: "CELO to batutas peg" },
  { value: "−25", label: "Stake per play" },
  { value: "+50", label: "Win payout" },
  { value: "≈ 0", label: "Expected value · near-fair" },
];

export default function Economy() {
  return (
    <section className="relative z-10 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div data-reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl glass lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[rgba(13,9,54,0.6)] px-6 py-8 text-center">
              <div className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-none text-white">
                {s.value}
                {s.unit && <span className="text-lavender/60">{s.unit}</span>}
              </div>
              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <p data-reveal style={{ transitionDelay: "120ms" }} className="mt-4 text-center text-xs text-muted/80">
          A draw returns your stake (push). A small house rake funds the prize
          reserve and gas — tuned to keep the game sustainable, not to bleed
          players.
        </p>
      </div>
    </section>
  );
}
