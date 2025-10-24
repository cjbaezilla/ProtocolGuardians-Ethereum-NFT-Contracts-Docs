// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProtocolPower is ERC20, ERC20Votes, ERC20Permit, Ownable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;

    event TokensMinted(address indexed to, uint256 amount);

    event MinterRoleGranted(address indexed account);

    event MinterRoleRevoked(address indexed account);

    constructor(address initialOwner) 
        ERC20("Protocol Power", "POWER") 
        ERC20Permit("Protocol Power")
        Ownable(initialOwner)
    {
    }

    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "ProtocolPower: mint to zero address");
        require(amount > 0, "ProtocolPower: mint amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "ProtocolPower: mint would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function grantMinterRole(address account) external onlyOwner {
        require(account != address(0), "ProtocolPower: grant to zero address");
        _grantMinterRole(account);
        emit MinterRoleGranted(account);
    }

    function revokeMinterRole(address account) external onlyOwner {
        require(account != address(0), "ProtocolPower: revoke from zero address");
        _revokeMinterRole(account);
        emit MinterRoleRevoked(account);
    }

    function hasMinterRole(address account) external view returns (bool) {
        return _hasMinterRole(account);
    }

    function _grantMinterRole(address account) internal {
        _minters[account] = true;
    }

    function _revokeMinterRole(address account) internal {
        _minters[account] = false;
    }

    function _hasMinterRole(address account) internal view returns (bool) {
        return _minters[account];
    }

    modifier onlyMinter() {
        require(_hasMinterRole(msg.sender), "ProtocolPower: caller is not a minter");
        _;
    }

    mapping(address => bool) private _minters;

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address account)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(account);
    }

    function clock() public view override returns (uint48) {
        return uint48(block.number);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=blocknumber&from=default";
    }
}
