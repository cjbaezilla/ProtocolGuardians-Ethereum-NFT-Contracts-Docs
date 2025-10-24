# ProtocolGuardians Usage Examples

## Introduction

This guide provides practical examples of how to use the ProtocolGuardians ecosystem, including staking, governance, and advanced interactions.

## Initial Setup

### Project Setup

```javascript
// Import dependencies
const { ethers } = require("hardhat");

// Configure provider and signers
const provider = ethers.provider;
const [deployer, user1, user2, proposer, executor] = await ethers.getSigners();

// Contract addresses (after deployment)
const protocolGuardiansAddress = "0x...";
const protocolPowerAddress = "0x...";
const protocolStakingAddress = "0x...";
const protocolTimelockAddress = "0x...";

// Instantiate contracts
const protocolGuardians = await ethers.getContractAt("ProtocolGuardians", protocolGuardiansAddress);
const protocolPower = await ethers.getContractAt("ProtocolPower", protocolPowerAddress);
const protocolStaking = await ethers.getContractAt("ProtocolStaking", protocolStakingAddress);
const protocolTimelock = await ethers.getContractAt("ProtocolTimelock", protocolTimelockAddress);
```

## Staking Examples

### Example 1: Basic Staking

```javascript
async function basicStaking() {
    console.log("🚀 Starting basic staking...");
    
    // 1. Mint NFT with IPFS CID
    const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    const mintTx = await protocolGuardians.mint(user1.address, cid);
    await mintTx.wait();
    console.log("✅ NFT minted with CID:", cid);
    
    // 2. Approve staking contract
    const approveTx = await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    await approveTx.wait();
    console.log("✅ Staking contract approved");
    
    // 3. Stake NFT
    const stakeTx = await protocolStaking.connect(user1).stake([1]);
    await stakeTx.wait();
    console.log("✅ NFT staked");
    
    // 4. Verify staking
    const stakedTokens = await protocolStaking.getStakedTokens(user1.address);
    console.log("Staked NFTs:", stakedTokens);
    
    // 5. Wait for rewards
    console.log("⏳ Waiting for rewards...");
    for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
    }
    
    // 6. Check rewards
    const rewards = await protocolStaking.getPendingRewards(1);
    console.log("Pending rewards:", ethers.formatEther(rewards));
    
    // 7. Claim rewards
    const claimTx = await protocolStaking.connect(user1).claimRewards([1]);
    await claimTx.wait();
    console.log("✅ Rewards claimed");
    
    // 8. Unstake NFT
    const unstakeTx = await protocolStaking.connect(user1).unstake([1]);
    await unstakeTx.wait();
    console.log("✅ NFT unstaked");
}
```

### Example 2: Advanced Staking with Multiple NFTs

```javascript
async function advancedStaking() {
    console.log("🚀 Starting advanced staking...");
    
    // 1. Mint multiple NFTs with different CIDs
    const cids = [
        "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly",
        "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye",
        "bafybeidrpfjuwpzqpg3dgdwaoadyrn6vznhvgxitkma7uy3u54ncfakhyy",
        "bafybeicq2j7q4j6y7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f"
    ];
    const tokenIds = [];
    for (let i = 0; i < 5; i++) {
        const mintTx = await protocolGuardians.mint(user1.address, cids[i]);
        await mintTx.wait();
        tokenIds.push(i + 1);
    }
    console.log("✅ 5 NFTs minted with unique CIDs");
    
    // 2. Approve staking contract
    await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    console.log("✅ Staking contract approved");
    
    // 3. Stake all NFTs
    const stakeTx = await protocolStaking.connect(user1).stake(tokenIds);
    await stakeTx.wait();
    console.log("✅ 5 NFTs staked");
    
    // 4. Monitor rewards
    const monitorRewards = async () => {
        const totalRewards = await protocolStaking.getTotalPendingRewards(user1.address);
        console.log("Total rewards:", ethers.formatEther(totalRewards));
        
        // Rewards per NFT
        for (const tokenId of tokenIds) {
            const rewards = await protocolStaking.getPendingRewards(tokenId);
            console.log(`Token ${tokenId}: ${ethers.formatEther(rewards)} CREWARD`);
        }
    };
    
    // 5. Monitor every 5 blocks
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
            await ethers.provider.send("evm_mine");
        }
        await monitorRewards();
    }
    
    // 6. Claim all rewards
    const claimTx = await protocolStaking.connect(user1).claimRewards(tokenIds);
    await claimTx.wait();
    console.log("✅ All rewards claimed");
    
    // 7. Unstake all NFTs
    const unstakeTx = await protocolStaking.connect(user1).unstake(tokenIds);
    await unstakeTx.wait();
    console.log("✅ All NFTs unstaked");
}
```

