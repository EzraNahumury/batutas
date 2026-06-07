import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const CELOSCAN_API_KEY = process.env.CELOSCAN_API_KEY ?? "";

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts,
    },
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      celo: CELOSCAN_API_KEY,
      celoSepolia: CELOSCAN_API_KEY,
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://sepolia.celoscan.io",
        },
      },
    ],
  },
};

export default config;
