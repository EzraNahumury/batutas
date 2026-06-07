"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { wagmiConfig } from "./lib/wagmi";
import MiniPayAutoConnect from "./components/MiniPayAutoConnect";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="wide"
          theme={darkTheme({
            accentColor: "#6c5cff",
            accentColorForeground: "#0b0a2a",
            borderRadius: "large",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <MiniPayAutoConnect />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
