import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BatutasToken } from "../typechain-types";

describe("BatutasToken", () => {
  async function deployFixture() {
    const [owner, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("BatutasToken");
    const token = (await factory.deploy(owner.address)) as unknown as BatutasToken;
    await token.waitForDeployment();
    return { token, owner, alice };
  }

  describe("deployment", () => {
    it("sets metadata, owner, and an empty initial supply", async () => {
      const { token, owner } = await loadFixture(deployFixture);
      expect(await token.name()).to.equal("Batutas");
      expect(await token.symbol()).to.equal("BTS");
      expect(await token.decimals()).to.equal(18);
      expect(await token.owner()).to.equal(owner.address);
      expect(await token.totalSupply()).to.equal(0n);
      expect(await token.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000000"));
    });
  });

  describe("mint", () => {
    it("lets the owner mint and increases balance and supply", async () => {
      const { token, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await expect(token.mint(alice.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, amount);

      expect(await token.balanceOf(alice.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(amount);
    });

    it("reverts when a non-owner tries to mint", async () => {
      const { token, alice } = await loadFixture(deployFixture);
      await expect(
        token.connect(alice).mint(alice.address, ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });
});
