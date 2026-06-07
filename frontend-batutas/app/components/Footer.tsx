import Image from "next/image";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Game",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Fairness", href: "#fairness" },
      { label: "Features", href: "#features" },
      { label: "Roadmap", href: "#roadmap" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Celo Docs", href: "https://docs.celo.org/" },
      { label: "Celopedia", href: "https://celopedia.celo.org/" },
      { label: "MiniPay", href: "https://www.opera.com/products/minipay" },
      { label: "Proof of Ship", href: "https://celo.org/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-lavender/10 px-6 pb-10 pt-14">
      <div className="mx-auto max-w-6xl">
        <div data-reveal className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* brand */}
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/batutas-logo.png"
                alt="BATUTAS"
                width={32}
                height={32}
                className="h-8 w-8 drop-shadow-[0_0_10px_rgba(108,92,255,0.55)]"
              />
              <span className="font-display text-xl font-bold tracking-[0.02em] text-white">
                BATUTAS
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A provably-fair, on-chain Rock–Paper–Scissors mini-game for MiniPay
              on Celo Mainnet. Named after the Indonesian{" "}
              <span className="text-lavender/80">Batu·Gunting·Kertas</span>.
            </p>
          </div>

          {/* link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-iris-300">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="block py-1 transition-colors hover:text-white"
                      {...(l.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 rounded-2xl border border-lavender/10 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-muted">
          ⚠️ RPS for real value can fall under gambling regulation, which varies
          by country and is prohibited in some jurisdictions. This site is
          technical documentation, not legal or financial advice.
        </p>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-lavender/10 pt-6 text-xs text-muted sm:flex-row">
          <span>© 2025 BATUTAS · Released under the MIT License.</span>
          <span className="text-muted/80">Built for Celo Proof of Ship — Season 2.</span>
        </div>
      </div>
    </footer>
  );
}
