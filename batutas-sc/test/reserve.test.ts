import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Batutas } from "../typechain-types";

const Move = { Rock: 0, Paper: 1, Scissors: 2 } as const;
const WEI_PER_BATUTA = ethers.parseEther("1") / 1000n;

function commitHashOf(move: number, secret: string): string {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
}

describe("Batutas — reserve accounting & solvency", () => {
  async function deployFixture() {
    const [owner, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();
    return { batutas, owner, alice };
  }

  /** Batutas the contract owes that we can read directly (single participant, at rest). */
  async function restingLiabilities(batutas: Batutas, player: string): Promise<bigint> {
    return (await batutas.balanceOf(player)) + (await batutas.availableReserve());
  }

  describe("fundReserve", () => {
    it("accumulates reserve and rejects sub-batuta amounts", async () => {
      const { batutas } = await loadFixture(deployFixture);
      await batutas.fundReserve({ value: ethers.parseEther("1") });
      await batutas.fundReserve({ value: ethers.parseEther("0.5") });
      expect(await batutas.availableReserve()).to.equal(1500n);

      await expect(
        batutas.fundReserve({ value: WEI_PER_BATUTA - 1n }),
      ).to.be.revertedWithCustomError(batutas, "DepositTooSmall");
    });
  });

  describe("withdrawReserve", () => {
    it("caps withdrawals at the available (non-locked) reserve", async () => {
      const { batutas } = await loadFixture(deployFixture);
      await batutas.fundReserve({ value: ethers.parseEther("1") });
      await expect(batutas.withdrawReserve(1001n)).to.be.revertedWithCustomError(
        batutas,
        "InsufficientBalance",
      );
      await expect(batutas.withdrawReserve(1000n)).to.not.be.reverted;
      expect(await batutas.availableReserve()).to.equal(0n);
    });

    it("protects reserve locked by an active round from withdrawal", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      // Fund exactly one round's worth of house exposure (winProfit = 25).
      await batutas.fundReserve({ value: 25n * WEI_PER_BATUTA });
      await batutas.connect(alice).deposit({ value: 25n * WEI_PER_BATUTA });

      await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("lock")));

      // The 25 reserve batutas are now locked; none remain available.
      expect(await batutas.availableReserve()).to.equal(0n);
      await expect(batutas.withdrawReserve(1n)).to.be.revertedWithCustomError(
        batutas,
        "InsufficientBalance",
      );
    });
  });

  describe("solvency invariant", () => {
    it("keeps CELO backing equal to liabilities at rest and over-collateralised mid-round", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.fundReserve({ value: ethers.parseEther("1") });
      await batutas.connect(alice).deposit({ value: ethers.parseEther("1") });

      const contractAddr = await batutas.getAddress();

      // At rest: backing == liabilities (no dust, single participant).
      let backing = await ethers.provider.getBalance(contractAddr);
      expect(backing).to.equal((await restingLiabilities(batutas, alice.address)) * WEI_PER_BATUTA);

      // Mid-round: stake escrow (25) + locked reserve (25) sit outside the
      // readable liabilities, so backing is exactly 50 batutas higher.
      const secret = ethers.id("solvency");
      await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, secret));
      backing = await ethers.provider.getBalance(contractAddr);
      const readable = await restingLiabilities(batutas, alice.address);
      expect(backing).to.equal((readable + 50n) * WEI_PER_BATUTA);

      // After reveal it returns to a clean at-rest equality.
      await batutas.connect(alice).revealMove(Move.Rock, secret);
      backing = await ethers.provider.getBalance(contractAddr);
      expect(backing).to.equal((await restingLiabilities(batutas, alice.address)) * WEI_PER_BATUTA);
    });
  });
});
