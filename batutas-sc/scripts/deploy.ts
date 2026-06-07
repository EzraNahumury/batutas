import { ethers, network, run } from "hardhat";

/**
 * Deploy the Batutas game contract.
 *
 * The deployer becomes the initial owner. After deployment, fund the house
 * reserve via `fundReserve()` so rounds can be backed, then verify on Celoscan:
 *
 *   npx hardhat verify --network <network> <address> <deployer>
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} CELO`);

  const factory = await ethers.getContractFactory("Batutas");
  const batutas = await factory.deploy(deployer.address);
  await batutas.waitForDeployment();

  const address = await batutas.getAddress();
  console.log(`\nBatutas deployed to: ${address}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Fund the reserve:  batutas.fundReserve({ value: ... })`);
  console.log(`  2. Set NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`  3. Verify on Celoscan:`);
  console.log(`     npx hardhat verify --network ${network.name} ${address} ${deployer.address}`);

  // Auto-verify on live networks when an explorer API key is configured.
  if (network.name !== "hardhat" && network.name !== "localhost" && process.env.CELOSCAN_API_KEY) {
    console.log(`\nWaiting for confirmations before verification...`);
    await batutas.deploymentTransaction()?.wait(5);
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
