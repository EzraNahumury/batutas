import { ethers } from "hardhat";

/**
 * Top up the house reserve that backs player winnings.
 *
 * Amount (in CELO) is read from RESERVE_CELO, defaulting to 1 CELO.
 * Reads the deployed address from deployments/celo-mainnet.json.
 */
import deployment from "../deployments/celo-mainnet.json";

async function main() {
  const amount = ethers.parseEther(process.env.RESERVE_CELO ?? "1");
  const batutas = await ethers.getContractAt("Batutas", deployment.address);

  console.log(`Funding reserve of ${deployment.address} with ${ethers.formatEther(amount)} CELO...`);
  const tx = await batutas.fundReserve({ value: amount });
  console.log(`tx: ${tx.hash}`);
  await tx.wait();

  console.log(`availableReserve: ${(await batutas.availableReserve()).toString()} batutas`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
