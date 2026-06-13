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

/* The contract ABI now lives in batutas-sdk; re-export it for existing imports. */
export { batutasAbi } from "batutas-sdk";
