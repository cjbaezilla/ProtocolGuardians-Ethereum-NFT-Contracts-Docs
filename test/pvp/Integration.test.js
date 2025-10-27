const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PvP Integration Tests", function () {
    let mockNFT, playerRegistry, battleEngine, pvpArena, mockERC20;
    let owner, player1, player2, player3;
    let signer, signerAddress, signerPrivateKey;

    beforeEach(async function () {
        [owner, player1, player2, player3] = await ethers.getSigners();

        // Setup signer for stats verification
        signerPrivateKey = "0x" + "1".repeat(64);
        signer = new ethers.Wallet(signerPrivateKey, ethers.provider);
        signerAddress = await signer.getAddress();
        await owner.sendTransaction({
            to: signerAddress,
            value: ethers.parseEther("1.0")
        });

        // Deploy mock NFT
        const MockNFT = await ethers.getContractFactory("MockProtocolGuardians");
        mockNFT = await MockNFT.deploy();
        await mockNFT.waitForDeployment();

        // Mint NFTs for testing
        await mockNFT.connect(player1).mint(player1.address, [1, 2, 3]);
        await mockNFT.connect(player2).mint(player2.address, [4, 5, 6]);
        await mockNFT.connect(player3).mint(player3.address, [7, 8, 9]);

        // Deploy PlayerRegistry
        const PlayerRegistry = await ethers.getContractFactory("PlayerRegistry");
        playerRegistry = await PlayerRegistry.deploy(
            await mockNFT.getAddress(),
            1000, // initial ELO
            100  // XP per level
        );
        await playerRegistry.waitForDeployment();

        // Deploy BattleEngine
        const BattleEngine = await ethers.getContractFactory("BattleEngine");
        battleEngine = await BattleEngine.deploy(
            50,  // max turns
            115, // type advantage bonus (115%)
            200, // critical multiplier (2x = 200%)
            1    // min damage
        );
        await battleEngine.waitForDeployment();

        // Deploy PvPArena
        const PvPArena = await ethers.getContractFactory("PvPArena");
        pvpArena = await PvPArena.deploy(
            await playerRegistry.getAddress(),
            await battleEngine.getAddress(),
            signerAddress,
            ethers.parseEther("0.001"), // challenge fee
            3 // 3% protocol fee
        );
        await pvpArena.waitForDeployment();

        // Deploy MockERC20 for betting
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockERC20 = await MockERC20.deploy();
        await mockERC20.waitForDeployment();

        // Mint tokens for players
        await mockERC20.connect(player1).mint(player1.address, ethers.parseEther("100"));
        await mockERC20.connect(player2).mint(player2.address, ethers.parseEther("100"));
        await mockERC20.connect(player3).mint(player3.address, ethers.parseEther("100"));
    });

    function createSignedStats(tokenId, stats, expiration) {
        const message = ethers.solidityPackedKeccak256(
            ["uint256", "uint256[8]", "uint256"],
            [tokenId, stats, expiration]
        );
        const signature = signer.signingKey.sign(message);
        return signature.serialized;
    }

    describe("Complete Flow: Registration → Formation → Challenge → Battle", function () {
        it("Should complete full ranking challenge flow (1v1)", async function () {
            // 1. Register players
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            // 2. Setup formations
            const expiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour
            const stats1 = [100, 50, 80, 200, 500, 0, 0, 300]; // [power, defense, speed, hp, luck, mana, stamina, critical]
            const stats2 = [90, 60, 70, 180, 400, 0, 0, 250];
            
            const signedStats1 = createSignedStats(1, stats1, expiration);
            const signedStats2 = createSignedStats(4, stats2, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]); // 1v1
            await playerRegistry.connect(player2).setFormation(0, [4]); // 1v1

            // 3. Create ranking challenge
            const challengeFee = await pvpArena.challengeFee();
            await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                0, // 1v1
                [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            // Verify challenge created
            const nextId = await pvpArena.nextChallengeId();
            const challenge = await pvpArena.getChallengeDetails(nextId - 1n);
            expect(challenge.challenger).to.equal(player1.address);
            expect(challenge.opponent).to.equal(player2.address);
            expect(challenge.battleType).to.equal(0);

            // 4. Accept challenge and execute battle
            await pvpArena.connect(player2).acceptChallenge(
                nextId - 1n,
                [{ tokenId: 4, stats: stats2, expiration: expiration, signature: signedStats2 }]
            );

            // 5. Verify results
            const player1Profile = await playerRegistry.players(player1.address);
            const player2Profile = await playerRegistry.players(player2.address);
            
            // Winner should gain ELO and XP, loser should lose ELO and gain XP
            expect(Number(player1Profile[2]) + Number(player2Profile[2])).to.equal(2000); // Total ELO unchanged
            expect(Number(player1Profile[3])).to.be.greaterThan(0); // Winner gains XP
            expect(Number(player2Profile[3])).to.be.greaterThan(0); // Loser gains XP
        });

        it("Should complete full wager challenge flow", async function () {
            // 1. Register players
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            // 2. Setup formations
            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats1 = [120, 50, 90, 250, 600, 0, 0, 400];
            const stats2 = [100, 70, 70, 200, 500, 0, 0, 300];
            
            const signedStats1 = createSignedStats(1, stats1, expiration);
            const signedStats2 = createSignedStats(4, stats2, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            // 3. Approve ERC20 and create wager challenge
            const wagerAmount = ethers.parseEther("10");
            const challengeFee = await pvpArena.challengeFee();
            
            await mockERC20.connect(player1).approve(await pvpArena.getAddress(), wagerAmount);
            
            await pvpArena.connect(player1).createWagerChallenge(
                player2.address,
                0, // 1v1
                await mockERC20.getAddress(),
                wagerAmount,
                [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            // 4. Accept wager challenge
            await mockERC20.connect(player2).approve(await pvpArena.getAddress(), wagerAmount);
            
            const initialBalance1 = await mockERC20.balanceOf(player1.address);
            const initialBalance2 = await mockERC20.balanceOf(player2.address);

            const nextId = await pvpArena.nextChallengeId();
            await pvpArena.connect(player2).acceptChallenge(
                nextId - 1n,
                [{ tokenId: 4, stats: stats2, expiration: expiration, signature: signedStats2 }]
            );

            // 5. Verify winner receives 97% of total (3% protocol fee)
            const finalBalance1 = await mockERC20.balanceOf(player1.address);
            const finalBalance2 = await mockERC20.balanceOf(player2.address);
            
            const totalWagered = wagerAmount * 2n;
            const protocolFee = (totalWagered * 3n) / 100n;
            const winnerPayout = totalWagered - protocolFee;

            // Player 1 should have won (better stats)
            expect(finalBalance1 - initialBalance1).to.equal(winnerPayout - wagerAmount);
            expect(finalBalance2).to.equal(initialBalance2);
        });

        it("Should handle 3v3 battle correctly", async function () {
            // 1. Register players
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            // 2. Setup 3v3 formations
            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats1a = [100, 50, 80, 200, 500, 0, 0, 300];
            const stats1b = [90, 55, 75, 180, 450, 0, 0, 250];
            const stats1c = [85, 60, 70, 170, 400, 0, 0, 200];
            
            const stats2a = [95, 52, 78, 190, 480, 0, 0, 280];
            const stats2b = [88, 57, 73, 175, 430, 0, 0, 240];
            const stats2c = [82, 62, 68, 165, 380, 0, 0, 190];

            const signedStats1a = createSignedStats(1, stats1a, expiration);
            const signedStats1b = createSignedStats(2, stats1b, expiration);
            const signedStats1c = createSignedStats(3, stats1c, expiration);
            
            const signedStats2a = createSignedStats(4, stats2a, expiration);
            const signedStats2b = createSignedStats(5, stats2b, expiration);
            const signedStats2c = createSignedStats(6, stats2c, expiration);

            await playerRegistry.connect(player1).setFormation(1, [1, 2, 3]);
            await playerRegistry.connect(player2).setFormation(1, [4, 5, 6]);

            // 3. Create challenge
            const challengeFee = await pvpArena.challengeFee();
            await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                1, // 3v3
                [
                    { tokenId: 1, stats: stats1a, expiration: expiration, signature: signedStats1a },
                    { tokenId: 2, stats: stats1b, expiration: expiration, signature: signedStats1b },
                    { tokenId: 3, stats: stats1c, expiration: expiration, signature: signedStats1c }
                ],
                { value: challengeFee }
            );

            // 4. Accept challenge
            const nextId = await pvpArena.nextChallengeId();
            await pvpArena.connect(player2).acceptChallenge(
                nextId - 1n,
                [
                    { tokenId: 4, stats: stats2a, expiration: expiration, signature: signedStats2a },
                    { tokenId: 5, stats: stats2b, expiration: expiration, signature: signedStats2b },
                    { tokenId: 6, stats: stats2c, expiration: expiration, signature: signedStats2c }
                ]
            );

            // Verify battle completed
            const player1Profile = await playerRegistry.players(player1.address);
            const player2Profile = await playerRegistry.players(player2.address);
            
            expect(Number(player1Profile[2]) + Number(player2Profile[2])).to.equal(2000);
        });

        it("Should handle challenge cancellation with penalty", async function () {
            // 1. Register and setup
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats1 = [100, 50, 80, 200, 500, 0, 0, 300];
            const signedStats1 = createSignedStats(1, stats1, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            // 2. Create wager challenge
            const wagerAmount = ethers.parseEther("10");
            const challengeFee = await pvpArena.challengeFee();
            
            await mockERC20.connect(player1).approve(await pvpArena.getAddress(), wagerAmount);
            await pvpArena.connect(player1).createWagerChallenge(
                player2.address,
                0,
                await mockERC20.getAddress(),
                wagerAmount,
                [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            const nextId = await pvpArena.nextChallengeId();

            // 3. Cancel challenge (should incur 5% penalty)
            const initialProtocolBalance = await mockERC20.balanceOf(await pvpArena.getAddress());
            
            await pvpArena.connect(player1).cancelChallenge(nextId - 1n);

            // 4. Verify 95% returned, 5% to protocol
            const penalty = wagerAmount * 5n / 100n;
            const finalProtocolBalance = await mockERC20.balanceOf(await pvpArena.getAddress());
            
            expect(finalProtocolBalance - initialProtocolBalance).to.equal(penalty);
        });

        it("Should handle multiple concurrent challenges", async function () {
            // 1. Register all players
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");
            await playerRegistry.connect(player3).registerPlayer("Player3", "https://avatar3.com");

            // 2. Setup formations
            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats = [100, 50, 80, 200, 500, 0, 0, 300];
            const signedStats1 = createSignedStats(1, stats, expiration);
            const signedStats4 = createSignedStats(4, stats, expiration);
            const signedStats7 = createSignedStats(7, stats, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);
            await playerRegistry.connect(player3).setFormation(0, [7]);

            // 3. Player1 challenges both player2 and player3
            const challengeFee = await pvpArena.challengeFee();
            
            await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                0,
                [{ tokenId: 1, stats: stats, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            await pvpArena.connect(player1).createRankingChallenge(
                player3.address,
                0,
                [{ tokenId: 1, stats: stats, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            // Verify both challenges exist
            const challenges1 = await pvpArena.getPlayerChallenges(player1.address);
            expect(challenges1.length).to.equal(2);
        });

        it("Should handle NFT transfer during active challenge", async function () {
            // 1. Setup and create challenge
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats1 = [100, 50, 80, 200, 500, 0, 0, 300];
            const signedStats1 = createSignedStats(1, stats1, expiration);
            
            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            const challengeFee = await pvpArena.challengeFee();
            await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                0,
                [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            const nextId = await pvpArena.nextChallengeId();
            
            // 2. Transfer NFT during challenge (should not affect challenge)
            await mockNFT.transfer(player1.address, player3.address, 1);
            
            // 3. Accept challenge with transferred NFT
            const stats2 = [90, 60, 70, 180, 400, 0, 0, 250];
            const signedStats2 = createSignedStats(4, stats2, expiration);
            
            await pvpArena.connect(player2).acceptChallenge(
                nextId - 1n,
                [{ tokenId: 4, stats: stats2, expiration: expiration, signature: signedStats2 }]
            );

            // Challenge should complete despite transfer
            const challenge = await pvpArena.getChallengeDetails(nextId - 1n);
            expect(challenge.status).to.equal(3); // Completed
        });

        it("Should handle massive spam of concurrent challenges", async function () {
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats = [100, 50, 80, 200, 500, 0, 0, 300];
            const signedStats = createSignedStats(1, stats, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            const challengeFee = await pvpArena.challengeFee();
            
            // Create 10 concurrent challenges
            for (let i = 0; i < 10; i++) {
                await pvpArena.connect(player1).createRankingChallenge(
                    player2.address,
                    0,
                    [{ tokenId: 1, stats: stats, expiration: expiration, signature: signedStats }],
                    { value: challengeFee }
                );
            }

            const challenges = await pvpArena.getPlayerChallenges(player1.address);
            expect(challenges.length).to.be.greaterThanOrEqual(10);
        });

        it("Should handle wager with 100% protocol fee", async function () {
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats1 = [100, 50, 80, 200, 500, 0, 0, 300];
            const stats2 = [90, 60, 70, 180, 400, 0, 0, 250];
            
            const signedStats1 = createSignedStats(1, stats1, expiration);
            const signedStats2 = createSignedStats(4, stats2, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            // Set 100% protocol fee
            await pvpArena.connect(owner).setProtocolFee(10000); // 100%
            
            const wagerAmount = ethers.parseEther("10");
            const challengeFee = await pvpArena.challengeFee();
            
            await mockERC20.connect(player1).approve(await pvpArena.getAddress(), wagerAmount);
            await pvpArena.connect(player1).createWagerChallenge(
                player2.address,
                0,
                await mockERC20.getAddress(),
                wagerAmount,
                [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            await mockERC20.connect(player2).approve(await pvpArena.getAddress(), wagerAmount);
            
            const nextId = await pvpArena.nextChallengeId();
            await pvpArena.connect(player2).acceptChallenge(
                nextId - 1n,
                [{ tokenId: 4, stats: stats2, expiration: expiration, signature: signedStats2 }]
            );

            // Winner should get 0% (all goes to protocol)
            const balance1 = await mockERC20.balanceOf(player1.address);
            const balance2 = await mockERC20.balanceOf(player2.address);
            
            // Both players should lose their wagered amount
            expect(balance1).to.be.lessThan(ethers.parseEther("100"));
            expect(balance2).to.be.lessThan(ethers.parseEther("100"));
        });

        it("Should handle all pausables activated", async function () {
            // Activate all pauses
            await pvpArena.connect(owner).setPauseStatus(true, true, true);
            
            expect(await pvpArena.pauseMatchmaking()).to.equal(true);
            expect(await pvpArena.pauseWagers()).to.equal(true);
            expect(await pvpArena.pauseRanking()).to.equal(true);

            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            const token1 = await mockNFT.mint(player1.address);
            const token2 = await mockNFT.mint(player2.address);

            await playerRegistry.connect(player1).setFormation(0, [token1]);
            await playerRegistry.connect(player2).setFormation(0, [token2]);

            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats = [100, 50, 80, 200, 500, 0, 0, 300];
            const signedStats = createSignedStats(1, stats, expiration);

            // Should fail due to pauseRanking
            const challengeFee = await pvpArena.challengeFee();
            await expect(
                pvpArena.connect(player1).createRankingChallenge(
                    player2.address,
                    0,
                    [{ tokenId: 1, stats: stats, expiration: expiration, signature: signedStats }],
                    { value: challengeFee }
                )
            ).to.be.revertedWith("PvPArena: Ranking challenges paused");

            // Should fail due to pauseWagers
            const wagerAmount = ethers.parseEther("1");
            await mockERC20.connect(player1).approve(await pvpArena.getAddress(), wagerAmount);
            
            await expect(
                pvpArena.connect(player1).createWagerChallenge(
                    player2.address,
                    0,
                    await mockERC20.getAddress(),
                    wagerAmount,
                    [{ tokenId: 1, stats: stats, expiration: expiration, signature: signedStats }],
                    { value: challengeFee }
                )
            ).to.be.revertedWith("PvPArena: Wager challenges paused");
        });

        it("Should handle wager with zero amount (edge case)", async function () {
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats1 = [100, 50, 80, 200, 500, 0, 0, 300];
            const signedStats1 = createSignedStats(1, stats1, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            // Reset pauses
            await pvpArena.connect(owner).setPauseStatus(false, false, false);

            const challengeFee = await pvpArena.challengeFee();
            
            // Should reject zero wager
            await expect(
                pvpArena.connect(player1).createWagerChallenge(
                    player2.address,
                    0,
                    await mockERC20.getAddress(),
                    0,
                    [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                    { value: challengeFee }
                )
            ).to.be.revertedWith("PvPArena: Invalid wager amount");
        });

        it("Should handle signature expiration during challenge", async function () {
            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            // Create signature that expires very soon
            const expiration = Math.floor(Date.now() / 1000) + 2; // 2 seconds
            const stats1 = [100, 50, 80, 200, 500, 0, 0, 300];
            const signedStats1 = createSignedStats(1, stats1, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            const challengeFee = await pvpArena.challengeFee();
            await pvpArena.connect(player1).createRankingChallenge(
                player2.address,
                0,
                [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 3000));

            const nextId = await pvpArena.nextChallengeId();
            const stats2 = [90, 60, 70, 180, 400, 0, 0, 250];
            const signedStats2 = createSignedStats(4, stats2, expiration);

            // Accept should revert due to expired signature
            await expect(
                pvpArena.connect(player2).acceptChallenge(
                    nextId - 1n,
                    [{ tokenId: 4, stats: stats2, expiration: expiration, signature: signedStats2 }]
                )
            ).to.be.revertedWith("PvPArena: Stats expired");
        });

        it("Should handle multiple ERC20 tokens in wagers", async function () {
            // Deploy second ERC20
            const MockERC20_2 = await ethers.getContractFactory("MockERC20");
            const mockERC20_2 = await MockERC20_2.deploy();
            await mockERC20_2.waitForDeployment();

            await playerRegistry.connect(player1).registerPlayer("Player1", "https://avatar1.com");
            await playerRegistry.connect(player2).registerPlayer("Player2", "https://avatar2.com");

            const expiration = Math.floor(Date.now() / 1000) + 3600;
            const stats1 = [100, 50, 80, 200, 500, 0, 0, 300];
            const stats2 = [90, 60, 70, 180, 400, 0, 0, 250];
            
            const signedStats1 = createSignedStats(1, stats1, expiration);
            const signedStats2 = createSignedStats(4, stats2, expiration);

            await playerRegistry.connect(player1).setFormation(0, [1]);
            await playerRegistry.connect(player2).setFormation(0, [4]);

            await mockERC20_2.connect(player1).mint(player1.address, ethers.parseEther("100"));
            await mockERC20_2.connect(player2).mint(player2.address, ethers.parseEther("100"));

            const wagerAmount = ethers.parseEther("10");
            const challengeFee = await pvpArena.challengeFee();
            
            await mockERC20_2.connect(player1).approve(await pvpArena.getAddress(), wagerAmount);
            await pvpArena.connect(player1).createWagerChallenge(
                player2.address,
                0,
                await mockERC20_2.getAddress(),
                wagerAmount,
                [{ tokenId: 1, stats: stats1, expiration: expiration, signature: signedStats1 }],
                { value: challengeFee }
            );

            await mockERC20_2.connect(player2).approve(await pvpArena.getAddress(), wagerAmount);
            
            const nextId = await pvpArena.nextChallengeId();
            await pvpArena.connect(player2).acceptChallenge(
                nextId - 1n,
                [{ tokenId: 4, stats: stats2, expiration: expiration, signature: signedStats2 }]
            );

            // Winner should receive tokens
            const balance1 = await mockERC20_2.balanceOf(player1.address);
            const balance2 = await mockERC20_2.balanceOf(player2.address);
            
            // One should have won, the other lost
            expect(balance1 + balance2).to.be.greaterThan(ethers.parseEther("180")); // Protocol fee taken
        });
    });
});
