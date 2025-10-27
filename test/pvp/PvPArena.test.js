const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PvPArena", function () {
    let pvpArena;
    let playerRegistry;
    let battleEngine;
    let mockNft;
    let mockERC20;
    let owner;
    let player1;
    let player2;
    let signer;
    let tokenId1, tokenId2;

    before(async function () {
        [owner, player1, player2, signer] = await ethers.getSigners();

        // Deploy MockNFT
        const MockProtocolGuardians = await ethers.getContractFactory("MockProtocolGuardians");
        mockNft = await MockProtocolGuardians.deploy();
        await mockNft.waitForDeployment();

        // Deploy MockERC20
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockERC20 = await MockERC20.deploy();
        await mockERC20.waitForDeployment();

        // Deploy PlayerRegistry
        const PlayerRegistry = await ethers.getContractFactory("PlayerRegistry");
        playerRegistry = await PlayerRegistry.deploy(await mockNft.getAddress());
        await playerRegistry.waitForDeployment();

        // Deploy BattleEngine
        const BattleEngine = await ethers.getContractFactory("BattleEngine");
        battleEngine = await BattleEngine.deploy();
        await battleEngine.waitForDeployment();

        // Deploy PvPArena
        const PvPArena = await ethers.getContractFactory("PvPArena");
        pvpArena = await PvPArena.deploy(
            await playerRegistry.getAddress(),
            await battleEngine.getAddress(),
            signer.address,
            ethers.parseEther("0.001"), // challenge fee
            300 // 3% protocol fee
        );
        await pvpArena.waitForDeployment();

        // Setup players
        await playerRegistry.connect(player1).registerPlayer("Player1", "https://example.com/p1.png");
        await playerRegistry.connect(player2).registerPlayer("Player2", "https://example.com/p2.png");
        
        // Setup initial formations
        const startSupply = await mockNft.totalSupply();
        await (await mockNft.mint(player1.address)).wait();
        tokenId1 = startSupply + 1n;
        await (await mockNft.mint(player2.address)).wait();
        tokenId2 = startSupply + 2n;
        
        await playerRegistry.connect(player1).setFormation(0, [tokenId1]);
        await playerRegistry.connect(player2).setFormation(0, [tokenId2]);
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await pvpArena.getAddress()).to.be.properAddress;
        });

        it("Should set correct addresses", async function () {
            expect(await pvpArena.playerRegistryAddress()).to.equal(await playerRegistry.getAddress());
            expect(await pvpArena.battleEngineAddress()).to.equal(await battleEngine.getAddress());
            expect(await pvpArena.signerAddress()).to.equal(signer.address);
        });

        it("Should have correct constants", async function () {
            expect(await pvpArena.XP_WIN()).to.equal(50);
            expect(await pvpArena.XP_LOSS()).to.equal(20);
            expect(await pvpArena.ELO_K_FACTOR()).to.equal(30);
        });
    });

    describe("Configuration", function () {
        it("Should allow owner to set challenge fee", async function () {
            await pvpArena.connect(owner).setChallengeFee(ethers.parseEther("0.002"));
            expect(await pvpArena.challengeFee()).to.equal(ethers.parseEther("0.002"));
        });

        it("Should allow owner to set protocol fee", async function () {
            await pvpArena.connect(owner).setProtocolFee(500);
            expect(await pvpArena.protocolFeePercent()).to.equal(500);
        });

        it("Should allow owner to set signer address", async function () {
            await pvpArena.connect(owner).setSignerAddress(player2.address);
            expect(await pvpArena.signerAddress()).to.equal(player2.address);
        });

        it("Should allow owner to pause features", async function () {
            await pvpArena.connect(owner).setPauseStatus(true, true, true);
            expect(await pvpArena.pauseMatchmaking()).to.equal(true);
            expect(await pvpArena.pauseWagers()).to.equal(true);
            expect(await pvpArena.pauseRanking()).to.equal(true);
        });
    });

    describe("Ranking Challenges", function () {
        beforeEach(async function () {
            // Reset pause status
            await pvpArena.connect(owner).setPauseStatus(false, false, false);
        });

        it("Should revert when ranking challenges are paused", async function () {
            await pvpArena.connect(owner).setPauseStatus(false, false, true);

            const signedStats = await createSignedStats(tokenId1, [100, 50, 100, 500, 0, 0, 100, 0], Math.floor(Date.now() / 1000) + 3600, signer, player1.address);

            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    player2.address,
                    0,
                    signedStats,
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: Ranking challenges paused");
        });
    });

    describe("Wager Challenges", function () {
        it("Should revert when wager challenges are paused", async function () {
            await pvpArena.connect(owner).setPauseStatus(false, true, false);

            const signedStats = await createSignedStats(tokenId1, [100, 50, 100, 500, 0, 0, 100, 0], Math.floor(Date.now() / 1000) + 3600, signer, player1.address);

            await expect(
                pvpArena.connect(player1).createWagerChallenge(
                    player2.address,
                    0,
                    ethers.ZeroAddress,
                    ethers.parseEther("0.1"),
                    signedStats,
                    { value: ethers.parseEther("0.101") }
                )
            ).to.be.revertedWith("PvPArena: Wager challenges paused");
        });
    });

    describe("Challenge Cancellation", function () {
        it("Should allow challenger to cancel pending challenge", async function () {
            // Reset pause status
            await pvpArena.connect(owner).setPauseStatus(false, false, false);

            const signedStats = await createSignedStats(tokenId1, [100, 50, 100, 500, 0, 0, 100, 0], Math.floor(Date.now() / 1000) + 3600, signer, player1.address);

            await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                0,
                signedStats,
                { value: ethers.parseEther("0.001") }
            );

            const challengeId = await pvpArena.nextChallengeId() - 1n;
            await pvpArena.connect(player1).cancelChallenge(challengeId);

            const challenge = await pvpArena.challenges(challengeId);
            expect(challenge.status).to.equal(2); // Cancelled
        });

        it("Should apply 5% penalty when canceling wager challenge", async function () {
            const wagerAmount = ethers.parseEther("1.0");
            const signedStats = await createSignedStats(tokenId1, [100, 50, 100, 500, 0, 0, 100, 0], Math.floor(Date.now() / 1000) + 3600, signer, player1.address);

            await pvpArena.connect(player1).createWagerChallenge(
                player2.address,
                0,
                ethers.ZeroAddress,
                wagerAmount,
                signedStats,
                { value: ethers.parseEther("1.001") }
            );

            const challengeId = await pvpArena.nextChallengeId() - 1n;
            const balanceBefore = await ethers.provider.getBalance(player1.address);

            const tx = await pvpArena.connect(player1).cancelChallenge(challengeId);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const balanceAfter = await ethers.provider.getBalance(player1.address);
            const refund = balanceAfter + gasUsed - balanceBefore;

            // Should receive 95% back
            expect(refund).to.be.approximately(wagerAmount * 95n / 100n, ethers.parseEther("0.001"));
        });
    });

    describe("Signature Verification", function () {
        it("Should reject invalid signature", async function () {
            const invalidStats = {
                tokenId: tokenId1,
                stats: [100, 50, 100, 500, 0, 0, 0, 0],
                expiration: Math.floor(Date.now() / 1000) + 3600,
                signature: "0x" + "00".repeat(65)
            };

            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    player2.address,
                    0,
                    [invalidStats],
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: Invalid stats signature");
        });
    });

    describe("Helper Functions", function () {
        it("Should return challenge details", async function () {
            const challengeId = 1;
            const challenge = await pvpArena.getChallengeDetails(challengeId);
            expect(challenge.challenger).to.be.properAddress;
        });

        it("Should return player challenges", async function () {
            const challenges = await pvpArena.getPlayerChallenges(player1.address);
            expect(Array.isArray(challenges)).to.be.true;
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to withdraw fees", async function () {
            // Send some ETH to contract
            await owner.sendTransaction({
                to: await pvpArena.getAddress(),
                value: ethers.parseEther("1.0")
            });

            const balanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await pvpArena.connect(owner).withdrawFees(ethers.ZeroAddress, owner.address);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const balanceAfter = await ethers.provider.getBalance(owner.address);
            expect(balanceAfter - balanceBefore + gasUsed).to.be.approximately(
                ethers.parseEther("1.0"),
                ethers.parseEther("0.01")
            );
        });

        it("Should not allow non-owner to withdraw", async function () {
            await expect(
                pvpArena.connect(player1).withdrawFees(ethers.ZeroAddress, player1.address)
            ).to.be.revertedWithCustomError(pvpArena, "OwnableUnauthorizedAccount");
        });

        it("Should allow owner to set challenge fee", async function () {
            const newFee = ethers.parseEther("0.002");
            await pvpArena.connect(owner).setChallengeFee(newFee);
            expect(await pvpArena.challengeFee()).to.equal(newFee);
        });

        it("Should allow owner to set protocol fee", async function () {
            const newProtocolFee = 500; // 5%
            await pvpArena.connect(owner).setProtocolFee(newProtocolFee);
            expect(await pvpArena.protocolFeePercent()).to.equal(newProtocolFee);
        });

        it("Should not allow protocol fee above 10%", async function () {
            await expect(
                pvpArena.connect(owner).setProtocolFee(1001)
            ).to.be.revertedWith("PvPArena: Fee too high");
        });

        it("Should allow owner to update signer address", async function () {
            const [,,,newSignerAddress] = await ethers.getSigners();
            await pvpArena.connect(owner).setSignerAddress(newSignerAddress.address);
            expect(await pvpArena.signerAddress()).to.equal(newSignerAddress.address);
        });

        it("Should not allow setting zero address as signer", async function () {
            await expect(
                pvpArena.connect(owner).setSignerAddress(ethers.ZeroAddress)
            ).to.be.revertedWith("PvPArena: Invalid signer");
        });

        it("Should allow emergency withdraw", async function () {
            // Send ETH to contract
            await owner.sendTransaction({
                to: await pvpArena.getAddress(),
                value: ethers.parseEther("0.5")
            });

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await pvpArena.connect(owner).emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            expect(ownerBalanceAfter - ownerBalanceBefore + gasUsed).to.be.approximately(
                ethers.parseEther("0.5"),
                ethers.parseEther("0.01")
            );
        });
    });

    describe("Security Tests - Access Control", function () {
        it("Should prevent non-owner from setting challenge fee", async function () {
            await expect(
                pvpArena.connect(player1).setChallengeFee(ethers.parseEther("0.002"))
            ).to.be.revertedWithCustomError(pvpArena, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from setting protocol fee", async function () {
            await expect(
                pvpArena.connect(player1).setProtocolFee(500)
            ).to.be.revertedWithCustomError(pvpArena, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from setting signer address", async function () {
            await expect(
                pvpArena.connect(player1).setSignerAddress(player2.address)
            ).to.be.revertedWithCustomError(pvpArena, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from setting pause status", async function () {
            await expect(
                pvpArena.connect(player1).setPauseStatus(true, false, false)
            ).to.be.revertedWithCustomError(pvpArena, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from withdrawing fees", async function () {
            await expect(
                pvpArena.connect(player1).withdrawFees(ethers.ZeroAddress, player1.address)
            ).to.be.revertedWithCustomError(pvpArena, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from emergency withdraw", async function () {
            await expect(
                pvpArena.connect(player1).emergencyWithdraw()
            ).to.be.revertedWithCustomError(pvpArena, "OwnableUnauthorizedAccount");
        });
    });

    describe("Validation Tests - Challenge Requirements", function () {
        beforeEach(async function () {
            // Reset pause status
            await pvpArena.connect(owner).setPauseStatus(false, false, false);
            
            // Setup tokens
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const token1 = startSupply + 1n;
            await (await mockNft.mint(player2.address)).wait();
            const token2 = startSupply + 2n;
            
            await playerRegistry.connect(player1).setFormation(0, [token1]);
            await playerRegistry.connect(player2).setFormation(0, [token2]);
        });

        it("Should reject challenge with insufficient fee", async function () {
            const signedStats = createSignedStatsMock(1, signer);
            
            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    player2.address,
                    0,
                    [signedStats],
                    { value: ethers.parseEther("0.0005") } // Less than required
                )
            ).to.be.revertedWith("PvPArena: Insufficient challenge fee");
        });

        it("Should reject challenge to zero address", async function () {
            const signedStats = createSignedStatsMock(1, signer);
            
            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    ethers.ZeroAddress,
                    0,
                    [signedStats],
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: Invalid opponent");
        });

        it("Should reject self-challenge", async function () {
            const signedStats = createSignedStatsMock(1, signer);
            
            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    player1.address,
                    0,
                    [signedStats],
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: Invalid opponent");
        });

        it("Should reject challenge from unregistered challenger", async function () {
            const [,,,,,,,unregisteredPlayer] = await ethers.getSigners();
            await (await mockNft.mint(unregisteredPlayer.address)).wait();
            
            const signedStats = createSignedStatsMock(1, signer);
            
            await expect(
                pvpArena.connect(unregisteredPlayer).createRankingChallenge(
                    player2.address,
                    0,
                    [signedStats],
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: Challenger not registered");
        });

        it("Should reject challenge to unregistered opponent", async function () {
            const [,,,,,,,unregisteredPlayer] = await ethers.getSigners();
            const signedStats = createSignedStatsMock(1, signer);
            
            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    unregisteredPlayer.address,
                    0,
                    [signedStats],
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: Opponent not registered");
        });

        it("Should reject challenge without active formation", async function () {
            // Clear formation
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId = startSupply + 1n;
            const signedStats = createSignedStatsMock(tokenId, signer);
            
            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    player2.address,
                    1, // 3v3 formation which doesn't exist
                    [signedStats],
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: No active formation");
        });

        it("Should reject challenge if formation is in use", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId = startSupply + 1n;
            await playerRegistry.setFormationInUse(player1.address, 0, true);
            
            const signedStats = createSignedStatsMock(tokenId, signer);
            
            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    player2.address,
                    0,
                    [signedStats],
                    { value: ethers.parseEther("0.001") }
                )
            ).to.be.revertedWith("PvPArena: Formation in use");
        });
    });

    describe("Gas Comparison Tests", function () {
        beforeEach(async function () {
            await pvpArena.connect(owner).setPauseStatus(false, false, false);
            
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const token1 = startSupply + 1n;
            await (await mockNft.mint(player2.address)).wait();
            const token2 = startSupply + 2n;
            
            await playerRegistry.connect(player1).setFormation(0, [token1]);
            await playerRegistry.connect(player2).setFormation(0, [token2]);
        });

        it("Should measure gas for ranking challenge creation", async function () {
            const signedStats = createSignedStatsMock(1, signer);
            const tx = await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                0,
                [signedStats],
                { value: ethers.parseEther("0.001") }
            );
            const receipt = await tx.wait();
            
            expect(receipt.gasUsed).to.be.lessThan(300000);
        });

        it("Should measure gas for wager challenge creation (ETH)", async function () {
            const wagerAmount = ethers.parseEther("1.0");
            const signedStats = createSignedStatsMock(1, signer);
            
            const tx = await pvpArena.connect(player1).createWagerChallenge(
                player2.address,
                0,
                ethers.ZeroAddress,
                wagerAmount,
                [signedStats],
                { value: ethers.parseEther("1.001") }
            );
            const receipt = await tx.wait();
            
            expect(receipt.gasUsed).to.be.lessThan(350000);
        });

        it("Should measure gas for wager challenge creation (ERC20)", async function () {
            const wagerAmount = ethers.parseEther("10.0");
            await mockERC20.approve(await pvpArena.getAddress(), wagerAmount);
            const signedStats = createSignedStatsMock(1, signer);
            
            const tx = await pvpArena.connect(player1).createWagerChallenge(
                player2.address,
                0,
                await mockERC20.getAddress(),
                wagerAmount,
                [signedStats],
                { value: ethers.parseEther("0.001") }
            );
            const receipt = await tx.wait();
            
            // ERC20 transfer adds gas
            expect(receipt.gasUsed).to.be.lessThan(400000);
        });

        it("Should compare gas: 1v1 vs 3v3 vs 5v5 ranking challenges", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const token1 = startSupply + 1n;
            await (await mockNft.mint(player1.address)).wait();
            const token3_1 = startSupply + 2n;
            await (await mockNft.mint(player1.address)).wait();
            const token3_2 = startSupply + 3n;
            await (await mockNft.mint(player1.address)).wait();
            const token3_3 = startSupply + 4n;
            
            await playerRegistry.connect(player1).setFormation(1, [token3_1, token3_2, token3_3]);
            
            const signedStats1 = createSignedStatsMock(token1, signer);
            const signedStats3 = createSignedStatsMock(token3_1, signer);
            
            // 1v1 challenge
            const tx1 = await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                0,
                [signedStats1],
                { value: ethers.parseEther("0.001") }
            );
            const receipt1 = await tx1.wait();
            
            // 3v3 challenge  
            const tx3 = await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                1,
                [signedStats3],
                { value: ethers.parseEther("0.001") }
            );
            const receipt3 = await tx3.wait();
            
            // 3v3 should cost more due to multiple stats signatures
            expect(receipt3.gasUsed).to.be.greaterThan(receipt1.gasUsed);
        });
    });
});

// Helper function to create properly signed stats with real ECDSA signatures
async function createSignedStats(tokenId, stats, expiration, signer, playerAddress) {
    // This creates a properly signed message that PvPArena's _verifyStatsSignature will accept
    // The signature verification in PvPArena checks: keccak256(tokenId, stats, expiration, player)
    const message = ethers.solidityPackedKeccak256(
        ["uint256", "uint256[8]", "uint256", "address"],
        [tokenId, stats, expiration, playerAddress]
    );
    
    // Create ECDSA signature
    const signature = await signer.signMessage(ethers.getBytes(message));
    
    return {
        tokenId: tokenId,
        stats: stats,
        expiration: expiration,
        signature: signature
    };
}

// Simplified helper for basic tests (without real signature, will fail validation)
function createSignedStatsMock(tokenId, signer) {
    const stats = {
        tokenId: tokenId,
        stats: [100, 50, 100, 500, 0, 0, 100, 0], // power, defense, speed, hp, stamina, mana, critical, luck
        expiration: Math.floor(Date.now() / 1000) + 3600,
        signature: "0x" + "00".repeat(65) // Placeholder - would need actual signature
    };

    return stats;
}