### Example 3: Portfolio Management

```javascript
async function portfolioManagement() {
    console.log("🚀 Starting portfolio management...");
    
    // 1. Initial setup with CIDs
    await protocolGuardians.mint(user1.address, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
    await protocolGuardians.mint(user1.address, "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly");
    await protocolGuardians.mint(user2.address, "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye");
    
    await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    await protocolGuardians.connect(user2).setApprovalForAll(protocolStakingAddress, true);
    
    // 2. Staking from different users
    await protocolStaking.connect(user1).stake([1, 2]);
    await protocolStaking.connect(user2).stake([3]);
    
    // 3. Monitoring function
    const monitorPortfolio = async () => {
        console.log("\n📊 Portfolio Status:");
        
        // User 1
        const user1Staked = await protocolStaking.getStakedTokens(user1.address);
        const user1Rewards = await protocolStaking.getTotalPendingRewards(user1.address);
        console.log(`User 1 - NFTs: ${user1Staked.length}, Rewards: ${ethers.formatEther(user1Rewards)}`);
        
        // User 2
        const user2Staked = await protocolStaking.getStakedTokens(user2.address);
        const user2Rewards = await protocolStaking.getTotalPendingRewards(user2.address);
        console.log(`User 2 - NFTs: ${user2Staked.length}, Rewards: ${ethers.formatEther(user2Rewards)}`);
        
        // System total
        const totalStaked = await protocolStaking.totalStaked();
        console.log(`Total NFTs in staking: ${totalStaked}`);
    };
    
    // 4. Monitor portfolio
    await monitorPortfolio();
    
    // 5. Wait for rewards
    for (let i = 0; i < 20; i++) {
        await ethers.provider.send("evm_mine");
    }
    
    // 6. Monitor after rewards
    await monitorPortfolio();
    
    // 7. Claim rewards
    await protocolStaking.connect(user1).claimRewards([1, 2]);
    await protocolStaking.connect(user2).claimRewards([3]);
    console.log("✅ Rewards claimed by both users");
    
    // 8. Final monitoring
    await monitorPortfolio();
}
```

## Governance Examples

### Example 1: Basic Proposal

```javascript
async function basicGovernance() {
    console.log("🚀 Starting basic governance...");
    
    // 1. Setup tokens for governance
    await protocolPower.connect(deployer).grantMinterRole(deployer.address);
    await protocolPower.connect(deployer).mint(user1.address, ethers.parseEther("10000"));
    await protocolPower.connect(deployer).mint(user2.address, ethers.parseEther("5000"));
    
    // 2. Delegate voting power
    await protocolPower.connect(user1).delegate(user1.address);
    await protocolPower.connect(user2).delegate(user2.address);
    
    // 3. Check voting power
    const user1Votes = await protocolPower.getVotes(user1.address);
    const user2Votes = await protocolPower.getVotes(user2.address);
    console.log(`User 1 - Voting power: ${ethers.formatEther(user1Votes)}`);
    console.log(`User 2 - Voting power: ${ethers.formatEther(user2Votes)}`);
    
    // 4. Create proposal: Grant minter role
    const target = protocolPowerAddress;
    const value = 0;
    const data = protocolPower.interface.encodeFunctionData("grantMinterRole", [user1.address]);
    const predecessor = ethers.ZeroHash;
    const salt = ethers.ZeroHash;
    const delay = 2 * 24 * 60 * 60;
    
    // 5. Schedule proposal
    const operationId = await protocolTimelock.hashOperation(target, value, data, predecessor, salt);
    await protocolTimelock.connect(proposer).schedule(target, value, data, predecessor, salt, delay);
    console.log("✅ Proposal scheduled");
    
    // 6. Check status
    const isPending = await protocolTimelock.isOperationPending(operationId);
    console.log("Proposal pending:", isPending);
    
    // 7. Wait for delay
    console.log("⏳ Waiting 2 days...");
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");
    
    // 8. Check if ready
    const isReady = await protocolTimelock.isOperationReady(operationId);
    console.log("Proposal ready:", isReady);
    
    // 9. Execute proposal
    await protocolTimelock.connect(executor).execute(target, value, data, predecessor, salt);
    console.log("✅ Proposal executed");
    
    // 10. Verify change applied
    const hasMinterRole = await protocolPower.hasMinterRole(user1.address);
    console.log("User 1 has minter role:", hasMinterRole);
}
```

### Example 2: Role Management

