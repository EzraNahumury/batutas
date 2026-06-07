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
  other: {
    "talentapp:project_verification":
      "50d0a918395d2bd72551f8aa2cb9d0891c26b7bc78116893634a5bc32de2021f6443a805a38609a416d25989d4afd64a04bb5e86dc55dde97bfbd4305038a32c",
  },
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
