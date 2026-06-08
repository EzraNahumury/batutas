// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {RPSLogic} from "../libraries/RPSLogic.sol";
import {Move, Result} from "../types/GameTypes.sol";

/// @title RPSLogicHarness
/// @notice Test-only wrapper that exposes the internal {RPSLogic} library so it
///         can be exercised directly from the test suite.
/// @dev Not part of the production deployment.
contract RPSLogicHarness {
    function resolve(Move playerMove, Move houseMove) external pure returns (Result) {
        return RPSLogic.resolve(playerMove, houseMove);
    }

    function deriveHouseMove(bytes32 seed) external pure returns (Move) {
        return RPSLogic.deriveHouseMove(seed);
    }
}
