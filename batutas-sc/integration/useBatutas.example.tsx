// Example wagmi hook for BATUTAS — copy into your frontend and adapt.
//
// This is a reference, not a compiled part of the contracts package.
// Peer deps in the frontend: viem, wagmi, @tanstack/react-query, react.
//
// Flow: deposit -> commit -> (wait 1 block) -> reveal -> withdraw.

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { BATUTAS_ABI, BATUTAS_ADDRESS, Move, buildCommit, randomSecret } from "./index";

const contract = { abi: BATUTAS_ABI, address: BATUTAS_ADDRESS } as const;

export function useBatutas() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Read the player's batutas balance.
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...contract,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  // Deposit CELO -> batutas.
  async function deposit(celo: string) {
    const hash = await writeContractAsync({
      ...contract,
      functionName: "deposit",
      value: parseEther(celo),
    });
    await refetchBalance();
    return hash;
  }

  // Commit a move. Returns the secret to keep for the reveal step.
  async function commit(move: Move) {
    const { commitHash, secret } = buildCommit(move, randomSecret());
    const hash = await writeContractAsync({
      ...contract,
      functionName: "commitMove",
      args: [commitHash],
    });
    return { hash, secret };
  }

  // Reveal the committed move (call in a later block than the commit).
  async function reveal(move: Move, secret: `0x${string}`) {
    const hash = await writeContractAsync({
      ...contract,
      functionName: "revealMove",
      args: [move, secret],
    });
    await refetchBalance();
    return hash;
  }

  // Withdraw batutas back to CELO.
  async function withdraw(batutas: bigint) {
    const hash = await writeContractAsync({
      ...contract,
      functionName: "withdraw",
      args: [batutas],
    });
    await refetchBalance();
    return hash;
  }

  return { address, balance, deposit, commit, reveal, withdraw, refetchBalance };
}
