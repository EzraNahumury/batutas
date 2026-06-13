import { BATUTAS_ADDRESS as SDK_BATUTAS_ADDRESS } from "batutas-sdk";
import type { Move } from "batutas-sdk";

/* Default to the SDK's verified Celo Mainnet address; allow an env override
   for redeploys via NEXT_PUBLIC_CONTRACT_ADDRESS. */
export const BATUTAS_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  SDK_BATUTAS_ADDRESS) as `0x${string}`;

/* Chain id, explorer and peg now come from the published batutas-sdk. */
export { BATUTAS_CHAIN_ID, CELO_EXPLORER, PEG } from "batutas-sdk";

/* Move/outcome types and numeric maps now come from batutas-sdk. */
export type { Move, Outcome } from "batutas-sdk";
export { MOVE_NUM, NUM_TO_MOVE, NUM_TO_RESULT } from "batutas-sdk";

/* makeSecret and buildCommitHash now come from batutas-sdk. */
export { makeSecret, buildCommitHash } from "batutas-sdk";

/* Persist the in-flight round secret so a refresh can still reveal it. */
type SavedRound = { move: Move; moveNum: number; secret: `0x${string}` };
const roundKey = (addr: string) => `batutas:round:${addr.toLowerCase()}`;

export function saveRound(addr: string, data: SavedRound) {
  try {
    localStorage.setItem(roundKey(addr), JSON.stringify(data));
  } catch {}
}
export function loadRound(addr: string): SavedRound | null {
  try {
    const s = localStorage.getItem(roundKey(addr));
    return s ? (JSON.parse(s) as SavedRound) : null;
  } catch {
    return null;
  }
}
export function clearRound(addr: string) {
  try {
    localStorage.removeItem(roundKey(addr));
  } catch {}
}

/* Minimal ABI — only what the frontend calls / decodes. */
export const batutasAbi = [
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "batutas", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "commitMove",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitHash", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "revealMove",
    stateMutability: "nonpayable",
    inputs: [
      { name: "move", type: "uint8" },
      { name: "secret", type: "bytes32" },
    ],
    outputs: [{ type: "uint8" }],
  },
  { type: "function", name: "claimRefund", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingCommit",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "commitHash", type: "bytes32" },
      { name: "commitBlock", type: "uint256" },
    ],
  },
  { type: "function", name: "stake", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "winPayout", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "availableReserve", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "celoIn", type: "uint256", indexed: false },
      { name: "batutasOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Committed",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "commitHash", type: "bytes32", indexed: false },
      { name: "commitBlock", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Revealed",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "playerMove", type: "uint8", indexed: false },
      { name: "houseMove", type: "uint8", indexed: false },
      { name: "result", type: "uint8", indexed: false },
      { name: "stake", type: "uint256", indexed: false },
      { name: "payout", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "batutasIn", type: "uint256", indexed: false },
      { name: "celoOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Refunded",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "stake", type: "uint256", indexed: false },
    ],
  },
] as const;
