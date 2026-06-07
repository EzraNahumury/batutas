/* Closing landscape — mirrors the reference's lower scene:
   a speckled planet/dome (right), a floating rock carrying a crystalline
   city of spires, drifting rocks, antenna spires and a small craft. */
export default function BottomScene() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-full w-full"
      viewBox="0 0 1440 560"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <radialGradient id="bPlanet" cx="40%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#2c2a8f" />
          <stop offset="55%" stopColor="#171258" />
          <stop offset="100%" stopColor="#0b0833" />
        </radialGradient>
        <linearGradient id="bRock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3098" />
          <stop offset="100%" stopColor="#1a1259" />
        </linearGradient>
        <linearGradient id="bSpire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#cfccff" />
          <stop offset="100%" stopColor="#7d77d6" />
        </linearGradient>
        <linearGradient id="bSpire2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfccff" />
          <stop offset="100%" stopColor="#5b53b8" />
        </linearGradient>
        <linearGradient id="bHill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1566" />
          <stop offset="100%" stopColor="#100b42" />
        </linearGradient>
        <filter id="bBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* stars */}
      <g fill="#ffffff">
        {[
          [120, 80, 1.4, 0.7], [340, 50, 1, 0.5], [560, 110, 1.2, 0.6],
          [780, 60, 1, 0.5], [960, 130, 1.4, 0.7], [1180, 70, 1, 0.5],
          [250, 170, 1, 0.5], [690, 200, 1.2, 0.6], [430, 230, 1, 0.45],
        ].map(([x, y, r, o], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            opacity={o}
            className="anim-flicker"
            style={{ animationDelay: `${(i % 5) * 0.6}s`, animationDuration: `${4 + (i % 3)}s` }}
          />
        ))}
      </g>

      {/* big speckled planet / dome (right) */}
      <g className="anim-bob-slow">
        <circle cx="1180" cy="430" r="300" fill="rgba(95,224,214,0.25)" filter="url(#bBlur)" />
        <circle cx="1180" cy="430" r="230" fill="url(#bPlanet)" />
        <circle cx="1180" cy="430" r="230" fill="none" stroke="rgba(95,224,214,0.7)" strokeWidth="2" opacity="0.6" />
        <g fill="#5fe0d6" opacity="0.5" className="anim-flicker" style={{ animationDuration: "6s" }}>
          {[
            [1110, 320, 2], [1160, 300, 1.5], [1220, 330, 2.2], [1090, 380, 1.6],
            [1260, 380, 1.8], [1150, 360, 1.4], [1300, 430, 2], [1070, 440, 1.5],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
        <ellipse cx="1130" cy="470" rx="90" ry="36" fill="#0c0a36" opacity="0.5" transform="rotate(-12 1130 470)" />
      </g>

      {/* orbiting moon around the big planet */}
      <g className="sat-orbit" style={{ transformOrigin: "1180px 430px", animationDuration: "34s" }}>
        <circle cx="1180" cy="196" r="9" fill="none" stroke="rgba(78,163,255,0.55)" strokeWidth="1" />
        <circle cx="1180" cy="196" r="5" fill="#dcd9ff" />
      </g>

      {/* small craft (mid-left) — drifting */}
      <g className="anim-drift">
        <g transform="translate(360 250)" opacity="0.95">
          <path d="M0 18 L78 4 L46 22 Z" fill="#dcd9ff" />
          <path d="M46 22 L78 4 L60 44 Z" fill="#8e88e8" />
          <path d="M0 18 L46 22 L24 30 Z" fill="#b9b4ff" />
          <circle cx="58" cy="16" r="2.4" fill="#5fe0d6" className="anim-beacon" />
          <path d="M0 18 C -14 16 -24 20 -34 17" stroke="rgba(95,224,214,0.5)" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>

      {/* drifting rock (left) */}
      <g className="anim-bob" style={{ animationDelay: "1.4s" }}>
        <g transform="translate(180 330)">
          <path d="M0 0 L70 -8 L96 18 L64 40 L14 34 L-8 14 Z" fill="url(#bRock)" />
          <path d="M14 34 L64 40 L40 64 Z" fill="#120c45" />
        </g>
      </g>

      {/* antenna spires */}
      <g stroke="#cfccff" strokeWidth="2" opacity="0.85">
        <line x1="640" y1="430" x2="640" y2="340" />
        <line x1="690" y1="440" x2="690" y2="372" />
      </g>
      <circle cx="640" cy="332" r="8" fill="#1c1566" stroke="#5fe0d6" strokeWidth="1.4" className="anim-bob" />
      <circle cx="690" cy="364" r="6" fill="#241a72" stroke="#4ea3ff" strokeWidth="1.2" className="anim-bob" style={{ animationDelay: "0.9s" }} />

      {/* floating rock island + crystalline city (right) — gentle sway */}
      <g className="anim-sway">
      <g transform="translate(980 300)">
        {/* spires */}
        <path d="M70 150 L96 -2 L120 150 Z" fill="url(#bSpire)" />
        <path d="M118 150 L150 -60 L178 150 Z" fill="url(#bSpire2)" />
        <path d="M170 150 L196 30 L220 150 Z" fill="url(#bSpire)" />
        <path d="M212 150 L240 -28 L266 150 Z" fill="url(#bSpire2)" />
        <path d="M40 150 L60 60 L82 150 Z" fill="#cfccff" opacity="0.85" />
        {/* highlights */}
        <path d="M150 -60 L150 150" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
        <path d="M240 -28 L240 150" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
        {/* floating rock platform */}
        <path d="M10 150 L300 150 L330 196 L270 240 L70 248 L-6 200 Z" fill="url(#bRock)" />
        <path d="M70 248 L270 240 L210 300 L120 300 Z" fill="#120c45" />
        <path d="M10 150 L300 150 L330 196" fill="none" stroke="rgba(95,224,214,0.4)" strokeWidth="1.4" />
      </g>
      </g>

      {/* foreground hills toward footer */}
      <path d="M0 430 Q 380 360 760 410 T 1440 400 L1440 560 L0 560 Z" fill="url(#bHill)" />
      <path d="M0 430 Q 380 360 760 410 T 1440 400" fill="none" stroke="rgba(108,92,255,0.35)" strokeWidth="1.2" />
      <path d="M0 500 Q 500 470 980 492 T 1440 490 L1440 560 L0 560 Z" fill="#0d0838" />
    </svg>
  );
}
