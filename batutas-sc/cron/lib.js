"use strict";

// Shared config and helpers for the Batutas activity cron.
// Standalone: depends only on `ethers` and `dotenv`, no hardhat runtime.

require("dotenv").config();

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = process.env.RPC_URL || "https://forno.celo.org";
const CHAIN_ID = Number(process.env.CHAIN_ID || 42220);
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf";

// 0.001 CELO == 1 batuta (contract: WEI_PER_BATUTA = 1e18 / 1000).
// Anything smaller mints 0 batutas and reverts with DepositTooSmall().
const DEPOSIT_CELO = process.env.DEPOSIT_CELO || "0.001";
const AMOUNT_PER_WALLET_CELO = process.env.AMOUNT_PER_WALLET_CELO || "1";
const WALLET_COUNT = Number(process.env.WALLET_COUNT || 100);
const CONCURRENCY = Number(process.env.CONCURRENCY || 20);

const SECRETS_DIR = path.join(__dirname, "secrets");
const WALLETS_FILE = path.join(SECRETS_DIR, "wallets.json");
const ADDRESSES_FILE = path.join(SECRETS_DIR, "addresses.json");

// Minimal ABI — only what the cron calls. Avoids needing compiled artifacts.
const ABI = ["function deposit() payable", "function balanceOf(address) view returns (uint256)"];

function provider() {
  return new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
}

function loadWallets(prov) {
  if (!fs.existsSync(WALLETS_FILE)) {
    throw new Error(`Wallets file not found: ${WALLETS_FILE}\nRun: npm run gen`);
  }
  const data = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8"));
  return data.wallets.map((w) => new ethers.Wallet(w.privateKey, prov));
}

// Run `worker` over `items` with at most `limit` in flight at once.
// Returns results in input order.
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runner = async () => {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await worker(items[idx], idx);
    }
  };
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, runner));
  return results;
}

const ts = () => new Date().toISOString();
const errMsg = (e) => e.shortMessage || e.info?.error?.message || e.message || String(e);

module.exports = {
  ethers,
  fs,
  path,
  RPC_URL,
  CHAIN_ID,
  CONTRACT_ADDRESS,
  DEPOSIT_CELO,
  AMOUNT_PER_WALLET_CELO,
  WALLET_COUNT,
  CONCURRENCY,
  SECRETS_DIR,
  WALLETS_FILE,
  ADDRESSES_FILE,
  ABI,
  provider,
  loadWallets,
  pool,
  ts,
  errMsg,
};
