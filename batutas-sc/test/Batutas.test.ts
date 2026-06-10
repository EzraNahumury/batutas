import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { Batutas } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// Enum mirrors (Solidity ordering).
const Move = { Rock: 0, Paper: 1, Scissors: 2 } as const;
const Result = { Lose: 0, Draw: 1, Win: 2 } as const;

const ONE_CELO = ethers.parseEther("1");
const WEI_PER_BATUTA = ethers.parseEther("1") / 1000n;
const REVEAL_DEADLINE_BLOCKS = 200;

/** Compute the commit hash exactly as the contract does. */
function commitHashOf(move: number, secret: string): string {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
}

/** Re-derive the house move and result off-chain from the committed block. */
function deriveResult(blockHash: string, secret: string, playerMove: number) {
  const seed = ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [blockHash, secret]);
  const houseMove = Number(BigInt(seed) % 3n);
  const diff = (playerMove + 3 - houseMove) % 3;
  const result = diff === 0 ? Result.Draw : diff === 1 ? Result.Win : Result.Lose;
  return { houseMove, result };
}

describe("Batutas", () => {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();
    return { batutas, owner, alice, bob };
  }

  /** Deploy, fund the house reserve, and give a player a deposit to play with. */
  async function fundedFixture() {
    const base = await deployFixture();
    await base.batutas.fundReserve({ value: ONE_CELO }); // 1000 batutas reserve
    await base.batutas.connect(base.alice).deposit({ value: ONE_CELO }); // 1000 batutas
    return base;
  }

  /** Commit a move, reveal it, and return the on-chain + expected result. */
  async function playRound(
    batutas: Batutas,
    player: HardhatEthersSigner,
    move: number,
    secret: string,
  ) {
    const tx = await batutas.connect(player).commitMove(commitHashOf(move, secret));
    const receipt = await tx.wait();
    const commitBlock = receipt!.blockNumber;

    const block = await ethers.provider.getBlock(commitBlock);
    const expected = deriveResult(block!.hash!, secret, move);

    const revealTx = await batutas.connect(player).revealMove(move, secret);
    return { revealTx, commitBlock, ...expected };
  }

  describe("deployment", () => {
    it("sets the owner and default economy parameters", async () => {
      const { batutas, owner } = await loadFixture(deployFixture);
      expect(await batutas.owner()).to.equal(owner.address);
      expect(await batutas.stake()).to.equal(25n);
      expect(await batutas.winPayout()).to.equal(50n);
      expect(await batutas.BATUTAS_PER_CELO()).to.equal(1000n);
      expect(await batutas.WEI_PER_BATUTA()).to.equal(WEI_PER_BATUTA);
    });
  });

  describe("deposit", () => {
    it("credits batutas at the fixed peg and emits Deposited", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await expect(batutas.connect(alice).deposit({ value: ONE_CELO }))
        .to.emit(batutas, "Deposited")
        .withArgs(alice.address, ONE_CELO, 1000n);
      expect(await batutas.balanceOf(alice.address)).to.equal(1000n);
    });

    it("reverts when the deposit is below one batuta", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await expect(
        batutas.connect(alice).deposit({ value: WEI_PER_BATUTA - 1n }),
      ).to.be.revertedWithCustomError(batutas, "DepositTooSmall");
    });
  });

  describe("withdraw", () => {
    it("redeems batutas back into CELO and emits Withdrawn", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: ONE_CELO });

      await expect(batutas.connect(alice).withdraw(400n)).to.changeEtherBalance(
        alice,
        400n * WEI_PER_BATUTA,
      );
      expect(await batutas.balanceOf(alice.address)).to.equal(600n);
    });

    it("reverts on zero amount and on insufficient balance", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: ONE_CELO });
      await expect(batutas.connect(alice).withdraw(0)).to.be.revertedWithCustomError(
        batutas,
        "InvalidAmount",
      );
      await expect(batutas.connect(alice).withdraw(1001n)).to.be.revertedWithCustomError(
        batutas,
        "InsufficientBalance",
      );
    });
  });

  describe("commitMove", () => {
    it("locks the stake and reserves the house exposure", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      const secret = ethers.id("secret-1");
      await expect(batutas.connect(alice).commitMove(commitHashOf(Move.Rock, secret))).to.emit(
        batutas,
        "Committed",
      );
      expect(await batutas.balanceOf(alice.address)).to.equal(975n); // 1000 - 25 stake
      expect(await batutas.availableReserve()).to.equal(975n); // 1000 - 25 winProfit
    });

    it("rejects a zero commit, a second round, and an underfunded player", async () => {
      const { batutas, alice, bob } = await loadFixture(fundedFixture);
      await expect(
        batutas.connect(alice).commitMove(ethers.ZeroHash),
      ).to.be.revertedWithCustomError(batutas, "InvalidCommit");

      const secret = ethers.id("secret-2");
      await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, secret));
      await expect(
        batutas.connect(alice).commitMove(commitHashOf(Move.Paper, secret)),
      ).to.be.revertedWithCustomError(batutas, "RoundInProgress");

      await expect(
        batutas.connect(bob).commitMove(commitHashOf(Move.Rock, secret)),
      ).to.be.revertedWithCustomError(batutas, "InsufficientBalance");
    });

    it("reverts when the reserve cannot back a potential win", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await batutas.connect(alice).deposit({ value: ONE_CELO }); // no reserve funded
      await expect(
        batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("s"))),
      ).to.be.revertedWithCustomError(batutas, "ReserveTooLow");
    });
  });

  describe("revealMove", () => {
    it("rejects a mismatched reveal", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      const secret = ethers.id("secret-3");
      await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, secret));
      await expect(
        batutas.connect(alice).revealMove(Move.Paper, secret),
      ).to.be.revertedWithCustomError(batutas, "HashMismatch");
    });

    it("reverts when revealing with no active round", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      await expect(
        batutas.connect(alice).revealMove(Move.Rock, ethers.id("none")),
      ).to.be.revertedWithCustomError(batutas, "NoActiveRound");
    });

    it("settles every outcome with correct balance and reserve deltas", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      const seen = new Set<number>();

      for (let i = 0; i < 40 && seen.size < 3; i++) {
        const secret = ethers.id(`round-${i}`);
        const balanceBefore = await batutas.balanceOf(alice.address);
        const reserveBefore = await batutas.availableReserve();

        const { revealTx, result, houseMove } = await playRound(batutas, alice, Move.Rock, secret);

        await expect(revealTx)
          .to.emit(batutas, "Revealed")
          .withArgs(alice.address, Move.Rock, houseMove, result, 25n, anyPayout(result));

        const balanceAfter = await batutas.balanceOf(alice.address);
        const reserveAfter = await batutas.availableReserve();

        if (result === Result.Win) {
          expect(balanceAfter - balanceBefore).to.equal(25n); // +winPayout -stake
          expect(reserveAfter - reserveBefore).to.equal(-25n);
        } else if (result === Result.Draw) {
          expect(balanceAfter - balanceBefore).to.equal(0n); // push
          expect(reserveAfter - reserveBefore).to.equal(0n);
        } else {
          expect(balanceAfter - balanceBefore).to.equal(-25n); // lose stake
          expect(reserveAfter - reserveBefore).to.equal(25n);
        }
        seen.add(result);
      }

      expect(seen.size, "expected to observe win, draw, and lose").to.equal(3);
    });

    it("reverts when revealing after the deadline", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      const secret = ethers.id("expired");
      await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, secret));
      await mine(REVEAL_DEADLINE_BLOCKS + 1);
      await expect(
        batutas.connect(alice).revealMove(Move.Rock, secret),
      ).to.be.revertedWithCustomError(batutas, "CommitExpired");
    });
  });

  describe("claimRefund", () => {
    it("refunds the stake and releases the reserve after the deadline", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      const secret = ethers.id("refund");
      await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, secret));
      await mine(REVEAL_DEADLINE_BLOCKS + 1);

      await expect(batutas.connect(alice).claimRefund())
        .to.emit(batutas, "Refunded")
        .withArgs(alice.address, 25n);
      expect(await batutas.balanceOf(alice.address)).to.equal(1000n);
      expect(await batutas.availableReserve()).to.equal(1000n);
    });

    it("reverts before the deadline and with no active round", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      await expect(batutas.connect(alice).claimRefund()).to.be.revertedWithCustomError(
        batutas,
        "NoActiveRound",
      );
      await batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("early")));
      await expect(batutas.connect(alice).claimRefund()).to.be.revertedWithCustomError(
        batutas,
        "CommitNotExpired",
      );
    });
  });

  describe("reserve management", () => {
    it("funds the reserve and lets the owner withdraw it", async () => {
      const { batutas, owner } = await loadFixture(deployFixture);
      await expect(batutas.fundReserve({ value: ONE_CELO }))
        .to.emit(batutas, "ReserveFunded")
        .withArgs(owner.address, ONE_CELO, 1000n);
      expect(await batutas.availableReserve()).to.equal(1000n);

      await expect(batutas.withdrawReserve(400n)).to.changeEtherBalance(
        owner,
        400n * WEI_PER_BATUTA,
      );
      expect(await batutas.availableReserve()).to.equal(600n);
    });

    it("only lets the owner withdraw the reserve", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      await expect(batutas.connect(alice).withdrawReserve(1n)).to.be.revertedWithCustomError(
        batutas,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("admin", () => {
    it("updates stake and win payout within valid bounds", async () => {
      const { batutas } = await loadFixture(deployFixture);
      await expect(batutas.setStake(30n)).to.emit(batutas, "StakeUpdated").withArgs(30n);
      await expect(batutas.setWinPayout(60n)).to.emit(batutas, "WinPayoutUpdated").withArgs(60n);
      expect(await batutas.stake()).to.equal(30n);
      expect(await batutas.winPayout()).to.equal(60n);
    });

    it("rejects invalid economy parameters and non-owners", async () => {
      const { batutas, alice } = await loadFixture(deployFixture);
      await expect(batutas.setStake(0)).to.be.revertedWithCustomError(batutas, "InvalidAmount");
      await expect(batutas.setStake(51n)).to.be.revertedWithCustomError(batutas, "InvalidPayout");
      await expect(batutas.setWinPayout(24n)).to.be.revertedWithCustomError(
        batutas,
        "InvalidPayout",
      );
      await expect(batutas.connect(alice).setStake(10n)).to.be.revertedWithCustomError(
        batutas,
        "OwnableUnauthorizedAccount",
      );
    });

    it("pauses deposits and gameplay", async () => {
      const { batutas, alice } = await loadFixture(fundedFixture);
      await batutas.pause();
      await expect(
        batutas.connect(alice).deposit({ value: ONE_CELO }),
      ).to.be.revertedWithCustomError(batutas, "EnforcedPause");
      await expect(
        batutas.connect(alice).commitMove(commitHashOf(Move.Rock, ethers.id("p"))),
      ).to.be.revertedWithCustomError(batutas, "EnforcedPause");
    });
  });
});

/** Expected payout per result given default economy (stake 25, win 50). */
function anyPayout(result: number): bigint {
  if (result === Result.Win) return 50n;
  if (result === Result.Draw) return 25n;
  return 0n;
}
