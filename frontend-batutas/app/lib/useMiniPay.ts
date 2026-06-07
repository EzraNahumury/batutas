"use client";

import { useEffect, useState } from "react";

/* Detects whether the dApp is running inside Opera MiniPay's in-app browser.
   MiniPay injects an EIP-1193 provider with `window.ethereum.isMiniPay === true`.
   Returns false during SSR / first paint, then resolves on the client. */
export function useIsMiniPay(): boolean {
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    const eth = (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    setIsMiniPay(Boolean(eth?.isMiniPay));
  }, []);

  return isMiniPay;
}
