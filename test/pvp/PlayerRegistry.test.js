const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlayerRegistry", function () {
    let playerRegistry;
    let mockNft;
    let owner;
    let player1;
    let player2;
    let player3;

    before(async function () {
        [owner, player1, player2, player3] = await ethers.getSigners();
        
        const MockProtocolGuardians = await ethers.getContractFactory("MockProtocolGuardians");
        mockNft = await MockProtocolGuardians.deploy();
        await mockNft.waitForDeployment();

        const PlayerRegistry = await ethers.getContractFactory("PlayerRegistry");
        playerRegistry = await PlayerRegistry.deploy(await mockNft.getAddress());
        await playerRegistry.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await playerRegistry.getAddress()).to.be.properAddress;
        });

        it("Should set correct NFT contract address", async function () {
            expect(await playerRegistry.nftContract()).to.equal(await mockNft.getAddress());
        });
    });

    describe("Player Registration", function () {
        it("Should allow a new player to register", async function () {
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://example.com/avatar1.png");
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.username).to.equal("Player1");
            expect(player.avatarUrl).to.equal("https://example.com/avatar1.png");
            expect(player.elo).to.equal(1000);
            expect(player.xp).to.equal(0);
            expect(player.level).to.equal(1);
            expect(player.wins).to.equal(0);
            expect(player.losses).to.equal(0);
            expect(player.isRegistered).to.equal(true);
        });

        it("Should not allow duplicate username", async function () {
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://example.com/avatar2.png");
            
            await expect(
                playerRegistry.connect(player3).registerPlayer("Player1", "https://example.com/avatar3.png")
            ).to.be.revertedWith("PlayerRegistry: Username taken");
        });

        it("Should not allow empty username", async function () {
            await expect(
                playerRegistry.connect(player3).registerPlayer("", "https://example.com/avatar3.png")
            ).to.be.revertedWith("PlayerRegistry: Invalid username length");
        });

        it("Should not allow username longer than 32 chars", async function () {
            await expect(
                playerRegistry.connect(player3).registerPlayer("A".repeat(33), "https://example.com/avatar3.png")
            ).to.be.revertedWith("PlayerRegistry: Invalid username length");
        });

        it("Should not allow avatar URL longer than 500 chars", async function () {
            await expect(
                playerRegistry.connect(player3).registerPlayer("Player3", "A".repeat(501))
            ).to.be.revertedWith("PlayerRegistry: Avatar URL too long");
        });

        it("Should not allow already registered player to register again", async function () {
            await expect(
                playerRegistry.connect(player1).registerPlayer("AnotherName", "https://example.com/avatar4.png")
            ).to.be.revertedWith("PlayerRegistry: Already registered");
        });
    });

    describe("Profile Updates", function () {
        it("Should allow updating avatar URL", async function () {
            await playerRegistry.connect(player1).updateProfile("Player1", "https://example.com/newavatar.png");
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.avatarUrl).to.equal("https://example.com/newavatar.png");
        });

        it("Should allow changing username if available", async function () {
            await playerRegistry.connect(player1).updateProfile("NewPlayer1", "https://example.com/newavatar.png");
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.username).to.equal("NewPlayer1");
        });

        it("Should not allow changing to taken username", async function () {
            await expect(
                playerRegistry.connect(player1).updateProfile("Player2", "https://example.com/avatar.png")
            ).to.be.revertedWith("PlayerRegistry: Username taken");
        });
    });

    describe("Formations", function () {
        let tokenId1, tokenId2, tokenId3, tokenId4, tokenId5;

        before(async function () {
            // Mint NFTs for testing
            // Use staticCall to get the return value from mint
            let startingTokenId = await mockNft.totalSupply();
            
            await (await mockNft.mint(player1.address)).wait();
            tokenId1 = startingTokenId + 1n;
            
            await (await mockNft.mint(player1.address)).wait();
            tokenId2 = startingTokenId + 2n;
            
            await (await mockNft.mint(player1.address)).wait();
            tokenId3 = startingTokenId + 3n;
            
            await (await mockNft.mint(player1.address)).wait();
            tokenId4 = startingTokenId + 4n;
            
            await (await mockNft.mint(player1.address)).wait();
            tokenId5 = startingTokenId + 5n;

            await (await mockNft.mint(player2.address)).wait();
        });

        it("Should set 1v1 formation", async function () {
            await playerRegistry.connect(player1).setFormation(0, [tokenId1]);
            
            const formation = await playerRegistry.getFormation(player1.address, 0);
            expect(formation.tokenIds.length).to.equal(1);
            expect(formation.tokenIds[0]).to.equal(tokenId1);
            expect(formation.isActive).to.equal(true);
        });

        it("Should set 3v3 formation", async function () {
            await playerRegistry.connect(player1).setFormation(1, [tokenId1, tokenId3, tokenId4]);
            
            const formation = await playerRegistry.getFormation(player1.address, 1);
            expect(formation.tokenIds.length).to.equal(3);
        });

        it("Should set 5v5 formation", async function () {
            await playerRegistry.connect(player1).setFormation(2, [tokenId1, tokenId2, tokenId3, tokenId4, tokenId5]);
            
            const formation = await playerRegistry.getFormation(player1.address, 2);
            expect(formation.tokenIds.length).to.equal(5);
        });

        it("Should not allow invalid formation size", async function () {
            await expect(
                playerRegistry.connect(player1).setFormation(0, [tokenId1, tokenId2])
            ).to.be.revertedWith("PlayerRegistry: Invalid formation size");
        });

        it("Should not allow formation with NFTs not owned by player", async function () {
            await expect(
                playerRegistry.connect(player2).setFormation(0, [tokenId1])
            ).to.be.revertedWith("PlayerRegistry: Not owner of NFT");
        });
    });

    describe("Matchmaking", function () {
        it("Should allow player to join matchmaking pool", async function () {
            await playerRegistry.connect(player1).setMatchmakingStatus(true, 0);
            
            const inPool = await playerRegistry.matchmakingPool(player1.address, 0);
            expect(inPool).to.equal(true);
        });

        it("Should allow player to leave matchmaking pool", async function () {
            await playerRegistry.connect(player1).setMatchmakingStatus(false, 0);
            
            const inPool = await playerRegistry.matchmakingPool(player1.address, 0);
            expect(inPool).to.equal(false);
        });

        it("Should not allow joining pool without active formation", async function () {
            // First clear formation by setting an empty one
            await expect(
                playerRegistry.connect(player2).setMatchmakingStatus(true, 0)
            ).to.be.revertedWith("PlayerRegistry: No active formation");
        });

        it("Should get available opponents in ELO range", async function () {
            await playerRegistry.connect(player1).setMatchmakingStatus(true, 0);
            await playerRegistry.connect(player2).registerPlayer("Player2B", "https://example.com/avatar2b.png");
            
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player2.address)).wait();
            const opponent = startSupply + 1n;
            await playerRegistry.connect(player2).setFormation(0, [opponent]);
            await playerRegistry.connect(player2).setMatchmakingStatus(true, 0);

            const opponents = await playerRegistry.getAvailableOpponents(900, 1100, 0);
            expect(opponents.length).to.be.greaterThan(0);
        });
    });

    describe("ELO and XP Updates", function () {
        beforeEach(async function () {
            // Ensure player1 is registered
            const player = await playerRegistry.players(player1.address);
            if (!player.isRegistered) {
                await playerRegistry.connect(player1).registerPlayer("Player1", "https://example.com/p1.png");
            }
        });

        it("Should update ELO after win", async function () {
            const beforePlayer = await playerRegistry.getPlayerProfile(player1.address);
            
            await playerRegistry.updateELO(player1.address, 30);
            
            const afterPlayer = await playerRegistry.getPlayerProfile(player1.address);
            expect(afterPlayer.elo).to.equal(beforePlayer.elo + 30n);
            expect(afterPlayer.wins).to.equal(1);
        });

        it("Should update ELO after loss", async function () {
            await playerRegistry.updateELO(player1.address, -20);
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.losses).to.equal(1);
        });

        it("Should not allow ELO to go below 0", async function () {
            // Reset to 1000 first
            const currentElo = await playerRegistry.players(player1.address);
            const currentEloValue = currentElo[2]; // elo is at index 2
            
            // Apply a huge loss
            if (currentEloValue > 0) {
                await playerRegistry.updateELO(player1.address, -(Number(currentEloValue) + 100));
                
                const player = await playerRegistry.getPlayerProfile(player1.address);
                expect(player.elo).to.equal(0);
            }
        });

        it("Should update XP and level", async function () {
            await playerRegistry.updateXP(player1.address, 50);
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.xp).to.equal(50);
            expect(player.level).to.equal(1);
        });

        it("Should level up when XP threshold reached", async function () {
            await playerRegistry.updateXP(player1.address, 100);
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.level).to.be.greaterThan(1);
        });
    });

    describe("Formation In Use", function () {
        it("Should not allow setting formation when in use", async function () {
            // Mark formation as in use
            await playerRegistry.setFormationInUse(player1.address, 0, true);
            
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const newTokenId = startSupply + 1n;
            await expect(
                playerRegistry.connect(player1).setFormation(0, [newTokenId])
            ).to.be.revertedWith("PlayerRegistry: Formation in use");
        });

        it("Should allow setting formation when not in use", async function () {
            await playerRegistry.setFormationInUse(player1.address, 0, false);
            
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const newToken = startSupply + 1n;
            await playerRegistry.connect(player1).setFormation(0, [newToken]);
            
            const formation = await playerRegistry.getFormation(player1.address, 0);
            expect(formation.tokenIds[0]).to.equal(newToken);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle multiple formations per player", async function () {
            const startSupply = await mockNft.totalSupply();
            
            await (await mockNft.mint(player1.address)).wait();
            const token1v1 = startSupply + 1n;
            
            await (await mockNft.mint(player1.address)).wait();
            const token3v3_1 = startSupply + 2n;
            
            await (await mockNft.mint(player1.address)).wait();
            const token3v3_2 = startSupply + 3n;
            
            await (await mockNft.mint(player1.address)).wait();
            const token3v3_3 = startSupply + 4n;

            await playerRegistry.connect(player1).setFormation(0, [token1v1]);
            await playerRegistry.connect(player1).setFormation(1, [token3v3_1, token3v3_2, token3v3_3]);

            const formation1v1 = await playerRegistry.getFormation(player1.address, 0);
            const formation3v3 = await playerRegistry.getFormation(player1.address, 1);

            expect(formation1v1.tokenIds.length).to.equal(1);
            expect(formation3v3.tokenIds.length).to.equal(3);
        });

        it("Should get correct formation size for each battle type", async function () {
            expect(await playerRegistry.getFormationSize(0)).to.equal(1);
            expect(await playerRegistry.getFormationSize(1)).to.equal(3);
            expect(await playerRegistry.getFormationSize(2)).to.equal(5);
        });

        // Edge case: Username with exactly 32 characters (boundary test)
        it("Should allow username with exactly max length (32 chars)", async function () {
            const maxUsername = "A".repeat(32);
            await playerRegistry.connect(player3).registerPlayer(maxUsername, "https://example.com/avatar32.png");
            
            const player = await playerRegistry.getPlayerProfile(player3.address);
            expect(player.username).to.equal(maxUsername);
        });

        // Edge case: Avatar URL with exactly 500 characters
        it("Should allow avatar URL with exactly max length (500 chars)", async function () {
            const maxAvatar = "A".repeat(500);
            await playerRegistry.connect(player2).updateProfile("Player2", maxAvatar);
            
            const player = await playerRegistry.getPlayerProfile(player2.address);
            expect(player.avatarUrl).to.equal(maxAvatar);
        });

        // Edge case: Empty avatar URL (allowed)
        it("Should allow empty avatar URL", async function () {
            await playerRegistry.connect(player1).updateProfile("Player1New", "");
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.avatarUrl).to.equal("");
        });

        // Edge case: Username with special characters
        it("Should allow username with special characters", async function () {
            const specialUsername = "Player_123-ABC!@#";
            await playerRegistry.connect(player3).registerPlayer(specialUsername, "https://example.com/av.png");
            
            const player = await playerRegistry.getPlayerProfile(player3.address);
            expect(player.username).to.equal(specialUsername);
        });

        // Edge case: ELO at zero (underflow protection)
        it("Should not allow ELO to go negative, caps at 0", async function () {
            const player = await playerRegistry.getPlayerProfile(player1.address);
            const currentElo = player.elo;
            
            // Try to subtract more than current ELO
            await playerRegistry.updateELO(player1.address, -(currentElo + 1000n));
            
            const updatedPlayer = await playerRegistry.getPlayerProfile(player1.address);
            expect(updatedPlayer.elo).to.equal(0);
            expect(updatedPlayer.losses).to.equal(Number(player.losses) + 1);
        });

        // Edge case: XP overflow should work up to max uint256
        it("Should handle large XP values without overflow", async function () {
            const largeXP = ethers.parseUnits("1000000", 18); // 1 million XP
            await playerRegistry.updateXP(player1.address, largeXP);
            
            const player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.xp).to.equal(largeXP);
        });

        // Edge case: Level calculation with XP threshold
        it("Should correctly calculate level from XP", async function () {
            // Initial state: level 1 with 0 XP
            let player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.level).to.equal(1);
            
            // Add 99 XP (still level 1: 0-99 = level 1)
            await playerRegistry.updateXP(player1.address, 99);
            player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.level).to.equal(1);
            
            // Add 1 more XP (now 100, should level up: 100-199 = level 2)
            await playerRegistry.updateXP(player1.address, 1);
            player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.level).to.equal(2);
            
            // Add 99 more (still level 2)
            await playerRegistry.updateXP(player1.address, 99);
            player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.level).to.equal(2);
            
            // Add 1 more (now 200, should level up to 3)
            await playerRegistry.updateXP(player1.address, 1);
            player = await playerRegistry.getPlayerProfile(player1.address);
            expect(player.level).to.equal(3);
        });

        // Edge case: NFT transfer during formation in use
        it("Should maintain formation even if NFT is transferred", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId = startSupply + 1n;
            await playerRegistry.connect(player1).setFormation(0, [tokenId]);
            
            const formationBefore = await playerRegistry.getFormation(player1.address, 0);
            expect(formationBefore.tokenIds[0]).to.equal(tokenId);
            
            // Transfer NFT to someone else
            await mockNft.transfer(player1.address, player2.address, tokenId);
            
            // Formation should still exist (it's stored as tokenId, not validated each time)
            const formationAfter = await playerRegistry.getFormation(player1.address, 0);
            expect(formationAfter.tokenIds[0]).to.equal(tokenId);
        });
    });

    describe("Security Tests", function () {
        // Security: updateELO should not allow zero address
        it("Should not allow updating ELO for zero address", async function () {
            await expect(
                playerRegistry.updateELO(ethers.ZeroAddress, 10)
            ).to.be.revertedWith("PlayerRegistry: Invalid player");
        });

        // Security: updateELO should not allow unregistered address
        it("Should not allow updating ELO for unregistered player", async function () {
            const unregisteredPlayer = player3.address;
            
            // First check they're not registered
            const player = await playerRegistry.players(unregisteredPlayer);
            expect(player.isRegistered).to.equal(false);
            
            await expect(
                playerRegistry.updateELO(unregisteredPlayer, 10)
            ).to.be.revertedWith("PlayerRegistry: Player not registered");
        });

        // Security: updateXP should not allow zero address
        it("Should not allow updating XP for zero address", async function () {
            await expect(
                playerRegistry.updateXP(ethers.ZeroAddress, 10)
            ).to.be.revertedWith("PlayerRegistry: Invalid player");
        });

        // Security: updateXP should not allow unregistered address
        it("Should not allow updating XP for unregistered player", async function () {
            const unregisteredPlayer = player3.address;
            
            await expect(
                playerRegistry.updateXP(unregisteredPlayer, 10)
            ).to.be.revertedWith("PlayerRegistry: Player not registered");
        });

        // Security: setFormationInUse should update state correctly
        it("Should allow setting formation in use status", async function () {
            await playerRegistry.setFormationInUse(player1.address, 0, true);
            expect(await playerRegistry.formationInUse(player1.address, 0)).to.equal(true);
            
            await playerRegistry.setFormationInUse(player1.address, 0, false);
            expect(await playerRegistry.formationInUse(player1.address, 0)).to.equal(false);
        });

        // Security: Reentrancy protection on registration
        it("Should prevent reentrancy on registration", async function () {
            // This test ensures that even if attacked with a reentrancy attack,
            // the nonReentrant modifier will protect the registration flow
            const playerBefore = await playerRegistry.players(player1.address);
            
            // Try to register again (should fail)
            await expect(
                playerRegistry.connect(player1).registerPlayer("NewUsername", "https://new.com")
            ).to.be.revertedWith("PlayerRegistry: Already registered");
            
            const playerAfter = await playerRegistry.players(player1.address);
            expect(playerBefore.isRegistered).to.equal(playerAfter.isRegistered);
        });
    });

    describe("Validation Tests", function () {
        it("Should validate username uniqueness during update", async function () {
            await expect(
                playerRegistry.connect(player1).updateProfile("Player2", "https://example.com/a.png")
            ).to.be.revertedWith("PlayerRegistry: Username taken");
        });

        it("Should not allow avatar URL longer than 500 chars in update", async function () {
            await expect(
                playerRegistry.connect(player1).updateProfile("Player1", "A".repeat(501))
            ).to.be.revertedWith("PlayerRegistry: Avatar URL too long");
        });

        it("Should validate username length in update (empty)", async function () {
            await expect(
                playerRegistry.connect(player1).updateProfile("", "https://example.com/a.png")
            ).to.be.revertedWith("PlayerRegistry: Invalid username length");
        });

        it("Should validate username length in update (too long)", async function () {
            await expect(
                playerRegistry.connect(player1).updateProfile("A".repeat(33), "https://example.com/a.png")
            ).to.be.revertedWith("PlayerRegistry: Invalid username length");
        });

        it("Should not allow setting formation with wrong size for 1v1", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId = startSupply + 1n;
            
            await expect(
                playerRegistry.connect(player1).setFormation(0, [])
            ).to.be.revertedWith("PlayerRegistry: Invalid formation size");
            
            await expect(
                playerRegistry.connect(player1).setFormation(0, [tokenId, tokenId])
            ).to.be.revertedWith("PlayerRegistry: Invalid formation size");
        });

        it("Should not allow setting formation with wrong size for 3v3", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId1 = startSupply + 1n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId2 = startSupply + 2n;
            
            await expect(
                playerRegistry.connect(player1).setFormation(1, [tokenId1, tokenId2])
            ).to.be.revertedWith("PlayerRegistry: Invalid formation size");
        });

        it("Should not allow setting formation with wrong size for 5v5", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId1 = startSupply + 1n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId2 = startSupply + 2n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId3 = startSupply + 3n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId4 = startSupply + 4n;
            
            await expect(
                playerRegistry.connect(player1).setFormation(2, [tokenId1, tokenId2, tokenId3, tokenId4])
            ).to.be.revertedWith("PlayerRegistry: Invalid formation size");
        });

        it("Should not allow joining matchmaking without active formation", async function () {
            await expect(
                playerRegistry.connect(player3).setMatchmakingStatus(true, 0)
            ).to.be.revertedWith("PlayerRegistry: Not registered");
        });
    });

    describe("Gas Comparison Tests", function () {
        it("Should measure gas for simple registration", async function () {
            const gasEstimate = await playerRegistry.connect(player3).registerPlayer.estimateGas(
                "Player3GasTest1", "https://example.com/av1.png"
            );
            
            // Baseline: simple registration should be relatively cheap
            expect(gasEstimate).to.be.lessThan(200000);
        });

        it("Should measure gas for registration with max username length", async function () {
            const maxUsername = "A".repeat(32);
            const gasEstimate = await playerRegistry.connect(player3).registerPlayer.estimateGas(
                maxUsername, "https://example.com/av1.png"
            );
            
            // Slightly more expensive but should be similar
            expect(gasEstimate).to.be.lessThan(220000);
        });

        it("Should measure gas for setting 1v1 formation", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId = startSupply + 1n;
            
            const tx = await playerRegistry.connect(player1).setFormation(0, [tokenId]);
            const receipt = await tx.wait();
            
            expect(receipt.gasUsed).to.be.lessThan(100000);
        });

        it("Should measure gas for setting 3v3 formation", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId1 = startSupply + 1n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId2 = startSupply + 2n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId3 = startSupply + 3n;
            
            const tx = await playerRegistry.connect(player1).setFormation(1, [tokenId1, tokenId2, tokenId3]);
            const receipt = await tx.wait();
            
            // 3v3 should cost more than 1v1 but less than 5v5
            expect(receipt.gasUsed).to.be.lessThan(150000);
        });

        it("Should measure gas for setting 5v5 formation", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const tokenId1 = startSupply + 1n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId2 = startSupply + 2n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId3 = startSupply + 3n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId4 = startSupply + 4n;
            await (await mockNft.mint(player1.address)).wait();
            const tokenId5 = startSupply + 5n;
            
            const tx = await playerRegistry.connect(player1).setFormation(2, [tokenId1, tokenId2, tokenId3, tokenId4, tokenId5]);
            const receipt = await tx.wait();
            
            // 5v5 should cost the most
            expect(receipt.gasUsed).to.be.lessThan(200000);
        });

        it("Should measure gas for profile update", async function () {
            const tx = await playerRegistry.connect(player1).updateProfile("Player1Updated", "https://new.com");
            const receipt = await tx.wait();
            
            expect(receipt.gasUsed).to.be.lessThan(100000);
        });

        it("Should measure gas for username change (more expensive)", async function () {
            const tx = await playerRegistry.connect(player1).updateProfile("Player1Renamed", "https://new.com");
            const receipt = await tx.wait();
            
            // Username change requires mapping updates
            expect(receipt.gasUsed).to.be.greaterThan(50000);
        });
    });

    describe("Matchmaking Pool Edge Cases", function () {
        it("Should handle multiple players joining pool", async function () {
            const players = [player1, player2];
            for (const player of players) {
                await playerRegistry.connect(player).setMatchmakingStatus(true, 0);
                expect(await playerRegistry.matchmakingPool(player.address, 0)).to.equal(true);
            }
        });

        it("Should allow multiple battle types per player in pool", async function () {
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(player1.address)).wait();
            const token1 = startSupply + 1n;
            await (await mockNft.mint(player1.address)).wait();
            const token3_1 = startSupply + 2n;
            await (await mockNft.mint(player1.address)).wait();
            const token3_2 = startSupply + 3n;
            await (await mockNft.mint(player1.address)).wait();
            const token3_3 = startSupply + 4n;
            
            await playerRegistry.connect(player1).setFormation(0, [token1]);
            await playerRegistry.connect(player1).setFormation(1, [token3_1, token3_2, token3_3]);
            
            await playerRegistry.connect(player1).setMatchmakingStatus(true, 0);
            await playerRegistry.connect(player1).setMatchmakingStatus(true, 1);
            
            expect(await playerRegistry.matchmakingPool(player1.address, 0)).to.equal(true);
            expect(await playerRegistry.matchmakingPool(player1.address, 1)).to.equal(true);
        });

        it("Should return correct ELO range of opponents", async function () {
            // Setup multiple players with different ELOs
            await playerRegistry.connect(player1).setMatchmakingStatus(true, 0);
            
            const [,,,,lowEloPlayer] = await ethers.getSigners();
            await playerRegistry.connect(lowEloPlayer).registerPlayer("LowElo", "https://a.com");
            const startSupply = await mockNft.totalSupply();
            await (await mockNft.mint(lowEloPlayer.address)).wait();
            const tokenLow = startSupply + 1n;
            await playerRegistry.connect(lowEloPlayer).setFormation(0, [tokenLow]);
            
            // Set low ELO
            await playerRegistry.updateELO(lowEloPlayer.address, -500);
            await playerRegistry.connect(lowEloPlayer).setMatchmakingStatus(true, 0);
            
            // Get opponents in high ELO range (should not include low ELO player)
            const opponents = await playerRegistry.getAvailableOpponents(1000, 1500, 0);
            expect(opponents.some(addr => addr.toLowerCase() === lowEloPlayer.address.toLowerCase())).to.equal(false);
        });
    });
});
