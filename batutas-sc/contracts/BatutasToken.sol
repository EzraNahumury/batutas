// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title BatutasToken
/// @notice Optional ERC-20 representation of in-game batutas (symbol: BTS).
/// @dev Standalone token. The core {Batutas} game uses internal balance
///      accounting and is unaffected by this contract; this token exists for
///      integrations that prefer a transferable ERC-20 (wallets, DEXes, etc.).
contract BatutasToken is ERC20Capped, ERC20Burnable, Ownable {
    /// @notice Maximum number of BTS that can ever exist (1 billion, 18 decimals).
    uint256 public constant MAX_SUPPLY = 1_000_000_000 ether;

    constructor(
        address initialOwner
    ) ERC20("Batutas", "BTS") ERC20Capped(MAX_SUPPLY) Ownable(initialOwner) {}

    /// @notice Mint new batutas tokens to an account.
    /// @dev Restricted to the owner (intended to be the game contract or its
    ///      admin, so issuance stays tied to real CELO deposits). Reverts if the
    ///      mint would exceed {MAX_SUPPLY}.
    /// @param to Recipient of the freshly minted tokens.
    /// @param amount Amount to mint (18 decimals).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @dev Resolve the {ERC20} / {ERC20Capped} inheritance of `_update`.
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }
}
