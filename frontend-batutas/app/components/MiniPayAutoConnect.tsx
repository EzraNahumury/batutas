"use client";

import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { useIsMiniPay } from "../lib/useMiniPay";

/* Inside MiniPay the wallet is injected and there is no separate "connect"
   step — so auto-connect the injected provider as soon as we detect MiniPay.
   No-op in regular browsers. Mounted inside the wagmi/RainbowKit providers. */
export default function MiniPayAutoConnect() {
  const isMiniPay = useIsMiniPay();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (!isMiniPay || isConnected) return;
    const injected =
      connectors.find((c) => c.id === "injected") ??
      connectors.find((c) => c.type === "injected") ??
      connectors[0];
    if (injected) connect({ connector: injected });
  }, [isMiniPay, isConnected, connect, connectors]);

  return null;
}
