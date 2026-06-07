import type { Metadata } from "next";
import { Quicksand, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BATUTAS — Provably-Fair Rock·Paper·Scissors on Celo",
  description:
    "BATUTAS is a provably-fair, on-chain Rock–Paper–Scissors mini-game built for MiniPay on Celo Mainnet. Deposit CELO, play instantly, withdraw anytime — every move settled and verifiable on-chain.",
  keywords: [
    "BATUTAS",
    "Rock Paper Scissors",
    "Celo",
    "MiniPay",
    "web3 game",
    "provably fair",
    "commit reveal",
    "on-chain",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
