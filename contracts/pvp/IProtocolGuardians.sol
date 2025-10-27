// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IProtocolGuardians
/// @notice Interface for interacting with ProtocolGuardians NFT contract
/// @dev Used by PvP contracts to verify NFT ownership and balances
interface IProtocolGuardians {
    /// @notice Returns the owner of a specific token ID
    /// @param tokenId The token ID to query
    /// @return The address of the token owner
    function ownerOf(uint256 tokenId) external view returns (address);

    /// @notice Returns the number of tokens owned by an address
    /// @param owner The address to query
    /// @return The number of tokens owned
    function balanceOf(address owner) external view returns (uint256);
}
