"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

/* Opens the RainbowKit wallet modal; once a wallet connects, routes straight
   into the app. If already connected, goes to the app immediately. */
export default function LaunchButton({
  className,
  children,
  onNavigate,
}: {
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();
  const intent = useRef(false);

  useEffect(() => {
    if (isConnected && intent.current) {
      intent.current = false;
      onNavigate?.();
      router.push("/app");
    }
  }, [isConnected, router, onNavigate]);

  const handleClick = () => {
    if (isConnected) {
      onNavigate?.();
      router.push("/app");
      return;
    }
    intent.current = true;
    openConnectModal?.();
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