```javascript
async function roleManagement() {
    console.log("🚀 Starting role management...");
    
    // 1. Grant proposer role
    const grantProposerData = protocolTimelock.interface.encodeFunctionData("grantRole", [
        await protocolTimelock.PROPOSER_ROLE(),
        user1.address
    ]);
    
    await protocolTimelock.connect(proposer).schedule(
        protocolTimelockAddress, 0, grantProposerData, ethers.ZeroHash, ethers.ZeroHash, 2 * 24 * 60 * 60
    );
    console.log("✅ Proposer proposal scheduled");
    
    // 2. Grant executor role
    const grantExecutorData = protocolTimelock.interface.encodeFunctionData("grantRole", [
        await protocolTimelock.EXECUTOR_ROLE(),
        user2.address
    ]);
    
    await protocolTimelock.connect(proposer).schedule(
        protocolTimelockAddress, 0, grantExecutorData, ethers.ZeroHash, ethers.ZeroHash, 2 * 24 * 60 * 60
    );
    console.log("✅ Executor proposal scheduled");
    
    // 3. Wait for delay
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");
    
    // 4. Execute proposals
    await protocolTimelock.connect(executor).execute(
        protocolTimelockAddress, 0, grantProposerData, ethers.ZeroHash, ethers.ZeroHash
    );
    await protocolTimelock.connect(executor).execute(
        protocolTimelockAddress, 0, grantExecutorData, ethers.ZeroHash, ethers.ZeroHash
    );
    console.log("✅ Role proposals executed");
    
    // 5. Verify roles
    const user1IsProposer = await protocolTimelock.hasRole(
        await protocolTimelock.PROPOSER_ROLE(),
        user1.address
    );
    const user2IsExecutor = await protocolTimelock.hasRole(
        await protocolTimelock.EXECUTOR_ROLE(),
        user2.address
    );
    
    console.log("User 1 is proposer:", user1IsProposer);
    console.log("User 2 is executor:", user2IsExecutor);
}
```

### Example 3: Event Monitoring

```javascript
async function eventMonitoring() {
    console.log("🚀 Starting event monitoring...");
    
    // 1. Setup listeners
    protocolStaking.on("NFTsStaked", (owner, tokenIds) => {
        console.log("🎯 NFTs staked:", owner, tokenIds);
    });
    
    protocolStaking.on("RewardsClaimed", (owner, tokenIds, amount) => {
        console.log("💰 Rewards claimed:", owner, tokenIds, ethers.formatEther(amount));
    });
    
    protocolStaking.on("NFTsUnstaked", (owner, tokenIds) => {
        console.log("🔄 NFTs unstaked:", owner, tokenIds);
    });
    
    protocolTimelock.on("CallScheduled", (id, target, value, data, predecessor, delay) => {
        console.log("📅 Proposal scheduled:", id);
    });
    
    protocolTimelock.on("CallExecuted", (id, target, value, data) => {
        console.log("✅ Proposal executed:", id);
    });
    
    // 2. Perform actions that generate events
    await protocolGuardians.mint(user1.address, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
    await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    await protocolStaking.connect(user1).stake([1]);
    
    // 3. Wait for rewards
    for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
    }
    
    // 4. Claim rewards
    await protocolStaking.connect(user1).claimRewards([1]);
    
    // 5. Unstake
    await protocolStaking.connect(user1).unstake([1]);
    
    console.log("✅ Event monitoring completed");
}
```

## Integration Examples

### Example 1: Monitoring Dashboard

