import { ethers, network } from "hardhat";

/** Print the deployer address and its balance on the selected network. */
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Network: ${network.name}`);
  console.log(`Address: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} CELO`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
