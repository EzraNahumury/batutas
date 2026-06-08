"use strict";

// Snapshot: funder balance, aggregate wallet CELO, aggregate in-game batutas,
// and how many ticks of runway remain at the current deposit size.

const {
  ethers,
  provider,
  loadWallets,
  CONTRACT_ADDRESS,
  DEPOSIT_CELO,
  CONCURRENCY,
  ABI,
  pool,
  errMsg,
} = require("./lib");

async function main() {
  const prov = provider();
  const wallets = loadWallets(prov);
  const game = new ethers.Contract(CONTRACT_ADDRESS, ABI, prov);
  const deposit = ethers.parseEther(DEPOSIT_CELO);

  if (process.env.FUNDER_PRIVATE_KEY) {
    const funder = new ethers.Wallet(process.env.FUNDER_PRIVATE_KEY, prov);
    const fb = await prov.getBalance(funder.address);
    console.log(`Funder ${funder.address}: ${ethers.formatEther(fb)} CELO`);
  }

  let totalCelo = 0n;
  let totalBatutas = 0n;
  let funded = 0;
  let empty = 0;

  await pool(wallets, CONCURRENCY, async (w, idx) => {
    try {
      const [bal, bat] = await Promise.all([
        prov.getBalance(w.address),
        game.balanceOf(w.address),
      ]);
      totalCelo += bal;
      totalBatutas += bat;
      if (bal >= deposit) funded++;
      else empty++;
    } catch (e) {
      console.error(`[${idx}] read FAILED ${w.address}: ${errMsg(e)}`);
    }
  });

  // Runway must include gas — on Celo it usually dwarfs the 0.001 deposit.
  const fee = await prov.getFeeData();
  const gasPrice = fee.gasPrice ?? fee.maxFeePerGas ?? 0n;
  const gasEst = 40000n; // ~mid for deposit() (cold ~50k, warm ~30k)
  const costPerTx = deposit + gasPrice * gasEst;
  const txPerDay = 5n * BigInt(wallets.length); // 5 ticks/day, all wallets
  const totalTicksLeft = costPerTx > 0n ? totalCelo / costPerTx : 0n;
  const daysLeft = txPerDay > 0n ? Number(totalTicksLeft) / Number(txPerDay) : 0;

  console.log(`Wallets:        ${wallets.length}`);
  console.log(`  funded (>=1 deposit): ${funded}`);
  console.log(`  empty:                ${empty}`);
  console.log(`Total wallet CELO:    ${ethers.formatEther(totalCelo)} CELO`);
  console.log(`Total in-game batutas: ${totalBatutas.toString()}`);
  console.log(
    `Gas price:  ${Number(ethers.formatUnits(gasPrice, "gwei")).toFixed(1)} gwei  ` +
      `(cost/tx ~${ethers.formatEther(costPerTx)} CELO incl. ${DEPOSIT_CELO} deposit)`
  );
  console.log(
    `Runway: ~${totalTicksLeft.toString()} tx left total (~${daysLeft.toFixed(0)} days at ${txPerDay} tx/day)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
