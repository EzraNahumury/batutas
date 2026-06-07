"use client";

import Image from "next/image";
import { useState } from "react";
import LaunchButton from "./LaunchButton";

const LEFT = [
  { label: "Home", href: "#top" },
  { label: "How It Works", href: "#how" },
  { label: "Fairness", href: "#fairness" },
];
const RIGHT = [
  { label: "Features", href: "#features" },
  { label: "Roadmap", href: "#roadmap" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-40 px-3 pt-4 sm:px-5 sm:pt-5">
      <nav className="glass mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full px-3 pl-4 sm:px-4">
        {/* left links */}
        <ul className="hidden flex-1 items-center gap-6 text-[13px] font-medium text-muted md:flex">
          {LEFT.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* center brand */}
        <a href="#top" className="flex items-center gap-2 md:flex-none">
          <Image
            src="/batutas-logo.png"
            alt="BATUTAS"
            width={30}
            height={30}
            className="h-7 w-7 drop-shadow-[0_0_10px_rgba(108,92,255,0.55)]"
          />
          <span className="font-display text-lg font-bold tracking-[0.02em] text-white">
            BATUTAS
          </span>
        </a>

        {/* right links + cta */}
        <div className="hidden flex-1 items-center justify-end gap-6 md:flex">
          <ul className="flex items-center gap-6 text-[13px] font-medium text-muted">
            {RIGHT.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <LaunchButton className="btn-dark rounded-full px-4 py-2 text-[13px] font-semibold">
            Launch App
          </LaunchButton>
        </div>

        {/* mobile toggle */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-lavender/15 text-lavender md:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className={`absolute left-0 h-0.5 w-4 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-4 bg-current transition-all ${open ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`absolute left-0 h-0.5 w-4 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`}
            />
          </span>
        </button>
      </nav>

      {/* mobile drawer */}
      {open && (
        <div id="mobile-nav" className="glass mx-auto mt-2 max-w-4xl rounded-3xl p-3 md:hidden">
          <ul className="flex flex-col gap-1 text-sm font-medium text-lavender">
            {[...LEFT, ...RIGHT].map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-2.5 transition-colors hover:bg-iris/15 hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-1">
              <LaunchButton
                onNavigate={() => setOpen(false)}
                className="btn-lime block w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold"
              >
                Launch App
              </LaunchButton>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
