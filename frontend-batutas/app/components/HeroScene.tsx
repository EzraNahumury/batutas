/* Hero space landscape — stylized vector matching the reference composition:
   large ringed planet (lower-left), sweeping orbit arcs, lavender ice
   mountains (right), rolling foreground hills, a dome habitat, antenna
   spires with satellites and a geodesic dome. Pure SVG, no assets. */
export default function HeroScene() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[82%] w-full"
      viewBox="0 0 1440 820"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <radialGradient id="planet" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#3a47b8" />
          <stop offset="42%" stopColor="#23207f" />
          <stop offset="78%" stopColor="#141048" />
          <stop offset="100%" stopColor="#0c0a33" />
        </radialGradient>
        <radialGradient id="planetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(95,224,214,0)" />
          <stop offset="100%" stopColor="rgba(95,224,214,0.55)" />
        </radialGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="rgba(95,224,214,0)" />
          <stop offset="35%" stopColor="rgba(95,224,214,0.85)" />
          <stop offset="65%" stopColor="rgba(78,163,255,0.7)" />
          <stop offset="100%" stopColor="rgba(108,92,255,0)" />
        </linearGradient>
        <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfccff" />
          <stop offset="55%" stopColor="#8e88e8" />
          <stop offset="100%" stopColor="#5b53b8" />
        </linearGradient>
        <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a6a1f0" />
          <stop offset="100%" stopColor="#4b44a0" />
        </linearGradient>
        <linearGradient id="hillA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b3196" />
          <stop offset="100%" stopColor="#241a72" />
        </linearGradient>
        <linearGradient id="hillB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2080" />
          <stop offset="100%" stopColor="#1a1259" />
        </linearGradient>
        <linearGradient id="hillC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d1566" />
          <stop offset="100%" stopColor="#120c45" />
        </linearGradient>
        <filter id="blurS" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="blurL" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {/* faint distant planet upper-right */}
      <g className="anim-bob-slow">
        <circle cx="1330" cy="120" r="70" fill="#2a2486" opacity="0.5" />
        <circle cx="1306" cy="104" r="70" fill="#0f0a3a" opacity="0.55" />
      </g>

      {/* scattered, twinkling stars */}
      <g fill="#ffffff">
        {[
          [180, 120, 1.6, 0.8], [520, 90, 1.2, 0.6], [760, 150, 1.4, 0.7],
          [980, 80, 1, 0.5], [1120, 200, 1.6, 0.8], [300, 260, 1, 0.5],
          [640, 300, 1.2, 0.6], [880, 240, 1, 0.45], [1240, 330, 1.4, 0.7],
          [430, 360, 1, 0.5], [1040, 400, 1.2, 0.6], [120, 420, 1.3, 0.6],
        ].map(([x, y, r, o], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            opacity={o}
            className="anim-flicker"
            style={{ animationDelay: `${(i % 6) * 0.55}s`, animationDuration: `${3.5 + (i % 4)}s` }}
          />
        ))}
      </g>

      {/* ---- big ringed planet (lower-left) ---- */}
      <g className="anim-bob-slow" style={{ animationDelay: "1.6s" }}>
        <circle cx="300" cy="560" r="300" fill="url(#planetGlow)" filter="url(#blurL)" />
        {/* back half of ring */}
        <g transform="rotate(-20 300 560)">
          <ellipse cx="300" cy="560" rx="430" ry="96" fill="none" stroke="url(#ring)" strokeWidth="3" opacity="0.85" filter="url(#blurS)" />
          <ellipse cx="300" cy="560" rx="430" ry="96" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" opacity="0.5" />
        </g>
        <circle cx="300" cy="560" r="250" fill="url(#planet)" />
        {/* rim light */}
        <circle cx="300" cy="560" r="250" fill="none" stroke="rgba(95,224,214,0.85)" strokeWidth="2.5" opacity="0.7" />
        {/* surface blobs */}
        <g fill="#0e0a3a" opacity="0.55">
          <ellipse cx="220" cy="500" rx="70" ry="34" transform="rotate(-18 220 500)" />
          <ellipse cx="360" cy="600" rx="95" ry="40" transform="rotate(-12 360 600)" />
          <ellipse cx="250" cy="660" rx="55" ry="26" transform="rotate(-20 250 660)" />
          <ellipse cx="410" cy="500" rx="40" ry="20" transform="rotate(-15 410 500)" />
        </g>
        <g fill="#5fe0d6" opacity="0.16">
          <ellipse cx="200" cy="470" rx="40" ry="16" transform="rotate(-20 200 470)" />
          <ellipse cx="300" cy="540" rx="60" ry="22" transform="rotate(-15 300 540)" />
        </g>
        {/* front half of ring */}
        <g transform="rotate(-20 300 560)">
          <path d="M -130 560 A 430 96 0 0 0 730 560" fill="none" stroke="url(#ring)" strokeWidth="4" filter="url(#blurS)" />
          <path d="M -130 560 A 430 96 0 0 0 730 560" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
        </g>
      </g>

      {/* orbiting moon */}
      <g className="sat-orbit" style={{ transformOrigin: "300px 560px", animationDuration: "24s" }}>
        <circle cx="300" cy="232" r="11" fill="none" stroke="rgba(95,224,214,0.55)" strokeWidth="1" />
        <circle cx="300" cy="232" r="6" fill="#dcd9ff" />
        <circle cx="300" cy="232" r="6" fill="url(#planetGlow)" opacity="0.6" />
      </g>

      {/* sweeping orbit arcs (flowing) */}
      <path className="orbit-arc" d="M 360 470 Q 900 360 1260 520" fill="none" stroke="rgba(95,224,214,0.55)" strokeWidth="1.6" filter="url(#blurS)" />
      <path className="orbit-arc" style={{ animationDelay: "1.2s" }} d="M 420 520 Q 950 420 1300 580" fill="none" stroke="rgba(78,163,255,0.4)" strokeWidth="1.4" />

      {/* ---- ice mountains (right) ---- */}
      <g>
        <path d="M 760 660 L 940 360 L 1010 470 L 1100 320 L 1260 660 Z" fill="url(#mtn2)" opacity="0.85" />
        <path d="M 900 660 L 1100 300 L 1180 430 L 1280 280 L 1440 660 L 900 660 Z" fill="url(#mtn)" />
        {/* snow caps */}
        <path d="M 1100 300 L 1062 360 L 1085 372 L 1108 348 L 1128 372 L 1148 348 L 1180 430 L 1100 300 Z" fill="#ffffff" opacity="0.92" />
        <path d="M 1280 280 L 1248 332 L 1268 344 L 1288 322 L 1306 344 L 1440 560 L 1440 350 L 1280 280 Z" fill="#ffffff" opacity="0.85" />
        {/* ridge highlight */}
        <path d="M 900 660 L 1100 300 L 1180 430 L 1280 280 L 1440 660" fill="none" stroke="rgba(207,204,255,0.7)" strokeWidth="1.4" />
      </g>

      {/* ---- foreground hills ---- */}
      <path d="M 0 700 Q 360 590 720 660 T 1440 640 L 1440 820 L 0 820 Z" fill="url(#hillA)" />
      <path d="M 0 700 Q 360 590 720 660 T 1440 640" fill="none" stroke="rgba(95,224,214,0.45)" strokeWidth="1.4" />
      <path d="M 0 760 Q 420 690 860 740 T 1440 730 L 1440 820 L 0 820 Z" fill="url(#hillB)" />
      <path d="M 0 760 Q 420 690 860 740 T 1440 730" fill="none" stroke="rgba(108,92,255,0.4)" strokeWidth="1.2" />
      <path d="M 0 800 Q 500 770 980 795 T 1440 795 L 1440 820 L 0 820 Z" fill="url(#hillC)" />

      {/* dome habitat on the left ridge */}
      <g transform="translate(430 632)">
        <path d="M -34 0 A 34 30 0 0 1 34 0 Z" fill="#e9e7ff" opacity="0.92" />
        <path d="M -34 0 A 34 30 0 0 1 34 0" fill="none" stroke="#8e88e8" strokeWidth="1" />
        <line x1="-5" y1="-30" x2="-5" y2="-56" stroke="#cfccff" strokeWidth="2" />
        <circle cx="-5" cy="-58" r="3" fill="#5fe0d6" className="anim-beacon" />
        <rect x="-34" y="0" width="68" height="6" rx="2" fill="#b9b4ff" opacity="0.7" />
      </g>

      {/* antenna spires + satellites (right) */}
      <g stroke="#cfccff" strokeWidth="2" opacity="0.85">
        <line x1="1190" y1="700" x2="1190" y2="612" />
        <line x1="1244" y1="712" x2="1244" y2="640" />
      </g>
      <circle cx="1190" cy="604" r="9" fill="#1c1566" stroke="#5fe0d6" strokeWidth="1.4" className="anim-bob" />
      <circle cx="1244" cy="632" r="7" fill="#241a72" stroke="#4ea3ff" strokeWidth="1.2" className="anim-bob" style={{ animationDelay: "1.1s" }} />

      {/* geodesic dome (bottom-right) */}
      <g transform="translate(1300 700)" opacity="0.9">
        <path d="M -60 64 A 60 70 0 0 1 60 64 Z" fill="#1a1259" stroke="#b9b4ff" strokeWidth="1.2" />
        <g stroke="#b9b4ff" strokeWidth="0.9" opacity="0.7" fill="none">
          <path d="M -40 64 A 60 70 0 0 1 -40 -2" />
          <path d="M 0 64 A 60 70 0 0 1 0 -6" />
          <path d="M 40 64 A 60 70 0 0 1 40 -2" />
          <path d="M -60 30 Q 0 18 60 30" />
          <path d="M -54 46 Q 0 36 54 46" />
        </g>
      </g>

      {/* drifting glow particles */}
      <g fill="#cfccff">
        <circle cx="620" cy="560" r="2.4" opacity="0.7" className="anim-drift" />
        <circle cx="700" cy="600" r="1.8" opacity="0.5" className="anim-drift" style={{ animationDelay: "2s", animationDuration: "11s" }} />
        <circle cx="560" cy="610" r="2" opacity="0.6" className="anim-drift" style={{ animationDelay: "3.5s" }} />
      </g>
    </svg>
  );
}
