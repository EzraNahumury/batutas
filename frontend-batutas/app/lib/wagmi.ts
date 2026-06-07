import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { celo, celoSepolia } from "wagmi/chains";
import { http } from "wagmi";

/* WalletConnect needs a project id for the QR / mobile flows. Injected
   wallets (MetaMask, Rabby, OKX, Phantom, …) work without it. Set a real id
   in .env.local as NEXT_PUBLIC_WC_PROJECT_ID before going to production. */
const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: "BATUTAS",
  projectId,
  chains: [celo, celoSepolia],
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
  },
  ssr: true,
});
