/**
 * Move and outcome mappings that mirror the contract enums.
 * Move: Rock=0, Paper=1, Scissors=2.  Result: Lose=0, Draw=1, Win=2.
 */
export type Move = "rock" | "paper" | "scissors";
export type Outcome = "lose" | "draw" | "win";

export const MOVE_NUM: Record<Move, number> = { rock: 0, paper: 1, scissors: 2 };
export const NUM_TO_MOVE: Move[] = ["rock", "paper", "scissors"];
export const NUM_TO_RESULT: Outcome[] = ["lose", "draw", "win"];
