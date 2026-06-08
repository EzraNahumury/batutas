import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { RPSLogicHarness } from "../typechain-types";

const Move = { Rock: 0, Paper: 1, Scissors: 2 } as const;
const Result = { Lose: 0, Draw: 1, Win: 2 } as const;

describe("RPSLogic", () => {
  async function deployHarness() {
    const factory = await ethers.getContractFactory("RPSLogicHarness");
    const harness = (await factory.deploy()) as unknown as RPSLogicHarness;
    await harness.waitForDeployment();
    return { harness };
  }

  describe("resolve — full 3x3 outcome matrix", () => {
    // [playerMove, houseMove, expectedResult]
    const cases: Array<[number, number, number]> = [
      [Move.Rock, Move.Rock, Result.Draw],
      [Move.Rock, Move.Paper, Result.Lose],
      [Move.Rock, Move.Scissors, Result.Win],
      [Move.Paper, Move.Rock, Result.Win],
      [Move.Paper, Move.Paper, Result.Draw],
      [Move.Paper, Move.Scissors, Result.Lose],
      [Move.Scissors, Move.Rock, Result.Lose],
      [Move.Scissors, Move.Paper, Result.Win],
      [Move.Scissors, Move.Scissors, Result.Draw],
    ];

    const names = ["Rock", "Paper", "Scissors"];
    const outcomes = ["Lose", "Draw", "Win"];

    for (const [player, house, expected] of cases) {
      it(`${names[player]} vs ${names[house]} => ${outcomes[expected]}`, async () => {
        const { harness } = await loadFixture(deployHarness);
        expect(await harness.resolve(player, house)).to.equal(expected);
      });
    }
  });

  describe("deriveHouseMove", () => {
    it("maps the seed modulo 3 onto a valid move", async () => {
      const { harness } = await loadFixture(deployHarness);
      // seed % 3 == 0 -> Rock, == 1 -> Paper, == 2 -> Scissors
      expect(await harness.deriveHouseMove(ethers.toBeHex(3n, 32))).to.equal(Move.Rock);
      expect(await harness.deriveHouseMove(ethers.toBeHex(4n, 32))).to.equal(Move.Paper);
      expect(await harness.deriveHouseMove(ethers.toBeHex(5n, 32))).to.equal(Move.Scissors);
    });

    it("always returns a move in range for arbitrary seeds", async () => {
      const { harness } = await loadFixture(deployHarness);
      for (let i = 0; i < 20; i++) {
        const move = Number(await harness.deriveHouseMove(ethers.id(`seed-${i}`)));
        expect(move).to.be.greaterThanOrEqual(0).and.lessThanOrEqual(2);
      }
    });
  });
});
