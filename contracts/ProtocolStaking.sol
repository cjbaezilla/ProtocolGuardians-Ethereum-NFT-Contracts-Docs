// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "solady/src/utils/ReentrancyGuard.sol";
import "solady/src/utils/SafeTransferLib.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ProtocolGuardians.sol";
import "./ProtocolPower.sol";

contract ProtocolStaking is ReentrancyGuard {
    using SafeERC20 for ProtocolPower;

    ProtocolGuardians public immutable nftContract;
    
    ProtocolPower public immutable rewardToken;
    
    uint256 public constant REWARD_RATE_PER_BLOCK = 1388888888888888;
    
    uint256 public constant BLOCKS_PER_DAY = 7200;
    
    uint256 public constant TOKENS_PER_DAY = 10 * 10**18;

    struct StakingInfo {
        address owner;
        uint256 stakedAtBlock;
        uint256 lastClaimedBlock;
    }
    
    mapping(uint256 => StakingInfo) public stakingInfo;
    
    mapping(address => uint256[]) public stakedTokens;
    
    mapping(address => mapping(uint256 => uint256)) public tokenIndex;
    
    uint256 public totalStaked;

    event NFTsStaked(address indexed owner, uint256[] tokenIds);

    event NFTsUnstaked(address indexed owner, uint256[] tokenIds);

    event RewardsClaimed(address indexed owner, uint256[] tokenIds, uint256 amount);

    event RewardRateUpdated(uint256 newRate);

    constructor(address _nftContract, address _rewardToken) {
        require(_nftContract != address(0), "ProtocolStaking: NFT contract cannot be zero address");
        require(_rewardToken != address(0), "ProtocolStaking: Reward token cannot be zero address");
        
        nftContract = ProtocolGuardians(_nftContract);
        rewardToken = ProtocolPower(_rewardToken);
    }

    function stake(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "ProtocolStaking: No tokens to stake");
        require(tokenIds.length <= 30, "ProtocolStaking: Too many tokens to stake at once");

        uint256 currentBlock = block.number;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            require(nftContract.ownerOf(tokenId) == msg.sender, "ProtocolStaking: Not token owner");
            require(stakingInfo[tokenId].owner == address(0), "ProtocolStaking: Token already staked");
        }
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            stakingInfo[tokenId] = StakingInfo({
                owner: msg.sender,
                stakedAtBlock: currentBlock,
                lastClaimedBlock: currentBlock
            });
            
            stakedTokens[msg.sender].push(tokenId);
            tokenIndex[msg.sender][tokenId] = stakedTokens[msg.sender].length - 1;
        }
        
        totalStaked += tokenIds.length;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            nftContract.transferFrom(msg.sender, address(this), tokenId);
        }
        
        emit NFTsStaked(msg.sender, tokenIds);
    }

    function unstake(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "ProtocolStaking: No tokens to unstake");
        require(tokenIds.length <= 30, "ProtocolStaking: Too many tokens to unstake at once");

        uint256 currentBlock = block.number;
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            StakingInfo storage info = stakingInfo[tokenId];
            
            require(info.owner == msg.sender, "ProtocolStaking: Not token owner");
            
            uint256 rewards = _calculateRewards(tokenId, currentBlock);
            if (rewards > 0) {
                totalRewards += rewards;
                info.lastClaimedBlock = currentBlock;
            }
        }
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            _removeStakedToken(msg.sender, tokenId);
            
            // Optimize: batch delete operations
            stakingInfo[tokenId] = StakingInfo({
                owner: address(0),
                stakedAtBlock: 0,
                lastClaimedBlock: 0
            });
        }
        
        totalStaked -= tokenIds.length;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            nftContract.transferFrom(address(this), msg.sender, tokenId);
        }
        
        if (totalRewards > 0) {
            rewardToken.mint(msg.sender, totalRewards);
        }
        
        emit NFTsUnstaked(msg.sender, tokenIds);
        if (totalRewards > 0) {
            emit RewardsClaimed(msg.sender, tokenIds, totalRewards);
        }
    }

    function claimRewards(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "ProtocolStaking: No tokens to claim rewards for");
        require(tokenIds.length <= 30, "ProtocolStaking: Too many tokens to claim rewards for at once");

        uint256 currentBlock = block.number;
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            StakingInfo storage info = stakingInfo[tokenId];
            
            require(info.owner == msg.sender, "ProtocolStaking: Not token owner");
            
            uint256 rewards = _calculateRewards(tokenId, currentBlock);
            if (rewards > 0) {
                totalRewards += rewards;
                info.lastClaimedBlock = currentBlock;
            }
        }
        
        require(totalRewards > 0, "ProtocolStaking: No rewards to claim");
        
        rewardToken.mint(msg.sender, totalRewards);
        
        emit RewardsClaimed(msg.sender, tokenIds, totalRewards);
    }

    function getStakedTokens(address owner) external view returns (uint256[] memory) {
        return stakedTokens[owner];
    }

    function getPendingRewards(uint256 tokenId) external view returns (uint256) {
        return _calculateRewards(tokenId, block.number);
    }

    function getPendingRewardsBatch(uint256[] calldata tokenIds) external view returns (uint256[] memory) {
        uint256[] memory rewards = new uint256[](tokenIds.length);
        uint256 currentBlock = block.number;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            rewards[i] = _calculateRewards(tokenIds[i], currentBlock);
        }
        
        return rewards;
    }

    function getTotalPendingRewards(address owner) external view returns (uint256) {
        uint256[] memory tokens = stakedTokens[owner];
        uint256 totalRewards = 0;
        uint256 currentBlock = block.number;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            totalRewards += _calculateRewards(tokens[i], currentBlock);
        }
        
        return totalRewards;
    }

    function getStakingInfo(uint256 tokenId) external view returns (
        address owner,
        uint256 stakedAtBlock,
        uint256 lastClaimedBlock,
        uint256 pendingRewards
    ) {
        StakingInfo memory info = stakingInfo[tokenId];
        return (
            info.owner,
            info.stakedAtBlock,
            info.lastClaimedBlock,
            _calculateRewards(tokenId, block.number)
        );
    }

    function _calculateRewards(uint256 tokenId, uint256 currentBlock) internal view returns (uint256) {
        StakingInfo memory info = stakingInfo[tokenId];
        
        if (info.owner == address(0)) {
            return 0;
        }
        
        uint256 blocksStaked = currentBlock - info.lastClaimedBlock;
        return blocksStaked * REWARD_RATE_PER_BLOCK;
    }

    function _removeStakedToken(address owner, uint256 tokenId) internal {
        uint256[] storage tokens = stakedTokens[owner];
        uint256 index = tokenIndex[owner][tokenId];
        uint256 lastIndex = tokens.length - 1;
        
        if (index != lastIndex) {
            uint256 lastTokenId = tokens[lastIndex];
            tokens[index] = lastTokenId;
            tokenIndex[owner][lastTokenId] = index;
        }
        
        tokens.pop();
        delete tokenIndex[owner][tokenId];
    }

    function getRewardRatePerBlock() external pure returns (uint256) {
        return REWARD_RATE_PER_BLOCK;
    }

    function getTokensPerDay() external pure returns (uint256) {
        return TOKENS_PER_DAY;
    }
}
