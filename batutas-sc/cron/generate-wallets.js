"use strict";

// Generate WALLET_COUNT fresh random wallets and store them in secrets/.
// Refuses to overwrite an existing file — regenerating would strand any
// funds already held by the old wallets.

const { ethers, fs, SECRETS_DIR, WALLETS_FILE, ADDRESSES_FILE, WALLET_COUNT, ts } = require("./lib");

function main() {
  if (!fs.existsSync(SECRETS_DIR)) fs.mkdirSync(SECRETS_DIR, { recursive: true });

  if (fs.existsSync(WALLETS_FILE)) {
    console.error(`Refusing to overwrite ${WALLETS_FILE}`);
    console.error(`It already exists. Delete it manually only if those wallets are empty —`);
    console.error(`losing these keys means losing any CELO they hold.`);
    process.exit(1);
  }

  const wallets = [];
  for (let i = 0; i < WALLET_COUNT; i++) {
    const w = ethers.Wallet.createRandom();
    wallets.push({ index: i, address: w.address, privateKey: w.privateKey });
  }

  fs.writeFileSync(
    WALLETS_FILE,
    JSON.stringify({ createdAt: ts(), count: wallets.length, wallets }, null, 2)
  );
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(wallets.map((w) => w.address), null, 2));

  console.log(`Generated ${wallets.length} wallets.`);
  console.log(`  Private keys -> ${WALLETS_FILE}   (SECRET — gitignored)`);
  console.log(`  Addresses    -> ${ADDRESSES_FILE} (safe to share)`);
  console.log(`\nKeep secrets/wallets.json safe. It is the only copy of these keys.`);
}

main();
