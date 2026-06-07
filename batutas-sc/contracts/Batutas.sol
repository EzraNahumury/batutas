// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {IBatutas} from "./interfaces/IBatutas.sol";
import {RPSLogic} from "./libraries/RPSLogic.sol";
import {Move, Result} from "./types/GameTypes.sol";

/// @title Batutas
/// @notice Provably-fair, on-chain Rock-Paper-Scissors against the protocol.
///         Players deposit CELO for in-game batutas, play via a commit-reveal
///         round, and withdraw batutas back to CELO at a fixed peg.
/// @dev Funds, round bookkeeping, and admin live here; the game rules live in
///      {RPSLogic} and the public ABI in {IBatutas} (separation of concern).
///
///      SECURITY — randomness: the house move is derived from
///      `blockhash(commitBlock)` mixed with the player's secret. This is fine
///      for low stakes but is (a) grindable by block producers and
///      (b) vulnerable to selective non-reveal, since a player can compute the
///      outcome before revealing and let a losing round expire for a refund.
///      Upgrade to a VRF before handling meaningful value.
contract Batutas is IBatutas, Ownable, ReentrancyGuard, Pausable {
    using RPSLogic for bytes32;

    // -------------------------------------------------------------------------
    // Constants — economy & peg
    // -------------------------------------------------------------------------

    /// @notice Fixed peg: 1 CELO mints this many batutas.
    uint256 public constant BATUTAS_PER_CELO = 1_000;

    /// @notice Wei backing a single batuta (1e18 / BATUTAS_PER_CELO).
    uint256 public constant WEI_PER_BATUTA = 1 ether / BATUTAS_PER_CELO;

    /// @notice Blocks a player has to reveal before a commit can be refunded.
    /// @dev Kept below 256 so `blockhash(commitBlock)` is still retrievable.
    uint256 public constant REVEAL_DEADLINE_BLOCKS = 200;

    // -------------------------------------------------------------------------
    // Round state
    // -------------------------------------------------------------------------

    /// @notice A player's active commit-reveal round.
    struct Round {
        bytes32 commitHash; // keccak256(abi.encodePacked(move, secret)); zero = no round
        uint64 commitBlock; // block at which the commit was made
        uint256 stake; // batutas locked from the player for this round
        uint256 lockedReserve; // house batutas reserved to cover a potential win
    }

    mapping(address => uint256) private _balances;
    mapping(address => Round) private _rounds;

    // -------------------------------------------------------------------------
    // Tunable economy parameters
    // -------------------------------------------------------------------------

    /// @notice Batutas a player stakes per round.
    uint256 public stake = 25;

    /// @notice Total batutas paid back to the player on a win (stake included).
    uint256 public winPayout = 50;

    /// @notice House batutas free to back new rounds' potential winnings.
    uint256 public availableReserve;

    // -------------------------------------------------------------------------
    // Admin events
    // -------------------------------------------------------------------------

    event StakeUpdated(uint256 stake);
    event WinPayoutUpdated(uint256 winPayout);
    event ReserveFunded(address indexed from, uint256 celoIn, uint256 batutasAdded);
    event ReserveWithdrawn(address indexed to, uint256 batutas, uint256 celoOut);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error DepositTooSmall();
    error InvalidAmount();
    error InsufficientBalance();
    error InvalidCommit();
    error RoundInProgress();
    error NoActiveRound();
    error ReserveTooLow();
    error RevealTooEarly();
    error CommitExpired();
    error CommitNotExpired();
    error HashMismatch();
    error InvalidPayout();
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    constructor(address initialOwner) Ownable(initialOwner) {}

    // -------------------------------------------------------------------------
    // Funds
    // -------------------------------------------------------------------------

    /// @inheritdoc IBatutas
    function deposit() external payable override whenNotPaused {
        uint256 batutasOut = msg.value / WEI_PER_BATUTA;
        if (batutasOut == 0) revert DepositTooSmall();

        _balances[msg.sender] += batutasOut;
        emit Deposited(msg.sender, msg.value, batutasOut);
    }

    /// @inheritdoc IBatutas
    function withdraw(uint256 batutas) external override nonReentrant whenNotPaused {
        if (batutas == 0) revert InvalidAmount();
        if (_balances[msg.sender] < batutas) revert InsufficientBalance();

        // Effects before interaction (CEI).
        _balances[msg.sender] -= batutas;
        uint256 celoOut = batutas * WEI_PER_BATUTA;

        emit Withdrawn(msg.sender, batutas, celoOut);
        _sendCelo(msg.sender, celoOut);
    }

    // -------------------------------------------------------------------------
    // Game (commit-reveal)
    // -------------------------------------------------------------------------

    /// @inheritdoc IBatutas
    function commitMove(bytes32 commitHash) external override whenNotPaused {
        if (commitHash == bytes32(0)) revert InvalidCommit();

        Round storage round = _rounds[msg.sender];
        if (round.commitHash != bytes32(0)) revert RoundInProgress();

        uint256 roundStake = stake;
        if (_balances[msg.sender] < roundStake) revert InsufficientBalance();

        uint256 winProfit = winPayout - roundStake; // house's exposure if player wins
        if (availableReserve < winProfit) revert ReserveTooLow();

        // Escrow the stake and lock the house's exposure for this round.
        _balances[msg.sender] -= roundStake;
        availableReserve -= winProfit;

        round.commitHash = commitHash;
        round.commitBlock = uint64(block.number);
        round.stake = roundStake;
        round.lockedReserve = winProfit;

        emit Committed(msg.sender, commitHash, block.number);
    }

    /// @inheritdoc IBatutas
    function revealMove(Move move, bytes32 secret)
        external
        override
        whenNotPaused
        returns (Result)
    {
        Round storage round = _rounds[msg.sender];
        if (round.commitHash == bytes32(0)) revert NoActiveRound();
        if (block.number <= round.commitBlock) revert RevealTooEarly();
        if (block.number > round.commitBlock + REVEAL_DEADLINE_BLOCKS) revert CommitExpired();
        if (keccak256(abi.encodePacked(move, secret)) != round.commitHash) revert HashMismatch();

        // Derive the house move from a blockhash the player could not grind at
        // commit time, mixed with their secret so neither side can steer it.
        bytes32 seed = keccak256(abi.encodePacked(blockhash(round.commitBlock), secret));
        Move houseMove = seed.deriveHouseMove();
        Result result = RPSLogic.resolve(move, houseMove);

        uint256 roundStake = round.stake;
        uint256 locked = round.lockedReserve;
        uint256 payout = _settle(msg.sender, result, roundStake, locked);

        _clearRound(round);
        emit Revealed(msg.sender, move, houseMove, result, roundStake, payout);
        return result;
    }

    /// @inheritdoc IBatutas
    function claimRefund() external override {
        Round storage round = _rounds[msg.sender];
        if (round.commitHash == bytes32(0)) revert NoActiveRound();
        if (block.number <= round.commitBlock + REVEAL_DEADLINE_BLOCKS) revert CommitNotExpired();

        uint256 roundStake = round.stake;

        // Return the escrowed stake and release the reserve lock.
        _balances[msg.sender] += roundStake;
        availableReserve += round.lockedReserve;

        _clearRound(round);
        emit Refunded(msg.sender, roundStake);
    }

    /// @dev Apply the round result to balances and the reserve.
    /// @return payout Batutas credited back to the player for this round.
    function _settle(address player, Result result, uint256 roundStake, uint256 locked)
        private
        returns (uint256 payout)
    {
        if (result == Result.Win) {
            // Player receives the full win payout (their stake + locked profit).
            payout = roundStake + locked;
            _balances[player] += payout;
        } else if (result == Result.Draw) {
            // Push: stake returned, reserve lock released back to the house.
            payout = roundStake;
            _balances[player] += roundStake;
            availableReserve += locked;
        } else {
            // Loss: the house keeps the stake and reclaims the released lock.
            payout = 0;
            availableReserve += locked + roundStake;
        }
    }

    // -------------------------------------------------------------------------
    // Reserve management
    // -------------------------------------------------------------------------

    /// @notice Top up the house reserve that backs player winnings.
    function fundReserve() external payable {
        uint256 batutasAdded = msg.value / WEI_PER_BATUTA;
        if (batutasAdded == 0) revert DepositTooSmall();

        availableReserve += batutasAdded;
        emit ReserveFunded(msg.sender, msg.value, batutasAdded);
    }

    /// @notice Withdraw accumulated house reserve (rake) to the owner.
    /// @param batutas The amount of reserve batutas to withdraw.
    function withdrawReserve(uint256 batutas) external onlyOwner nonReentrant {
        if (batutas == 0) revert InvalidAmount();
        if (availableReserve < batutas) revert InsufficientBalance();

        availableReserve -= batutas;
        uint256 celoOut = batutas * WEI_PER_BATUTA;

        emit ReserveWithdrawn(msg.sender, batutas, celoOut);
        _sendCelo(msg.sender, celoOut);
    }

    // -------------------------------------------------------------------------
    // Admin — economy & circuit breaker
    // -------------------------------------------------------------------------

    /// @notice Update the per-round stake. Must not exceed {winPayout}.
    function setStake(uint256 newStake) external onlyOwner {
        if (newStake == 0) revert InvalidAmount();
        if (newStake > winPayout) revert InvalidPayout();

        stake = newStake;
        emit StakeUpdated(newStake);
    }

    /// @notice Update the win payout. Must be at least the current {stake}.
    function setWinPayout(uint256 newWinPayout) external onlyOwner {
        if (newWinPayout < stake) revert InvalidPayout();

        winPayout = newWinPayout;
        emit WinPayoutUpdated(newWinPayout);
    }

    /// @notice Pause deposits and gameplay (withdrawals of in-flight refunds
    ///         remain available so funds are never trapped).
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resume normal operation.
    function unpause() external onlyOwner {
        _unpause();
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @inheritdoc IBatutas
    function balanceOf(address player) external view override returns (uint256) {
        return _balances[player];
    }

    /// @inheritdoc IBatutas
    function pendingCommit(address player)
        external
        view
        override
        returns (bytes32 commitHash, uint256 commitBlock)
    {
        Round storage round = _rounds[player];
        return (round.commitHash, round.commitBlock);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /// @dev Clear a round back to its idle state.
    function _clearRound(Round storage round) private {
        round.commitHash = bytes32(0);
        round.commitBlock = 0;
        round.stake = 0;
        round.lockedReserve = 0;
    }

    /// @dev Send CELO and bubble up failures.
    function _sendCelo(address to, uint256 amount) private {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
