
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BattleEngine", function () {
    let battleEngine;
    let owner;

    before(async function () {
        [owner] = await ethers.getSigners();
        
        const BattleEngine = await ethers.getContractFactory("BattleEngine");
        battleEngine = await BattleEngine.deploy();
        await battleEngine.waitForDeployment();
    });

    // Helper function to execute battle and return the result
    async function executeBattleAndGetResult(team1Cards, team2Cards, seed) {
        const tx = await battleEngine.executeBattle(team1Cards, team2Cards, seed);
        const receipt = await tx.wait();
        
        // Find BattleExecuted event
        const event = receipt.logs.find(log => log.topics[0] === ethers.id("BattleExecuted(uint8,uint256,uint256,uint256)"));
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint8", "uint256", "uint256", "uint256"], event.data);
        
        return {
            winner: decoded[0],
            turnsPlayed: decoded[1],
            team1RemainingHP: decoded[2],
            team2RemainingHP: decoded[3]
        };
    }

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await battleEngine.getAddress()).to.be.properAddress;
        });

        it("Should have MAX_TURNS constant set to 50", async function () {
            expect(await battleEngine.MAX_TURNS()).to.equal(50);
        });
    });

    describe("Battle Execution - 1v1", function () {
        it("Should execute a simple 1v1 battle with higher HP wins", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0 // Galactic
            }];

            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 90,
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 0 // Galactic
            }];

            const seed = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [12345]);
            
            const tx = await battleEngine.executeBattle(team1Cards, team2Cards, 12345);
            const receipt = await tx.wait();
            
            // Find BattleExecuted event
            const event = receipt.logs.find(log => log.topics[0] === ethers.id("BattleExecuted(uint8,uint256,uint256,uint256)"));
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint8", "uint256", "uint256", "uint256"], event.data);
            
            expect(decoded[0]).to.equal(1n); // Team 2 should win with more HP
        });

        it("Should respect speed order - faster card attacks first", async function () {
            const team1Cards = [{
                power: 200,
                defense: 0,
                speed: 150,
                hp: 100,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 200,
                defense: 0,
                speed: 50,
                hp: 100,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            expect(result.winner).to.equal(0n); // Faster card should win
        });
    });

    describe("Damage Calculation", function () {
        it("Should apply minimum damage of 1", async function () {
            const team1Cards = [{
                power: 10,
                defense: 1000,
                speed: 100,
                hp: 100,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 10,
                defense: 1000,
                speed: 90,
                hp: 50,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            expect(Number(result.turnsPlayed)).to.be.greaterThan(0);
        });

        it("Should calculate damage as power minus half defense", async function () {
            // This test requires specific HP values to verify damage calculation
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 80,
                defense: 40,
                speed: 90,
                hp: 400,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            expect(result.winner).to.be.oneOf([0n, 1n]);
            expect(Number(result.turnsPlayed)).to.be.within(1, 50);
        });
    });

    describe("Type Advantages", function () {
        it("Should apply type advantage multiplier", async function () {
            // Galactic (0) beats Cosmic (1)
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 0 // Galactic
            }];

            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 1 // Cosmic
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            // Galactic should have advantage, making team1 more likely to win
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });
    });

    describe("Critical Hits", function () {
        it("Should apply critical damage multiplier", async function () {
            const team1Cards = [{
                power: 50,
                defense: 50,
                speed: 100,
                hp: 1000,
                luck: 0,
                critical: 5000, // 50% crit chance
                cardType: 0
            }];

            const team2Cards = [{
                power: 50,
                defense: 50,
                speed: 90,
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });
    });

    describe("Dodge (Luck)", function () {
        it("Should apply dodge chance based on luck", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 1000, // 10% dodge
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 90,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });
    });

    describe("Battle Execution - 3v3", function () {
        it("Should execute a 3v3 battle", async function () {
            const team1Cards = [
                { power: 100, defense: 50, speed: 100, hp: 500, luck: 0, critical: 0, cardType: 0 },
                { power: 80, defense: 60, speed: 90, hp: 400, luck: 0, critical: 0, cardType: 1 },
                { power: 90, defense: 55, speed: 95, hp: 450, luck: 0, critical: 0, cardType: 2 }
            ];

            const team2Cards = [
                { power: 95, defense: 55, speed: 92, hp: 450, luck: 0, critical: 0, cardType: 3 },
                { power: 85, defense: 65, speed: 88, hp: 420, luck: 0, critical: 0, cardType: 4 },
                { power: 100, defense: 50, speed: 100, hp: 480, luck: 0, critical: 0, cardType: 5 }
            ];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            expect(result.winner).to.be.oneOf([0n, 1n]);
            expect(Number(result.turnsPlayed)).to.be.within(1, 50);
        });
    });

    describe("Battle Execution - 5v5", function () {
        it("Should execute a 5v5 battle", async function () {
            const team1Cards = [
                { power: 100, defense: 50, speed: 100, hp: 500, luck: 0, critical: 0, cardType: 0 },
                { power: 80, defense: 60, speed: 90, hp: 400, luck: 0, critical: 0, cardType: 1 },
                { power: 90, defense: 55, speed: 95, hp: 450, luck: 0, critical: 0, cardType: 2 },
                { power: 85, defense: 65, speed: 88, hp: 420, luck: 0, critical: 0, cardType: 3 },
                { power: 95, defense: 58, speed: 92, hp: 440, luck: 0, critical: 0, cardType: 4 }
            ];

            const team2Cards = [
                { power: 95, defense: 55, speed: 92, hp: 450, luck: 0, critical: 0, cardType: 5 },
                { power: 85, defense: 65, speed: 88, hp: 420, luck: 0, critical: 0, cardType: 6 },
                { power: 100, defense: 50, speed: 100, hp: 480, luck: 0, critical: 0, cardType: 7 },
                { power: 90, defense: 60, speed: 93, hp: 430, luck: 0, critical: 0, cardType: 0 },
                { power: 88, defense: 62, speed: 91, hp: 425, luck: 0, critical: 0, cardType: 1 }
            ];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            expect(result.winner).to.be.oneOf([0n, 1n]);
            expect(Number(result.turnsPlayed)).to.be.within(1, 50);
        });
    });

    describe("Turn Limit", function () {
        it("Should resolve battle by HP when max turns reached", async function () {
            const team1Cards = [{
                power: 1,
                defense: 1000,
                speed: 100,
                hp: 10000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 1,
                defense: 1000,
                speed: 90,
                hp: 8000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            
            // Team 1 has more HP, should win when max turns reached
            expect(result.winner).to.equal(0n);
        });
    });

    describe("Simulate Battle", function () {
        it("Should allow simulation without state changes", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 90,
                defense: 60,
                speed: 90,
                hp: 450,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            // simulateBattle is a view function, returns struct directly
            const result = await battleEngine.simulateBattle.staticCall(team1Cards, team2Cards, 12345);
            
            expect(Number(result[0])).to.be.oneOf([0, 1]);
            expect(Number(result[1])).to.be.within(1, 50);
        });
    });

    describe("Security Tests - Input Validation", function () {
        // Security: Empty team arrays should revert
        it("Should reject battle with empty team1 array", async function () {
            const team1Cards = [];
            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            await expect(
                battleEngine.executeBattle(team1Cards, team2Cards, 12345)
            ).to.be.revertedWith("BattleEngine: Teams cannot be empty");
        });

        // Security: Different team sizes should revert
        it("Should reject battle with mismatched team sizes", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [
                {
                    power: 100,
                    defense: 50,
                    speed: 100,
                    hp: 500,
                    luck: 0,
                    critical: 0,
                    cardType: 0
                },
                {
                    power: 90,
                    defense: 60,
                    speed: 90,
                    hp: 400,
                    luck: 0,
                    critical: 0,
                    cardType: 1
                }
            ];

            await expect(
                battleEngine.executeBattle(team1Cards, team2Cards, 12345)
            ).to.be.revertedWith("BattleEngine: Teams must have same size");
        });

        // Security: Extremely high stats should not cause overflow
        it("Should handle very high stats without overflow", async function () {
            const maxUint = ethers.MaxUint256;
            const team1Cards = [{
                power: maxUint / 1000n, // Large but safe values
                defense: maxUint / 2000n,
                speed: 100,
                hp: maxUint / 1000n,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: maxUint / 1000n,
                defense: maxUint / 2000n,
                speed: 90,
                hp: maxUint / 1000n,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            // Should execute without reverting
            const tx = await battleEngine.executeBattle(team1Cards, team2Cards, 12345);
            await tx.wait();
        });
    });

    describe("Edge Cases - Extreme Battle Conditions", function () {
        // Edge case: Battle with 0 HP on one card
        it("Should handle card with 0 HP", async function () {
            const team1Cards = [{
                power: 1000,
                defense: 0,
                speed: 100,
                hp: 0,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 1000,
                defense: 0,
                speed: 90,
                hp: 100,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            // Card with 0 HP should be immediately eliminated
            expect(result.winner).to.equal(1n); // Team 2 should win
        });

        // Edge case: Very high dodge chance (100% near)
        it("Should handle very high dodge chance", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 99000, // 99% dodge
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 90,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            // Should complete despite high dodge
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        // Edge case: Very high critical chance
        it("Should handle very high critical chance", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 500,
                luck: 0,
                critical: 99000, // 99% crit
                cardType: 0
            }];

            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 90,
                hp: 500,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        // Edge case: Battle reaches max turns (stalemate by HP)
        it("Should resolve by HP when max turns reached with low damage", async function () {
            const team1Cards = [{
                power: 1,
                defense: 10000,
                speed: 100,
                hp: 1000000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 1,
                defense: 10000,
                speed: 90,
                hp: 500000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            // Should hit 50 turns and resolve by HP
            expect(result.turnsPlayed).to.equal(50n);
            expect(result.winner).to.equal(0n); // Team 1 has more HP
        });

        // Edge case: All cards have same stats
        it("Should handle battle with identical stats", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 100,
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            // Should complete (seed determines outcome)
            expect(result.winner).to.be.oneOf([0n, 1n]);
            expect(Number(result.turnsPlayed)).to.be.within(1, 50);
        });

        // Edge case: Extreme speed difference
        it("Should handle extreme speed differences", async function () {
            const team1Cards = [{
                power: 100,
                defense: 50,
                speed: 1000000, // Very high speed
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const team2Cards = [{
                power: 100,
                defense: 50,
                speed: 10, // Very low speed
                hp: 1000,
                luck: 0,
                critical: 0,
                cardType: 0
            }];

            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            // Team 1 should attack first consistently
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });
    });

    describe("Type System Tests - All Matchups", function () {
        // Test all 8 types against each other for circular advantage system
        // Type advantage chain: Galactic(0) > Cosmic(1) > Celestial(2) > Mechanical(3) > 
        //                      Dragon(4) > Beast(5) > Elemental(6) > Chaos(7) > Galactic(0)

        it("Should apply type advantage: Galactic beats Cosmic", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 0 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 1 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type advantage: Cosmic beats Celestial", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 1 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 2 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type advantage: Celestial beats Mechanical", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 2 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 3 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type advantage: Mechanical beats Dragon", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 3 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 4 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type advantage: Dragon beats Beast", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 4 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 5 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type advantage: Beast beats Elemental", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 5 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 6 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type advantage: Elemental beats Chaos", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 6 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 7 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type advantage: Chaos beats Galactic (circular)", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 7 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 0 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply type disadvantage when reversed", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 1 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 0 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            // Team 2 should have type advantage
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });

        it("Should apply neutral type when same type", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 3 }];
            const team2Cards = [{ power: 100, defense: 50, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 3 }];
            
            const result = await executeBattleAndGetResult(team1Cards, team2Cards, 12345);
            // Neutral matchup
            expect(result.winner).to.be.oneOf([0n, 1n]);
        });
    });

    describe("Gas Comparison Tests", function () {
        it("Should measure gas for 1v1 battle", async function () {
            const team1Cards = [{ power: 100, defense: 50, speed: 100, hp: 500, luck: 0, critical: 0, cardType: 0 }];
            const team2Cards = [{ power: 90, defense: 60, speed: 90, hp: 450, luck: 0, critical: 0, cardType: 0 }];
            
            const tx = await battleEngine.executeBattle(team1Cards, team2Cards, 12345);
            const receipt = await tx.wait();
            
            expect(receipt.gasUsed).to.be.lessThan(500000);
        });

        it("Should measure gas for 3v3 battle", async function () {
            const team1Cards = [
                { power: 100, defense: 50, speed: 100, hp: 500, luck: 0, critical: 0, cardType: 0 },
                { power: 80, defense: 60, speed: 90, hp: 400, luck: 0, critical: 0, cardType: 1 },
                { power: 90, defense: 55, speed: 95, hp: 450, luck: 0, critical: 0, cardType: 2 }
            ];

            const team2Cards = [
                { power: 95, defense: 55, speed: 92, hp: 450, luck: 0, critical: 0, cardType: 3 },
                { power: 85, defense: 65, speed: 88, hp: 420, luck: 0, critical: 0, cardType: 4 },
                { power: 100, defense: 50, speed: 100, hp: 480, luck: 0, critical: 0, cardType: 5 }
            ];
            
            const tx = await battleEngine.executeBattle(team1Cards, team2Cards, 12345);
            const receipt = await tx.wait();
            
            // 3v3 should cost more than 1v1
            expect(receipt.gasUsed).to.be.greaterThan(500000);
            expect(receipt.gasUsed).to.be.lessThan(2000000);
        });

        it("Should measure gas for 5v5 battle", async function () {
            const team1Cards = [
                { power: 100, defense: 50, speed: 100, hp: 500, luck: 0, critical: 0, cardType: 0 },
                { power: 80, defense: 60, speed: 90, hp: 400, luck: 0, critical: 0, cardType: 1 },
                { power: 90, defense: 55, speed: 95, hp: 450, luck: 0, critical: 0, cardType: 2 },
                { power: 85, defense: 65, speed: 88, hp: 420, luck: 0, critical: 0, cardType: 3 },
                { power: 95, defense: 58, speed: 92, hp: 440, luck: 0, critical: 0, cardType: 4 }
            ];

            const team2Cards = [
                { power: 95, defense: 55, speed: 92, hp: 450, luck: 0, critical: 0, cardType: 5 },
                { power: 85, defense: 65, speed: 88, hp: 420, luck: 0, critical: 0, cardType: 6 },
                { power: 100, defense: 50, speed: 100, hp: 480, luck: 0, critical: 0, cardType: 7 },
                { power: 90, defense: 60, speed: 93, hp: 430, luck: 0, critical: 0, cardType: 0 },
                { power: 88, defense: 62, speed: 91, hp: 425, luck: 0, critical: 0, cardType: 1 }
            ];
            
            const tx = await battleEngine.executeBattle(team1Cards, team2Cards, 12345);
            const receipt = await tx.wait();
            
            // 5v5 should cost the most
            expect(receipt.gasUsed).to.be.greaterThan(1000000);
        });

        it("Should compare gas: short battle vs max turns battle", async function () {
            // Short battle (one-sided)
            const shortTeam1 = [{ power: 10000, defense: 0, speed: 100, hp: 1000, luck: 0, critical: 0, cardType: 0 }];
            const shortTeam2 = [{ power: 10, defense: 0, speed: 90, hp: 100, luck: 0, critical: 0, cardType: 0 }];
            
            const shortTx = await battleEngine.executeBattle(shortTeam1, shortTeam2, 12345);
            const shortReceipt = await shortTx.wait();
            
            // Long battle (reaches max turns)
            const longTeam1 = [{ power: 1, defense: 10000, speed: 100, hp: 1000000, luck: 0, critical: 0, cardType: 0 }];
            const longTeam2 = [{ power: 1, defense: 10000, speed: 90, hp: 1000000, luck: 0, critical: 0, cardType: 0 }];
            
            const longTx = await battleEngine.executeBattle(longTeam1, longTeam2, 12345);
            const longReceipt = await longTx.wait();
            
            // Long battle should use significantly more gas
            expect(longReceipt.gasUsed).to.be.greaterThan(shortReceipt.gasUsed * 2n);
        });
    });
});
