const STACK = [
  { name: "Celo Mainnet", note: "L2 settlement" },
  { name: "Solidity + Hardhat", note: "verified contracts" },
  { name: "viem / wagmi", note: "MiniPay-safe web3" },
  { name: "Next.js + Tailwind", note: "mobile-first UI" },
  { name: "MiniPay", note: "injected wallet" },
  { name: "Vercel", note: "hosting" },
];

export default function TechStack() {
  return (
    <section className="relative z-10 px-6 py-16">
      <div data-reveal className="mx-auto max-w-5xl text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-iris-300">
          Built with
        </span>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {STACK.map((s, i) => (
            <div
              key={s.name}
              data-reveal
              style={{ transitionDelay: `${i * 70}ms` }}
              className="tile rounded-2xl glass px-5 py-3 text-left"
            >
              <div className="text-sm font-semibold text-white">{s.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted">
                {s.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
