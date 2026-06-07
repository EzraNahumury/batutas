// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Move, Result} from "../types/GameTypes.sol";

/// @title RPSLogic
/// @notice Pure Rock-Paper-Scissors rules — no state, no funds.
/// @dev Isolating the game rules keeps the core contract focused on funds
///      and round bookkeeping, and makes the rules trivially unit-testable.
library RPSLogic {
    uint8 internal constant MOVE_COUNT = 3;

    /// @notice Resolve a round from the player's perspective.
    /// @dev Uses modular arithmetic over the canonical move ordering
    ///      (Rock=0, Paper=1, Scissors=2). For two moves `p` and `h`:
    ///        (p - h + 3) % 3 == 0 -> Draw
    ///        (p - h + 3) % 3 == 1 -> Win  (p beats h)
    ///        (p - h + 3) % 3 == 2 -> Lose (h beats p)
    /// @param playerMove The move chosen by the player.
    /// @param houseMove The move derived for the house.
    /// @return The round result from the player's perspective.
    function resolve(Move playerMove, Move houseMove) internal pure returns (Result) {
        uint8 diff = (uint8(playerMove) + MOVE_COUNT - uint8(houseMove)) % MOVE_COUNT;

        if (diff == 0) {
            return Result.Draw;
        }
        if (diff == 1) {
            return Result.Win;
        }
        return Result.Lose;
    }

    /// @notice Derive the house move deterministically from a random seed.
    /// @dev The seed must come from a source the player could not predict at
    ///      commit time (e.g. a future blockhash mixed with the player secret).
    /// @param seed The randomness source for this round.
    /// @return The house move.
    function deriveHouseMove(bytes32 seed) internal pure returns (Move) {
        return Move(uint8(uint256(seed) % MOVE_COUNT));
    }
}
