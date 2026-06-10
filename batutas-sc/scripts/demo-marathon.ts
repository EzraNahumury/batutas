import { ethers, network } from "hardhat";
import deployment from "../deployments/celo-mainnet.json";

/**
 * Play many full rounds back-to-back against the live Batutas contract until
 * the player's balance is too low to continue (or MAX_ROUNDS is reached).
 *
 * Each round = deposit -> commitMove -> revealMove -> withdraw (4 real txs).
 *
 * Run: npx hardhat run scripts/demo-marathon.ts --network celo
 * Env: DEMO_DEPOSIT_CELO (default 0.05), MAX_ROUNDS (default 100)
 */
const Move = { Rock: 0, Paper: 1, Scissors: 2 } as const;
const RESULT_NAME = ["Lose", "Draw", "Win"];
const DEPOSIT_CELO = process.env.DEMO_DEPOSIT_CELO ?? "0.05";
const MAX_ROUNDS = Number(process.env.MAX_ROUNDS ?? "100");

function commitHashOf(move: number, secret: string): string {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
}

async function playRound(batutas: any, player: ethers.Wallet, depositValue: bigint) {
  await (await batutas.deposit({ value: depositValue })).wait();

  const secret = ethers.hexlify(ethers.randomBytes(32));
  const commitReceipt = await (await batutas.commitMove(commitHashOf(Move.Rock, secret))).wait();
  const commitBlock = commitReceipt.blockNumber;

  while ((await ethers.provider.getBlockNumber()) <= commitBlock) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  const revealReceipt = await (await batutas.revealMove(Move.Rock, secret)).wait();
  const revealed = revealReceipt.logs
    .map((log: any) => {
      try {
        return batutas.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: any) => parsed?.name === "Revealed");

  const remaining = await batutas.balanceOf(player.address);
  if (remaining > 0n) await (await batutas.withdraw(remaining)).wait();

  return revealed ? Number(revealed.args.result) : -1;
}

async function main() {
  const rawKey = process.env.PRIVATE_KEY_PLAYER;
  if (!rawKey) throw new Error("PRIVATE_KEY_PLAYER is not set in .env");
  const player = new ethers.Wallet(rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`, ethers.provider);
  const batutas = (await ethers.getContractAt("Batutas", deployment.address)).connect(player) as any;

  const depositValue = ethers.parseEther(DEPOSIT_CELO);
  const minBalance = depositValue + ethers.parseEther("0.05"); // keep a gas buffer

  console.log(`Network: ${network.name} | Player: ${player.address}`);
  console.log(`Deposit/round: ${DEPOSIT_CELO} CELO | Max rounds: ${MAX_ROUNDS}\n`);

  const tally = { Win: 0, Lose: 0, Draw: 0 };
  let round = 0;

  while (round < MAX_ROUNDS) {
    const balance = await ethers.provider.getBalance(player.address);
    if (balance < minBalance) {
      console.log(`\nStopping: balance ${ethers.formatEther(balance)} CELO below safe threshold.`);
      break;
    }

    round++;
    try {
      const result = await playRound(batutas, player, depositValue);
      const name = RESULT_NAME[result] ?? "Unknown";
      tally[name as keyof typeof tally]++;
      console.log(`Round ${round}: ${name}`);
    } catch (error: any) {
      console.log(`\nStopping at round ${round}: ${error.shortMessage ?? error.message}`);
      round--;
      break;
    }
  }

  const finalBalance = await ethers.provider.getBalance(player.address);
  console.log(`\n===== DONE =====`);
  console.log(`Rounds played: ${round}  (${round * 4} on-chain txs)`);
  console.log(`Win ${tally.Win} | Lose ${tally.Lose} | Draw ${tally.Draw}`);
  console.log(`Remaining balance: ${ethers.formatEther(finalBalance)} CELO`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
