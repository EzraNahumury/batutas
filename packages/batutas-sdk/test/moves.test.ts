import { describe, it, expect } from "vitest";
import { MOVE_NUM, NUM_TO_MOVE, NUM_TO_RESULT } from "../src/moves";

describe("move maps", () => {
  it("round-trips every move through MOVE_NUM and NUM_TO_MOVE", () => {
    for (const move of ["rock", "paper", "scissors"] as const) {
      expect(NUM_TO_MOVE[MOVE_NUM[move]]).toBe(move);
    }
  });

  it("maps contract move numbers in order", () => {
    expect(NUM_TO_MOVE).toEqual(["rock", "paper", "scissors"]);
  });

  it("maps result numbers lose/draw/win in order", () => {
    expect(NUM_TO_RESULT).toEqual(["lose", "draw", "win"]);
  });
});
