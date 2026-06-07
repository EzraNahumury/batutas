export default function Intro() {
  return (
    <section className="relative z-10 px-6 py-24 sm:py-32">
      <div data-reveal className="mx-auto max-w-2xl text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-iris-300">
          The Game
        </span>
        <p className="mt-6 text-[17px] leading-[1.85] text-lavender/85 sm:text-lg">
          BATUTAS is a lightweight, mobile-first game where you challenge the
          protocol in Rock–Paper–Scissors — the Indonesian{" "}
          <span className="text-white">suit</span> (Batu·Gunting·Kertas). The
          choice spins behind a hidden card until you lock in a move, but the
          real outcome is decided{" "}
          <span className="text-white">on-chain with commit–reveal</span>, so
          neither the player nor the house can ever cheat.
        </p>
      </div>
    </section>
  );
}
