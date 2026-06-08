import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { Batutas } from "../typechain-types";

const Move = { Rock: 0, Paper: 1, Scissors: 2 } as const;
const ONE_CELO = ethers.parseEther("1");
const REVEAL_DEADLINE_BLOCKS = 200;

function commitHashOf(move: number, secret: string): string {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
}

describe("Batutas — pause semantics", () => {
  async function fundedFixture() {
    const [owner, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();
    await batutas.fundReserve({ value: ONE_CELO });
    await batutas.connect(alice).deposit({ value: ONE_CELO });
    return { batutas, owner, alice };
  }

  it("emits Paused/Unpaused and toggles the paused flag", async () => {
    const { batutas } = await loadFixture(fundedFixture);
    await expect(batutas.pause()).to.emit(batutas, "Paused");
    expect(await batutas.paused()).to.equal(true);
    await expect(batutas.unpause()).to.emit(batutas, "Unpaused");
    expect(await batutas.paused()).to.equal(false);
  });

  it("rejects pausing twice or unpausing while live", async () => {
    const { batutas } = await loadFixture(fundedFixture);
    await expect(batutas.unpause()).to.be.revertedWithCustomError(batutas, "ExpectedPause");
    await batutas.pause();
    await expect(batutas.pause()).to.be.revertedWithCustomError(batutas, "EnforcedPause");
  });

  it("blocks deposit, withdraw, commit and reveal while paused", async () => {
    const { batutas, alice } = await loadFixture(fundedFixture);
    await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("live")));
    await batutas.pause();

    await expect(batutas.connect(alice).deposit({ value: ONE_CELO })).to.be.revertedWithCustomError(
      batutas,
      "EnforcedPause",
    );
    await expect(batutas.connect(alice).withdraw(1n)).to.be.revertedWithCustomError(
      batutas,
      "EnforcedPause",
    );
    await expect(
      batutas.connect(alice).commitMove(commitHashOf(Move.Paper, ethers.id("x"))),
    ).to.be.revertedWithCustomError(batutas, "EnforcedPause");
    await expect(
      batutas.connect(alice).revealMove(Move.Rock, ethers.id("live")),
    ).to.be.revertedWithCustomError(batutas, "EnforcedPause");
  });

  it("still allows claimRefund while paused so stakes are never trapped", async () => {
    const { batutas, alice } = await loadFixture(fundedFixture);
    await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("stuck")));
    await mine(REVEAL_DEADLINE_BLOCKS + 1);
    await batutas.pause();

    await expect(batutas.connect(alice).claimRefund())
      .to.emit(batutas, "Refunded")
      .withArgs(alice.address, 25n);
    expect(await batutas.balanceOf(alice.address)).to.equal(1000n);
  });

  it("restores normal operation after unpause", async () => {
    const { batutas, alice } = await loadFixture(fundedFixture);
    await batutas.pause();
    await batutas.unpause();
    await expect(batutas.connect(alice).withdraw(100n)).to.not.be.reverted;
    await expect(
      batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("again"))),
    ).to.emit(batutas, "Committed");
  });
});
