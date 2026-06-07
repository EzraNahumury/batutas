/* Outer deep-space backdrop: tiled stars, drifting nebula glow,
   four-point sparkle glints and a faint film grain. Decorative only. */
export default function StarField() {
  return (
    <div aria-hidden className="grain fixed inset-0 z-0 overflow-hidden">
      {/* tiled star layers */}
      <div className="starfield" />
      <div
        className="starfield animate-twinkle"
        style={{ animationDelay: "1.5s", transform: "scale(1.4) rotate(18deg)", opacity: 0.6 }}
      />

      {/* nebula bloom corners */}
      <div className="animate-pulse-glow absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-iris/10 blur-[120px]" />
      <div
        className="animate-float-slow absolute -right-40 top-1/3 h-[480px] w-[480px] rounded-full bg-azure/10 blur-[130px]"
        style={{ animationDelay: "2s" }}
      />

      {/* four-point sparkle glints (matches reference cross-stars) */}
      <span className="sparkle animate-twinkle" style={{ left: "4%", top: "9%", width: 10, height: 10 }} />
      <span
        className="sparkle animate-twinkle"
        style={{ left: "96%", top: "44%", width: 8, height: 8, animationDelay: "0.8s" }}
      />
      <span
        className="sparkle animate-twinkle"
        style={{ left: "2%", top: "62%", width: 6, height: 6, animationDelay: "2.1s" }}
      />
      <span
        className="sparkle animate-twinkle"
        style={{ left: "92%", top: "82%", width: 7, height: 7, animationDelay: "1.2s" }}
      />
    </div>
  );
}