```javascript
async function createDashboard() {
    console.log("🚀 Creating monitoring dashboard...");
    
    // 1. Function to get system metrics
    const getSystemMetrics = async () => {
        const totalStaked = await protocolStaking.totalStaked();
        const rewardRate = await protocolStaking.getRewardRatePerBlock();
        const tokensPerDay = await protocolStaking.getTokensPerDay();
        
        return {
            totalStaked: totalStaked.toString(),
            rewardRate: rewardRate.toString(),
            tokensPerDay: ethers.formatEther(tokensPerDay)
        };
    };
    
    // 2. Function to get user metrics
    const getUserMetrics = async (userAddress) => {
        const stakedTokens = await protocolStaking.getStakedTokens(userAddress);
        const totalRewards = await protocolStaking.getTotalPendingRewards(userAddress);
        const rewardBalance = await protocolPower.balanceOf(userAddress);
        const votingPower = await protocolPower.getVotes(userAddress);
        
        return {
            stakedTokens: stakedTokens,
            totalRewards: ethers.formatEther(totalRewards),
            rewardBalance: ethers.formatEther(rewardBalance),
            votingPower: ethers.formatEther(votingPower)
        };
    };
    
    // 3. Continuous monitoring
    const monitorSystem = async () => {
        console.log("\n📊 ProtocolGuardians Dashboard");
        console.log("=".repeat(50));
        
        // System metrics
        const systemMetrics = await getSystemMetrics();
        console.log("System:");
        console.log(`- Total NFTs in staking: ${systemMetrics.totalStaked}`);
        console.log(`- Reward rate per block: ${systemMetrics.rewardRate}`);
        console.log(`- Tokens per day: ${systemMetrics.tokensPerDay}`);
        
        // User metrics
        const user1Metrics = await getUserMetrics(user1.address);
        const user2Metrics = await getUserMetrics(user2.address);
        
        console.log("\nUser 1:");
        console.log(`- Staked NFTs: ${user1Metrics.stakedTokens.length}`);
        console.log(`- Pending rewards: ${user1Metrics.totalRewards} CREWARD`);
        console.log(`- CREWARD balance: ${user1Metrics.rewardBalance}`);
        console.log(`- Voting power: ${user1Metrics.votingPower}`);
        
        console.log("\nUser 2:");
        console.log(`- Staked NFTs: ${user2Metrics.stakedTokens.length}`);
        console.log(`- Pending rewards: ${user2Metrics.totalRewards} CREWARD`);
        console.log(`- CREWARD balance: ${user2Metrics.rewardBalance}`);
        console.log(`- Voting power: ${user2Metrics.votingPower}`);
        
        console.log("=".repeat(50));
    };
    
    // 4. Run monitoring
    await monitorSystem();
}
```

### Example 2: Automated Staking Bot

```javascript
async function stakingBot() {
    console.log("🚀 Starting automated staking bot...");
    
    // 1. Bot configuration
    const botConfig = {
        userAddress: user1.address,
        checkInterval: 10000, // 10 seconds
        minRewardsThreshold: ethers.parseEther("1"), // 1 token minimum
        autoClaim: true,
        autoStake: true
    };
    
    // 2. Main bot function
    const runBot = async () => {
        try {
            // Check NFTs available for staking
            const nftBalance = await protocolGuardians.balanceOf(botConfig.userAddress);
            if (nftBalance > 0) {
                console.log(`📦 ${nftBalance} NFTs available for staking`);
                
                if (botConfig.autoStake) {
                    // Get token IDs
                    const tokenIds = [];
                    for (let i = 1; i <= nftBalance; i++) {
                        try {
                            const owner = await protocolGuardians.ownerOf(i);
                            if (owner === botConfig.userAddress) {
                                tokenIds.push(i);
                            }
                        } catch (e) {
                            // Token doesn't exist
                        }
                    }
                    
                    if (tokenIds.length > 0) {
                        // Approve if necessary
                        const isApproved = await protocolGuardians.isApprovedForAll(
                            botConfig.userAddress,
                            protocolStakingAddress
                        );
                        
                        if (!isApproved) {
                            await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
                            console.log("✅ Staking contract approved");
                        }
                        
                        // Stake NFTs
                        await protocolStaking.connect(user1).stake(tokenIds);
                        console.log(`✅ ${tokenIds.length} NFTs staked automatically`);
                    }
                }
            }
            
            // Check pending rewards
            const stakedTokens = await protocolStaking.getStakedTokens(botConfig.userAddress);
            if (stakedTokens.length > 0) {
                const totalRewards = await protocolStaking.getTotalPendingRewards(botConfig.userAddress);
                console.log(`💰 Pending rewards: ${ethers.formatEther(totalRewards)} CREWARD`);
                
                if (totalRewards >= botConfig.minRewardsThreshold && botConfig.autoClaim) {
                    await protocolStaking.connect(user1).claimRewards(stakedTokens);
                    console.log("✅ Rewards claimed automatically");
                }
            }
            
        } catch (error) {
            console.error("❌ Bot error:", error.message);
        }
    };
    
    // 3. Run bot
    await runBot();
    
    // 4. Configure periodic execution (simulated)
    console.log("⏰ Bot configured for periodic execution");
}
```

## Next Steps

1. **Explore More Examples**: Experiment with different combinations
2. **Create Your Own Integration**: Develop custom applications
3. **Contribute**: Share your examples with the community
4. **Optimize**: Find the best strategy for your use case

## Additional Resources

- [Staking Guide](./staking-guide.md)
- [DAO Governance Guide](./dao-guide.md)
- [Contract Documentation](./contracts.md)
- [System Architecture](./architecture.md)

## Support

If you have issues with the examples:

1. Review the technical documentation
2. Verify you have the correct permissions
3. Check error logs
4. Contact the development team
