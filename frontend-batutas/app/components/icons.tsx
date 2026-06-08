/* Minimal line icons — 24x24, currentColor stroke. */
import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  ...props,
});

export function ShieldCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 11.5 2 2 4-4.2" />
    </svg>
  );
}

export function Tap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M9 11V6a2 2 0 1 1 4 0v5" />
      <path d="M13 11V8.5a1.8 1.8 0 0 1 3.6 0V11" />
      <path d="M16.6 11v-1a1.8 1.8 0 0 1 3.4 0v5.5A5.5 5.5 0 0 1 14.5 21H13a5 5 0 0 1-4-2l-3-4c-.6-.9.6-2.2 1.6-1.6L9 14.5" />
    </svg>
  );
}

export function Coin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      <path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </svg>
  );
}

export function Pulse(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  );
}

export function Wallet(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 9h18" />
      <circle cx="16.5" cy="13" r="1.2" />
    </svg>
  );
}

export function Hand(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 13V8.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M10 12V7a1.5 1.5 0 0 1 3 0v5" />
      <path d="M13 12V8a1.5 1.5 0 0 1 3 0v6.5A5.5 5.5 0 0 1 10.5 20 5 5 0 0 1 6 17.3l-1.7-3c-.5-.9.7-2 1.6-1.5L7 14" />
    </svg>
  );
}

export function Link2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M9 12h6" />
      <path d="M10 8H8a4 4 0 0 0 0 8h2" />
      <path d="M14 8h2a4 4 0 0 1 0 8h-2" />
    </svg>
  );
}

export function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function Lock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </svg>
  );
}

export function Reveal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function Scale(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 4v16" />
      <path d="M7 8h10" />
      <path d="m7 8-3 6h6l-3-6Z" />
      <path d="m17 8-3 6h6l-3-6Z" />
      <path d="M8 20h8" />
    </svg>
  );
}

export function SpeakerOn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 9v6h3l5 4V5L7 9H4Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}
export function SpeakerOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 9v6h3l5 4V5L7 9H4Z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </svg>
  );
}

/* small RPS glyphs */
export function Rock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 10c0-2.2 2.7-4 6-4s6 1.8 6 4l1 5c.2 1.6-2.8 3-7 3s-7.2-1.4-7-3l1-5Z" />
    </svg>
  );
}
export function Paper(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h6l4 4v12H7Z" />
      <path d="M13 4v4h4" />
    </svg>
  );
}
export function Scissors(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="7" r="2.4" />
      <circle cx="6" cy="17" r="2.4" />
      <path d="M8.2 8.2 20 17M8.2 15.8 20 7" />
    </svg>
  );
}
