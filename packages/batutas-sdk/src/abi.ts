/** Minimal ABI — only what the SDK consumer calls / decodes. Mirrors the
    deployed BATUTAS contract; copied verbatim from the frontend. */
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
