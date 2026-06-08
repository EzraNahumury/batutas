"use strict";

// One-time: send AMOUNT_PER_WALLET_CELO from the funder wallet to each
// generated wallet. Txs are sent with explicit sequential nonces (reliable
// ordering from a single account) and confirmations are awaited in parallel.

const {
  ethers,
  provider,
  loadWallets,
  AMOUNT_PER_WALLET_CELO,
  CONCURRENCY,
  pool,
  errMsg,
} = require("./lib");

async function main() {
  const pk = process.env.FUNDER_PRIVATE_KEY;
  if (!pk) throw new Error("Set FUNDER_PRIVATE_KEY in cron/.env");

  const prov = provider();
  const funder = new ethers.Wallet(pk, prov);
  const wallets = loadWallets(prov);
  const amount = ethers.parseEther(AMOUNT_PER_WALLET_CELO);

  const balance = await prov.getBalance(funder.address);
  const needed = amount * BigInt(wallets.length);
  const gasBuffer = ethers.parseEther("0.1");

  console.log(`Funder:  ${funder.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} CELO`);
  console.log(
    `Sending ${AMOUNT_PER_WALLET_CELO} CELO x ${wallets.length} = ${ethers.formatEther(needed)} CELO (+ gas)`
  );

  if (balance < needed + gasBuffer) {
    throw new Error(
      `Insufficient funder balance.\n` +
        `Need ~${ethers.formatEther(needed + gasBuffer)} CELO (distribution + gas), have ${ethers.formatEther(balance)}.\n` +
        `Top up the funder, or lower AMOUNT_PER_WALLET_CELO (e.g. 0.99) to fit exactly 100 CELO.`
    );
  }

  // Broadcast sequentially with explicit nonces so the node never sees a gap.
  let startNonce = await prov.getTransactionCount(funder.address);
  const sent = [];
  for (let idx = 0; idx < wallets.length; idx++) {
    const to = wallets[idx].address;
    try {
      const tx = await funder.sendTransaction({ to, value: amount, nonce: startNonce + idx });
      console.log(`[${idx}] sent -> ${to}  ${tx.hash}`);
      sent.push({ idx, to, tx });
    } catch (e) {
      console.error(`[${idx}] send FAILED -> ${to}: ${errMsg(e)}`);
    }
  }

  console.log(`\nWaiting for ${sent.length} confirmations...`);
  let confirmed = 0;
  await pool(sent, CONCURRENCY, async (r) => {
    try {
      await r.tx.wait(1);
      confirmed++;
    } catch (e) {
      console.error(`[${r.idx}] confirm FAILED -> ${r.to}: ${errMsg(e)}`);
    }
  });

  console.log(`\nDone. sent=${sent.length} confirmed=${confirmed} failed=${wallets.length - sent.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
