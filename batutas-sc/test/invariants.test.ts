import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Batutas } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// Property-based checks: drive the game with many randomized rounds and assert
// the core invariants hold after every settlement.

const ONE_CELO = ethers.parseEther("1");
const WEI_PER_BATUTA = ONE_CELO / 1000n;

function commitHashOf(move: number, secret: string): string {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, secret]);
}

describe("Batutas — invariants (randomized)", () => {
  async function fundedFixture() {
    const [owner, ...players] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Batutas");
    const batutas = (await factory.deploy(owner.address)) as unknown as Batutas;
    await batutas.waitForDeployment();

    const reserve = ethers.parseEther("5"); // 5000 batutas
    await batutas.fundReserve({ value: reserve });

    const active = players.slice(0, 3);
    for (const p of active) {
      await batutas.connect(p).deposit({ value: ONE_CELO }); // 1000 batutas each
    }

    // Total batutas in the system at the start (deposits + reserve).
    const initialTotal = 1000n * BigInt(active.length) + reserve / WEI_PER_BATUTA;
    return { batutas, owner, players: active, initialTotal };
  }

  async function settleRound(batutas: Batutas, player: HardhatEthersSigner, move: number) {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    await batutas.connect(player).commitMove(commitHashOf(move, secret));
    await batutas.connect(player).revealMove(move, secret);
  }

  async function sumPlayerBalances(batutas: Batutas, players: HardhatEthersSigner[]) {
    let total = 0n;
    for (const p of players) total += await batutas.balanceOf(p.address);
    return total;
  }

  it("conserves total batutas (players + reserve) across many rounds", async () => {
    const { batutas, players, initialTotal } = await loadFixture(fundedFixture);
    const contractAddr = await batutas.getAddress();

    for (let i = 0; i < 30; i++) {
      const player = players[i % players.length];
      const move = Math.floor(Math.random() * 3);
      await settleRound(batutas, player, move);

      // Invariant 1: players' balances + house reserve never create or destroy
      // batutas (the game is zero-sum between player and house).
      const circulating =
        (await sumPlayerBalances(batutas, players)) + (await batutas.availableReserve());
      expect(circulating, `conservation broke at round ${i}`).to.equal(initialTotal);

      // Invariant 2: CELO backing equals the batutas liabilities at rest
      // (no deposits/withdrawals happen inside the loop).
      const backing = await ethers.provider.getBalance(contractAddr);
      expect(backing).to.equal(initialTotal * WEI_PER_BATUTA);
    }
  });

  it("never lets availableReserve exceed the total batutas in the system", async () => {
    const { batutas, players, initialTotal } = await loadFixture(fundedFixture);

    for (let i = 0; i < 20; i++) {
      await settleRound(batutas, players[i % players.length], Math.floor(Math.random() * 3));
      expect(await batutas.availableReserve()).to.be.lessThanOrEqual(initialTotal);
    }
  });
});
