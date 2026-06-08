import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Batutas } from "../typechain-types";

const WEI_PER_BATUTA = ethers.parseEther("1") / 1000n;

describe("Batutas — economy & peg conversion", () => {
  async function deployFixture() {
    const [owner, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();
    return { batutas, owner, alice };
  }

  describe("deposit conversion", () => {
    it("credits 1000 batutas per whole CELO", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: ethers.parseEther("1") });
      expect(await batutas.balanceOf(alice.address)).to.equal(1000n);
    });

    it("credits exactly one batuta for the minimum deposit", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: WEI_PER_BATUTA });
      expect(await batutas.balanceOf(alice.address)).to.equal(1n);
    });

    it("floors sub-batuta dust in the player's favour-neutral direction", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      // 1000.5 batutas worth -> floors to 1000
      await batutas.connect(alice).deposit({ value: ethers.parseEther("1") + WEI_PER_BATUTA / 2n });
      expect(await batutas.balanceOf(alice.address)).to.equal(1000n);
    });

    it("scales to large deposits without precision loss", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: ethers.parseEther("1000") });
      expect(await batutas.balanceOf(alice.address)).to.equal(1_000_000n);
    });

    it("accumulates across multiple deposits", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: ethers.parseEther("1") });
      await batutas.connect(alice).deposit({ value: ethers.parseEther("0.5") });
      expect(await batutas.balanceOf(alice.address)).to.equal(1500n);
    });
  });

  describe("withdraw conversion", () => {
    it("returns exactly batutas * WEI_PER_BATUTA in CELO", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: ethers.parseEther("1") });
      await expect(batutas.connect(alice).withdraw(250n)).to.changeEtherBalance(
        alice,
        250n * WEI_PER_BATUTA,
      );
    });

    it("supports a full deposit -> withdraw round trip with no value lost", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("3"); // exact multiple of the peg, no dust
      await batutas.connect(alice).deposit({ value: amount });
      const credited = await batutas.balanceOf(alice.address);
      expect(credited).to.equal(3000n);

      await expect(batutas.connect(alice).withdraw(credited)).to.changeEtherBalance(alice, amount);
      expect(await batutas.balanceOf(alice.address)).to.equal(0n);
    });
  });
});
