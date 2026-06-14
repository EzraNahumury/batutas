// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title BatutasToken
/// @notice Optional ERC-20 representation of in-game batutas (symbol: BTS).
/// @dev Standalone token. The core {Batutas} game uses internal balance
///      accounting and is unaffected by this contract; this token exists for
///      integrations that prefer a transferable ERC-20 (wallets, DEXes, etc.).
contract BatutasToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("Batutas", "BTS") Ownable(initialOwner) {}

    /// @notice Mint new batutas tokens to an account.
    /// @dev Restricted to the owner (intended to be the game contract or its
    ///      admin, so issuance stays tied to real CELO deposits).
    /// @param to Recipient of the freshly minted tokens.
    /// @param amount Amount to mint (18 decimals).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
