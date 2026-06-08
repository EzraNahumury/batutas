import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Batutas } from "../typechain-types";

const Move = { Rock: 0, Paper: 1, Scissors: 2 } as const;
const ONE_CELO = ethers.parseEther("1");
const WEI_PER_BATUTA = ONE_CELO / 1000n;

function commitHashOf(move: number, secret: string): string {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
}

describe("Batutas — multi-player", () => {
  async function fundedFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();
    await batutas.fundReserve({ value: ONE_CELO });
    await batutas.connect(alice).deposit({ value: ONE_CELO });
    await batutas.connect(bob).deposit({ value: ONE_CELO });
    return { batutas, owner, alice, bob };
  }

  it("keeps concurrent rounds and balances isolated between players", async () => {
    const { batutas, alice, bob } = await loadFixture(fundedFixture);
    const aliceSecret = ethers.id("alice");
    const bobSecret = ethers.id("bob");

    await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, aliceSecret));
    await batutas.connect(bob).commitMove(commitHashOf(Move.Paper, bobSecret));

    // Both staked independently; reserve locked twice (1000 - 2*25).
    expect(await batutas.balanceOf(alice.address)).to.equal(975n);
    expect(await batutas.balanceOf(bob.address)).to.equal(975n);
    expect(await batutas.availableReserve()).to.equal(950n);

    const [aliceHash] = await batutas.pendingCommit(alice.address);
    const [bobHash] = await batutas.pendingCommit(bob.address);
    expect(aliceHash).to.equal(commitHashOf(Move.Rock, aliceSecret));
    expect(bobHash).to.equal(commitHashOf(Move.Paper, bobSecret));
    expect(aliceHash).to.not.equal(bobHash);

    // Alice reveals; Bob's round must be untouched.
    await batutas.connect(alice).revealMove(Move.Rock, aliceSecret);
    const [bobHashAfter, bobBlock] = await batutas.pendingCommit(bob.address);
    expect(bobHashAfter).to.equal(commitHashOf(Move.Paper, bobSecret));
    expect(bobBlock).to.be.greaterThan(0n);
    expect(await batutas.balanceOf(bob.address)).to.equal(975n);

    // Bob can still reveal his own round afterwards.
    await expect(batutas.connect(bob).revealMove(Move.Paper, bobSecret)).to.emit(
      batutas,
      "Revealed",
    );
  });

  it("shares a single reserve pool across players", async () => {
    const [owner, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();

    // Fund exactly one round's house exposure (winProfit = 25).
    await batutas.fundReserve({ value: 25n * WEI_PER_BATUTA });
    await batutas.connect(alice).deposit({ value: ONE_CELO });
    await batutas.connect(bob).deposit({ value: ONE_CELO });

    // First player consumes the whole reserve; second is rejected.
    await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("a")));
    expect(await batutas.availableReserve()).to.equal(0n);
    await expect(
      batutas.connect(bob).commitMove(commitHashOf(Move.Rock, ethers.id("b"))),
    ).to.be.revertedWithCustomError(batutas, "ReserveTooLow");
  });
});
