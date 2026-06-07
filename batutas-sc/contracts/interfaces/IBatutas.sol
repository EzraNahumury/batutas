// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Move, Result} from "../types/GameTypes.sol";

/// @title IBatutas
/// @notice Player-facing API and events for the BATUTAS game contract.
/// @dev Kept separate from the implementation so the frontend (viem/wagmi)
///      and integrators can depend on a stable ABI surface.
interface IBatutas {
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a player deposits CELO and is credited batutas.
    event Deposited(address indexed player, uint256 celoIn, uint256 batutasOut);

    /// @notice Emitted when a player locks a stake and commits a hashed move.
    event Committed(address indexed player, bytes32 commitHash, uint256 commitBlock);

    /// @notice Emitted when a round is revealed and settled.
    event Revealed(
        address indexed player,
        Move playerMove,
        Move houseMove,
        Result result,
        uint256 stake,
        uint256 payout
    );

    /// @notice Emitted when a player withdraws batutas back to CELO.
    event Withdrawn(address indexed player, uint256 batutasIn, uint256 celoOut);

    /// @notice Emitted when an unrevealed commit is refunded after its deadline.
    event Refunded(address indexed player, uint256 stake);

    // -------------------------------------------------------------------------
    // Funds
    // -------------------------------------------------------------------------

    /// @notice Deposit CELO and receive in-game batutas at the fixed peg.
    function deposit() external payable;

    /// @notice Redeem batutas back into CELO at the fixed peg.
    /// @param batutas The amount of batutas to withdraw.
    function withdraw(uint256 batutas) external;

    // -------------------------------------------------------------------------
    // Game (commit-reveal)
    // -------------------------------------------------------------------------

    /// @notice Lock the stake and commit a hashed move to start a round.
    /// @param commitHash keccak256(abi.encodePacked(move, secret)).
    function commitMove(bytes32 commitHash) external;

    /// @notice Reveal the committed move to derive the house move and settle.
    /// @param move The move that was committed.
    /// @param secret The secret that was committed.
    /// @return The round result from the player's perspective.
    function revealMove(Move move, bytes32 secret) external returns (Result);

    /// @notice Refund a stake whose commit was never revealed before its deadline.
    function claimRefund() external;

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @notice The batutas balance of a player.
    function balanceOf(address player) external view returns (uint256 batutas);

    /// @notice The pending (unrevealed) commit of a player, if any.
    /// @return commitHash The stored commit hash (zero if none).
    /// @return commitBlock The block at which the commit was made.
    function pendingCommit(address player)
        external
        view
        returns (bytes32 commitHash, uint256 commitBlock);
}
