import { ethers, network, run } from "hardhat";

/**
 * Deploy the optional BatutasToken (ERC-20 BTS).
 *
 * The deployer becomes the initial owner (mint authority). Verify afterwards:
 *   npx hardhat verify --network <network> <address> <deployer>
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} CELO`);

  const factory = await ethers.getContractFactory("BatutasToken");
  const token = await factory.deploy(deployer.address);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`\nBatutasToken deployed to: ${address}`);
  console.log(`Verify:`);
  console.log(`  npx hardhat verify --network ${network.name} ${address} ${deployer.address}`);

  // Auto-verify on live networks when an explorer API key is configured.
  if (network.name !== "hardhat" && network.name !== "localhost" && process.env.CELOSCAN_API_KEY) {
    console.log(`\nWaiting for confirmations before verification...`);
    await token.deploymentTransaction()?.wait(5);
    try {
      await run("verify:verify", { address, constructorArguments: [deployer.address] });
      console.log("Verified on Celoscan.");
    } catch (error) {
      console.warn("Verification skipped/failed:", error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
