import { ethers } from "hardhat";
import deployment from "../deployments/celo-mainnet.json";

/**
 * Transfer contract ownership to a safe wallet.
 * New owner is read from NEW_OWNER.
 */
async function main() {
  const newOwner = ethers.getAddress(process.env.NEW_OWNER ?? "");
  const batutas = await ethers.getContractAt("Batutas", deployment.address);

  const currentOwner = await batutas.owner();
  console.log(`Contract:      ${deployment.address}`);
  console.log(`Current owner: ${currentOwner}`);
  console.log(`New owner:     ${newOwner}`);

  const tx = await batutas.transferOwnership(newOwner);
  console.log(`\ntx: ${tx.hash}`);
  await tx.wait();

  console.log(`Owner is now:  ${await batutas.owner()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
