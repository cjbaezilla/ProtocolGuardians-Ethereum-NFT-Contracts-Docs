// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IProtocolGuardians.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockProtocolGuardians
/// @notice Mock implementation of ProtocolGuardians for testing purposes
/// @dev Allows minting and transferring NFTs without IPFS metadata validation
contract MockProtocolGuardians is IProtocolGuardians, Ownable {
    /// @dev Internal token ID counter
    uint256 private _nextTokenId = 1;

    /// @dev Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    /// @dev Mapping from owner address to token count
    mapping(address => uint256) private _balances;

    /// @dev Mapping from owner to list of owned token IDs
    mapping(address => uint256[]) private _ownedTokens;

    /// @dev Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    /// @notice Event emitted when a token is minted
    /// @param to Address that receives the token
    /// @param tokenId The token ID minted
    event TokenMinted(address indexed to, uint256 indexed tokenId);

    /// @notice Event emitted when a token is transferred
    /// @param from Address that owns the token
    /// @param to Address that receives the token
    /// @param tokenId The token ID transferred
    event TokenTransferred(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() Ownable(msg.sender) {}

    /// @notice Mints a new token to the specified address
    /// @param to Address that will receive the token
    /// @return tokenId The ID of the newly minted token
    function mint(address to) external returns (uint256 tokenId) {
        require(to != address(0), "MockProtocolGuardians: Cannot mint to zero address");
        
        tokenId = _nextTokenId++;
        _mint(to, tokenId);
        
        emit TokenMinted(to, tokenId);
        return tokenId;
    }

    /// @notice Batch mints multiple tokens to the specified address
    /// @param to Address that will receive the tokens
    /// @param amount Number of tokens to mint
    /// @return tokenIds Array of minted token IDs
    function batchMint(address to, uint256 amount) external returns (uint256[] memory tokenIds) {
        require(to != address(0), "MockProtocolGuardians: Cannot mint to zero address");
        
        tokenIds = new uint256[](amount);
        
        // Optimize: batch increment _nextTokenId to avoid multiple SLOAD/SSTORE operations
        uint256 startTokenId = _nextTokenId;
        _nextTokenId += amount;
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = startTokenId + i;
            _mint(to, tokenId);
            emit TokenMinted(to, tokenId);
            tokenIds[i] = tokenId;
        }
        return tokenIds;
    }

    /// @notice Transfers a token from the current owner to a new owner
    /// @param from Current owner of the token
    /// @param to New owner of the token
    /// @param tokenId The token ID to transfer
    function transfer(address from, address to, uint256 tokenId) external {
        require(_owners[tokenId] == from, "MockProtocolGuardians: Not the owner");
        require(to != address(0), "MockProtocolGuardians: Cannot transfer to zero address");
        
        _transfer(from, to, tokenId);
        emit TokenTransferred(from, to, tokenId);
    }

    /// @notice Returns the owner of a specific token ID
    /// @param tokenId The token ID to query
    /// @return The address of the token owner
    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "MockProtocolGuardians: Token does not exist");
        return tokenOwner;
    }

    /// @notice Returns the number of tokens owned by an address
    /// @param tokenOwner The address to query
    /// @return The number of tokens owned
    function balanceOf(address tokenOwner) public view override returns (uint256) {
        require(tokenOwner != address(0), "MockProtocolGuardians: Balance query for zero address");
        return _balances[tokenOwner];
    }

    /// @notice Returns the total number of tokens minted
    /// @return The total supply
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Returns the token IDs owned by an address
    /// @param tokenOwner The address to query
    /// @return Array of token IDs
    function tokensOfOwner(address tokenOwner) external view returns (uint256[] memory) {
        return _ownedTokens[tokenOwner];
    }

    /// @dev Internal function to mint a token
    function _mint(address to, uint256 tokenId) private {
        require(_owners[tokenId] == address(0), "MockProtocolGuardians: Token already minted");
        
        _owners[tokenId] = to;
        _balances[to]++;
        _addTokenToOwner(to, tokenId);
    }

    /// @dev Internal function to transfer a token
    function _transfer(address from, address to, uint256 tokenId) private {
        require(_owners[tokenId] == from, "MockProtocolGuardians: Transfer from invalid owner");
        
        _owners[tokenId] = to;
        _balances[from]--;
        _balances[to]++;
        
        _removeTokenFromOwner(from, tokenId);
        _addTokenToOwner(to, tokenId);
    }

    /// @dev Adds a token to the owner's token list
    function _addTokenToOwner(address tokenOwner, uint256 tokenId) private {
        _ownedTokens[tokenOwner].push(tokenId);
        _ownedTokensIndex[tokenId] = _ownedTokens[tokenOwner].length;
    }

    /// @dev Removes a token from the owner's token list
    function _removeTokenFromOwner(address tokenOwner, uint256 tokenId) private {
        uint256 lastTokenIndex = _ownedTokens[tokenOwner].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[tokenOwner][lastTokenIndex];
            _ownedTokens[tokenOwner][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        delete _ownedTokensIndex[tokenId];
        _ownedTokens[tokenOwner].pop();
    }
}
