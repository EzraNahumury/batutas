"use strict";

// One cron tick: every wallet deposits DEPOSIT_CELO into the Batutas game.
// 100 wallets x 1 deposit = 100 txs per run. Scheduled 4x/day => 400 tx/day.
// Each deposit is sent from its own wallet, so there are no nonce conflicts;
// they run in batches of CONCURRENCY.

const {
  ethers,
  provider,
  loadWallets,
  CONTRACT_ADDRESS,
  DEPOSIT_CELO,
  CONCURRENCY,
  ABI,
  pool,
  ts,
  errMsg,
} = require("./lib");

async function main() {
  const prov = provider();
  const wallets = loadWallets(prov);
  const value = ethers.parseEther(DEPOSIT_CELO);
  const minBal = value + ethers.parseEther("0.005"); // deposit + gas headroom

  console.log(
    `[${ts()}] tick start: ${wallets.length} wallets x ${DEPOSIT_CELO} CELO -> ${CONTRACT_ADDRESS}`
  );

  let ok = 0,
    skipped = 0,
    failed = 0;

  await pool(wallets, CONCURRENCY, async (w, idx) => {
    try {
      const bal = await prov.getBalance(w.address);
      if (bal < minBal) {
        skipped++;
        console.warn(`[${idx}] SKIP ${w.address} low balance ${ethers.formatEther(bal)} CELO`);
        return;
      }
      const game = new ethers.Contract(CONTRACT_ADDRESS, ABI, w);
      const tx = await game.deposit({ value });
      await tx.wait(1);
      ok++;
      console.log(`[${idx}] OK   ${w.address} ${tx.hash}`);
    } catch (e) {
      failed++;
      console.error(`[${idx}] FAIL ${w.address}: ${errMsg(e)}`);
    }
  });

  console.log(`[${ts()}] tick done: ok=${ok} skipped=${skipped} failed=${failed}`);
  // Non-zero exit if nothing landed, so the scheduler/log shows the failure.
  if (ok === 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
