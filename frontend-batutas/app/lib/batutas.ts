import { keccak256, encodePacked, toHex } from "viem";

/* Deployed BATUTAS game contract — Celo Mainnet (verified).
   Override via NEXT_PUBLIC_CONTRACT_ADDRESS if redeployed. */
export const BATUTAS_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x18e3B8359ad9f6C926B53ED2D432CCdc576c3Ebf") as `0x${string}`;

/* Chain id, explorer and peg now come from the published batutas-sdk. */
export { BATUTAS_CHAIN_ID, CELO_EXPLORER, PEG } from "batutas-sdk";

/* Move: Rock=0, Paper=1, Scissors=2 — Result: Lose=0, Draw=1, Win=2 */
export type Move = "rock" | "paper" | "scissors";
export type Outcome = "lose" | "draw" | "win";
export const MOVE_NUM: Record<Move, number> = { rock: 0, paper: 1, scissors: 2 };
export const NUM_TO_MOVE: Move[] = ["rock", "paper", "scissors"];
export const NUM_TO_RESULT: Outcome[] = ["lose", "draw", "win"];

/** 32 random bytes, kept client-side until reveal. */
export function makeSecret(): `0x${string}` {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return toHex(b);
}

/** keccak256(abi.encodePacked(uint8 move, bytes32 secret)) — must match contract. */
export function buildCommitHash(moveNum: number, secret: `0x${string}`): `0x${string}` {
  return keccak256(encodePacked(["uint8", "bytes32"], [moveNum, secret]));
}

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
