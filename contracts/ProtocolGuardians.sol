/*
 /$$$$$$$  /$$$$$$$   /$$$$$$  /$$$$$$$$ /$$$$$$   /$$$$$$   /$$$$$$  /$$               
| $$__  $$| $$__  $$ /$$__  $$|__  $$__//$$__  $$ /$$__  $$ /$$__  $$| $$               
| $$  \ $$| $$  \ $$| $$  \ $$   | $$  | $$  \ $$| $$  \__/| $$  \ $$| $$               
| $$$$$$$/| $$$$$$$/| $$  | $$   | $$  | $$  | $$| $$      | $$  | $$| $$               
| $$____/ | $$__  $$| $$  | $$   | $$  | $$  | $$| $$      | $$  | $$| $$               
| $$      | $$  \ $$| $$  | $$   | $$  | $$  | $$| $$    $$| $$  | $$| $$               
| $$      | $$  | $$|  $$$$$$/   | $$  |  $$$$$$/|  $$$$$$/|  $$$$$$/| $$$$$$$$         
|__/      |__/  |__/ \______/    |__/   \______/  \______/  \______/ |________/                                                                                            
  /$$$$$$  /$$   /$$  /$$$$$$  /$$$$$$$  /$$$$$$$  /$$$$$$  /$$$$$$  /$$   /$$  /$$$$$$ 
 /$$__  $$| $$  | $$ /$$__  $$| $$__  $$| $$__  $$|_  $$_/ /$$__  $$| $$$ | $$ /$$__  $$
| $$  \__/| $$  | $$| $$  \ $$| $$  \ $$| $$  \ $$  | $$  | $$  \ $$| $$$$| $$| $$  \__/
| $$ /$$$$| $$  | $$| $$$$$$$$| $$$$$$$/| $$  | $$  | $$  | $$$$$$$$| $$ $$ $$|  $$$$$$ 
| $$|_  $$| $$  | $$| $$__  $$| $$__  $$| $$  | $$  | $$  | $$__  $$| $$  $$$$ \____  $$
| $$  \ $$| $$  | $$| $$  | $$| $$  \ $$| $$  | $$  | $$  | $$  | $$| $$\  $$$ /$$  \ $$
|  $$$$$$/|  $$$$$$/| $$  | $$| $$  | $$| $$$$$$$/ /$$$$$$| $$  | $$| $$ \  $$|  $$$$$$/
 \______/  \______/ |__/  |__/|__/  |__/|_______/ |______/|__/  |__/|__/  \__/ \______/                                                                                                                                                                          

- Website: https://protocolguardians.com
- Twitter: https://x.com/EthProtoGuards
- Telegram: https://t.me/EthProtoGuards
*/
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "solady/src/tokens/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract ProtocolGuardians is ERC721, Ownable {
    string private _baseTokenURI;
    
    uint256 private _nextTokenId = 1;
    
    mapping(uint256 => string) private _tokenCIDs;
    mapping(string => uint256) private _cidToTokenId;
    
    string private constant IPFS_GATEWAY = "https://ipfs.io/ipfs/";

    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event TokenMintedWithCID(uint256 indexed tokenId, string cid, address indexed to);

    constructor(string memory baseURI_) Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
    }

    function mint(address to, string memory cid) external returns (uint256 tokenId) {
        return _mintWithCID(to, cid);
    }

    function _mintWithCID(address to, string memory cid) internal returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _tokenCIDs[tokenId] = cid;
        _cidToTokenId[cid] = tokenId;
        _mint(to, tokenId);
        emit TokenMinted(to, tokenId);
        emit TokenMintedWithCID(tokenId, cid, to);
        return tokenId;
    }

    function _baseURI() internal view returns (string memory) {
        return _baseTokenURI;
    }

    function baseURI() public view returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist();
        }
        
        string memory cid = _tokenCIDs[tokenId];
        return string(abi.encodePacked(IPFS_GATEWAY, cid));
    }

    function name() public pure override returns (string memory) {
        return "Protocol Guardians";
    }

    function symbol() public pure override returns (string memory) {
        return "GUARDIAN";
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "ProtocolGuardians: No ETH to withdraw");
        
        Address.sendValue(payable(owner()), balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getCIDByTokenId(uint256 tokenId) external view returns (string memory) {
        return _tokenCIDs[tokenId];
    }

    function getTokenIdByCID(string memory cid) external view returns (uint256) {
        uint256 tokenId = _cidToTokenId[cid];
        require(tokenId != 0, "ProtocolGuardians: CID not found");
        return tokenId;
    }

    function batchMintToSingleAddress(address recipient, string[] memory cids) external returns (uint256[] memory tokenIds) {
        require(cids.length > 0, "ProtocolGuardians: Empty CID array");
        tokenIds = new uint256[](cids.length);
        for (uint256 i = 0; i < cids.length; i++) {
            tokenIds[i] = _mintWithCID(recipient, cids[i]);
        }
        return tokenIds;
    }
}
