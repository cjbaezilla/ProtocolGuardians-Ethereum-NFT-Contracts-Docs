const { ethers } = require("hardhat");

/**
 * Simulate a battle between two teams of cards
 * This helps test battle balance without spending gas
 * 
 * @param {Object} battleEngine - Connected BattleEngine contract
 * @param {Array} team1Stats - Array of card stats for team 1
 * @param {Array} team2Stats - Array of card stats for team 2
 * @param {number} seed - Random seed for battle
 * @returns {Object} - Battle result
 */
async function simulateBattle(battleEngine, team1Stats, team2Stats, seed) {
  try {
    // Call the simulateBattle view function
    const result = await battleEngine.simulateBattle(team1Stats, team2Stats, seed);
    
    return {
      winner: result.winner,
      turnsPlayed: Number(result.turnsPlayed),
      team1RemainingHP: Number(result.team1RemainingHP),
      team2RemainingHP: Number(result.team2RemainingHP)
    };
  } catch (error) {
    console.error("Error simulating battle:", error.message);
    throw error;
  }
}

/**
 * Convert card stats array to contract format
 */
function formatCardStats(power, defense, speed, hp, mana, stamina, critical, luck, cardType) {
  return {
    power: ethers.parseUnits(power.toString(), 0),
    defense: ethers.parseUnits(defense.toString(), 0),
    speed: ethers.parseUnits(speed.toString(), 0),
    hp: ethers.parseUnits(hp.toString(), 0),
    mana: ethers.parseUnits(mana.toString(), 0),
    stamina: ethers.parseUnits(stamina.toString(), 0),
    critical: ethers.parseUnits(critical.toString(), 0),
    luck: ethers.parseUnits(luck.toString(), 0),
    cardType: cardType || 0
  };
}

/**
 * CLI usage
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get BattleEngine address from environment or use deployed contract
  const BATTLE_ENGINE_ADDRESS = process.env.BATTLE_ENGINE_ADDRESS;
  
  if (!BATTLE_ENGINE_ADDRESS) {
    console.error("Error: BATTLE_ENGINE_ADDRESS not set");
    console.log("Usage: BATTLE_ENGINE_ADDRESS=0x... node simulate-battle.js");
    process.exit(1);
  }

  const BattleEngine = await ethers.getContractFactory("BattleEngine");
  const battleEngine = await BattleEngine.attach(BATTLE_ENGINE_ADDRESS);

  console.log("🎮 Battle Simulator");
  console.log("=" .repeat(60));
  console.log("Battle Engine:", BATTLE_ENGINE_ADDRESS);
  console.log("");

  // Example battle: 1v1
  console.log("Example Battle: 1v1");
  console.log("-".repeat(60));
  
  const card1Team1 = formatCardStats(1000, 500, 300, 2000, 100, 50, 200, 150, 0); // Galactic
  const card1Team2 = formatCardStats(800, 600, 250, 1800, 100, 50, 150, 120, 1); // Cosmic
  
  const team1Stats = [card1Team1];
  const team2Stats = [card1Team2];

  console.log("Team 1:");
  console.log("  Card 1: Power=1000, Defense=500, Speed=300, HP=2000, Type=Galactic");
  console.log("");
  console.log("Team 2:");
  console.log("  Card 1: Power=800, Defense=600, Speed=250, HP=1800, Type=Cosmic");
  console.log("");

  const seed = Math.floor(Math.random() * 1000000);
  console.log("Random Seed:", seed);
  console.log("");

  try {
    const result = await simulateBattle(battleEngine, team1Stats, team2Stats, seed);
    
    console.log("Battle Result:");
    console.log("=" .repeat(60));
    console.log("Winner: Team", result.winner + 1);
    console.log("Turns Played:", result.turnsPlayed);
    console.log("Team 1 Remaining HP:", result.team1RemainingHP);
    console.log("Team 2 Remaining HP:", result.team2RemainingHP);
    console.log("=" .repeat(60));
    console.log("");

  } catch (error) {
    console.error("Battle simulation failed:", error.message);
    process.exit(1);
  }

  // Example 3v3 battle
  console.log("\nExample Battle: 3v3");
  console.log("-".repeat(60));
  
  const t1c1 = formatCardStats(1000, 500, 300, 2000, 100, 50, 200, 150, 0);
  const t1c2 = formatCardStats(900, 450, 280, 1900, 100, 50, 180, 140, 1);
  const t1c3 = formatCardStats(950, 480, 290, 1950, 100, 50, 190, 145, 2);
  
  const t2c1 = formatCardStats(800, 600, 250, 1800, 100, 50, 150, 120, 3);
  const t2c2 = formatCardStats(850, 550, 270, 1850, 100, 50, 160, 130, 4);
  const t2c3 = formatCardStats(750, 580, 240, 1750, 100, 50, 140, 110, 5);

  const team1_3v3 = [t1c1, t1c2, t1c3];
  const team2_3v3 = [t2c1, t2c2, t2c3];

  const seed2 = Math.floor(Math.random() * 1000000);
  
  try {
    const result3v3 = await simulateBattle(battleEngine, team1_3v3, team2_3v3, seed2);
    
    console.log("3v3 Battle Result:");
    console.log("=" .repeat(60));
    console.log("Winner: Team", result3v3.winner + 1);
    console.log("Turns Played:", result3v3.turnsPlayed);
    console.log("Team 1 Remaining HP:", result3v3.team1RemainingHP);
    console.log("Team 2 Remaining HP:", result3v3.team2RemainingHP);
    console.log("=" .repeat(60));
    console.log("");

  } catch (error) {
    console.error("3v3 Battle simulation failed:", error.message);
  }

  console.log("\n✅ Battle simulations completed!");
}

// Export function for use in other scripts
module.exports = { simulateBattle, formatCardStats };

// Run as CLI if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
