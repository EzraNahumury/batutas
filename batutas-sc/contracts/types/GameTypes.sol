// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title GameTypes
/// @notice Shared enums for the BATUTAS Rock-Paper-Scissors game.
/// @dev Declared at file level so they can be imported by the contract,
///      libraries, and interface without circular dependencies.

/// @notice A Rock-Paper-Scissors hand.
enum Move {
    Rock,
    Paper,
    Scissors
}

/// @notice Outcome of a round, always from the player's perspective.
enum Result {
    Lose,
    Draw,
    Win
}

/// @notice Lifecycle status of a player's active round.
enum RoundStatus {
    Idle,
    Committed
}
