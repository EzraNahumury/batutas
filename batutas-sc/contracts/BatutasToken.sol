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
}
