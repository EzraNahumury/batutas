import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Batutas } from "../typechain-types";

describe("Batutas — access control & ownership", () => {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();
    return { batutas, owner, alice, bob };
  }

  describe("onlyOwner guards", () => {
    it("blocks non-owners from every admin function", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      const asAlice = batutas.connect(alice);

      const calls = [
        () => asAlice.setStake(10n),
        () => asAlice.setWinPayout(80n),
        () => asAlice.withdrawReserve(1n),
        () => asAlice.pause(),
        () => asAlice.unpause(),
        () => asAlice.transferOwnership(alice.address),
      ];

      for (const call of calls) {
        await expect(call()).to.be.revertedWithCustomError(batutas, "OwnableUnauthorizedAccount");
      }
    });

    it("allows the owner to call admin functions", async () => {
      const { batutas } = await loadFixture(deployFixture);
      await expect(batutas.setStake(20n)).to.not.be.reverted;
      await expect(batutas.setWinPayout(80n)).to.not.be.reverted;
      await expect(batutas.pause()).to.not.be.reverted;
      await expect(batutas.unpause()).to.not.be.reverted;
    });
  });

  describe("transferOwnership", () => {
    it("moves control to the new owner and revokes the old one", async () => {
      const { batutas, owner, alice } = await loadFixture(deployFixture);

      await expect(batutas.transferOwnership(alice.address))
        .to.emit(batutas, "OwnershipTransferred")
        .withArgs(owner.address, alice.address);
      expect(await batutas.owner()).to.equal(alice.address);

      // Old owner can no longer administer; new owner can.
      await expect(batutas.connect(owner).setStake(10n)).to.be.revertedWithCustomError(
        batutas,
        "OwnableUnauthorizedAccount",
      );
      await expect(batutas.connect(alice).setStake(10n)).to.not.be.reverted;
    });

    it("rejects transferring ownership to the zero address", async () => {
      const { batutas } = await loadFixture(deployFixture);
      await expect(batutas.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        batutas,
        "OwnableInvalidOwner",
      );
    });
  });

  describe("renounceOwnership", () => {
    it("leaves the contract without an owner and locks admin functions", async () => {
      const { batutas } = await loadFixture(deployFixture);
      await batutas.renounceOwnership();
      expect(await batutas.owner()).to.equal(ethers.ZeroAddress);
      await expect(batutas.setStake(10n)).to.be.revertedWithCustomError(
        batutas,
        "OwnableUnauthorizedAccount",
      );
    });
  });
});
