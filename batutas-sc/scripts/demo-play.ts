import { ethers, network } from "hardhat";
import deployment from "../deployments/celo-mainnet.json";

/**
 * Play one full round against the live Batutas contract:
 *   deposit -> commitMove -> revealMove -> withdraw
 *
 * Every step is a real on-chain transaction. The signer (PRIVATE_KEY in .env)
 * acts as the player and needs a little CELO for the deposit + gas.
 *
 * Run: npx hardhat run scripts/demo-play.ts --network celo
 */
const Move = { Rock: 0, Paper: 1, Scissors: 2 } as const;
const RESULT_NAME = ["Lose 😢", "Draw 🤝", "Win 🎉"];
const DEPOSIT_CELO = process.env.DEMO_DEPOSIT_CELO ?? "0.05"; // 0.05 CELO = 50 batutas

function commitHashOf(move: number, secret: string): string {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
}

async function main() {
  // Play as the dedicated player wallet (PRIVATE_KEY_PLAYER), independent of
  // the deployer/owner key used for admin operations.
  const rawKey = process.env.PRIVATE_KEY_PLAYER;
  if (!rawKey) throw new Error("PRIVATE_KEY_PLAYER is not set in .env");
  const playerKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
  const player = new ethers.Wallet(playerKey, ethers.provider);

  const batutas = (await ethers.getContractAt("Batutas", deployment.address)).connect(player);

  console.log(`Network:  ${network.name}`);
  console.log(`Contract: ${deployment.address}`);
  console.log(`Player:   ${player.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(player.address))} CELO\n`);

  // 1) Deposit CELO -> batutas
  const depositValue = ethers.parseEther(DEPOSIT_CELO);
  console.log(`1/4 deposit ${DEPOSIT_CELO} CELO ...`);
  await (await batutas.deposit({ value: depositValue })).wait();
  console.log(`    batutas balance: ${await batutas.balanceOf(player.address)}\n`);

  // 2) Commit a move (Rock) with a fresh random secret.
  const secret = ethers.hexlify(ethers.randomBytes(32));
  const move = Move.Rock;
  console.log(`2/4 commitMove (Rock) ...`);
  const commitReceipt = await (await batutas.commitMove(commitHashOf(move, secret))).wait();
  const commitBlock = commitReceipt!.blockNumber;
  console.log(`    committed at block ${commitBlock}, stake locked\n`);

  // The reveal must land in a later block so blockhash(commitBlock) exists.
  while ((await ethers.provider.getBlockNumber()) <= commitBlock) {
    await new Promise((r) => setTimeout(r, 1500));
  }

  // 3) Reveal -> contract derives the house move and settles.
  console.log(`3/4 revealMove ...`);
  const revealReceipt = await (await batutas.revealMove(move, secret)).wait();
  const revealed = revealReceipt!.logs
    .map((log) => {
      try {
        return batutas.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === "Revealed");

  if (revealed) {
    const { houseMove, result, payout } = revealed.args;
    console.log(`    house move: ${["Rock", "Paper", "Scissors"][Number(houseMove)]}`);
    console.log(`    result:     ${RESULT_NAME[Number(result)]} (payout ${payout} batutas)`);
  }
  console.log(`    batutas balance: ${await batutas.balanceOf(player.address)}\n`);

  // 4) Withdraw everything back to CELO.
  const remaining = await batutas.balanceOf(player.address);
  console.log(`4/4 withdraw ${remaining} batutas ...`);
  await (await batutas.withdraw(remaining)).wait();
  console.log(`    done. batutas balance: ${await batutas.balanceOf(player.address)}`);
  console.log(`\n✅ Full round played on-chain.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
