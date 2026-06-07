import BottomScene from "./BottomScene";
import LaunchButton from "./LaunchButton";

export default function CTASection() {
  return (
    <section id="launch" className="relative overflow-hidden px-6 pt-24 sm:pt-28">
      <BottomScene />

      <div data-reveal className="relative z-10 mx-auto max-w-2xl text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-iris-300">
          Ready when you are
        </span>
        <h2 className="font-display mt-5 text-[clamp(2rem,4.6vw,3.4rem)] font-medium leading-[1.08] text-white text-glow">
          Throw the first move.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          Provably fair, instantly settled, withdraw anytime. Built for the 14M+
          MiniPay users on Celo.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <LaunchButton className="btn-lime rounded-full px-7 py-3 text-sm font-semibold">
            Launch Game
          </LaunchButton>
          <a
            href="https://docs.celo.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark rounded-full px-6 py-3 text-sm font-semibold"
          >
            Read the docs
          </a>
        </div>
      </div>

      {/* tall spacer so the closing landscape can breathe */}
      <div className="h-[clamp(300px,40vw,540px)]" />
    </section>
  );
}
