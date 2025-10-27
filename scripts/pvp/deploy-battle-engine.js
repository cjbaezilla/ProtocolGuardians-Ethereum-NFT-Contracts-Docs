const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting BattleEngine deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Battle configuration
  const MAX_TURNS = 50;
  const TYPE_ADVANTAGE_BONUS = 15; // 15% bonus
  const TYPE_DISADVANTAGE_PENALTY = 15; // 15% penalty
  const CRITICAL_MULTIPLIER = 2;
  const MIN_DAMAGE = 1;

  console.log("📋 Battle Configuration:");
  console.log("- Max Turns:", MAX_TURNS);
  console.log("- Type Advantage Bonus:", TYPE_ADVANTAGE_BONUS + "%");
  console.log("- Type Disadvantage Penalty:", TYPE_DISADVANTAGE_PENALTY + "%");
  console.log("- Critical Multiplier:", CRITICAL_MULTIPLIER + "x");
  console.log("- Min Damage:", MIN_DAMAGE);
  console.log("");

  // Deploy BattleEngine
  console.log("1️⃣ Deploying BattleEngine...");
  const BattleEngine = await ethers.getContractFactory("BattleEngine");
  const battleEngine = await BattleEngine.deploy(
    MAX_TURNS,
    TYPE_ADVANTAGE_BONUS,
    TYPE_DISADVANTAGE_PENALTY,
    CRITICAL_MULTIPLIER,
    MIN_DAMAGE
  );
  await battleEngine.waitForDeployment();
  const battleEngineAddress = await battleEngine.getAddress();

  const deployReceipt = await battleEngine.deploymentTransaction().wait();
  const deployTxInfo = {
    name: "Deploy BattleEngine",
    hash: battleEngine.deploymentTransaction().hash,
    from: deployReceipt.from,
    to: deployReceipt.to,
    gasUsed: deployReceipt.gasUsed.toString(),
    effectiveGasPrice: deployReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(deployReceipt.gasUsed * deployReceipt.effectiveGasPrice),
    blockNumber: deployReceipt.blockNumber
  };

  console.log("✅ BattleEngine deployed to:", battleEngineAddress);

  // Verification
  console.log("\n2️⃣ Verifying deployment...");
  const maxTurns = await battleEngine.MAX_TURNS();
  const typeAdvantageBonus = await battleEngine.TYPE_ADVANTAGE_BONUS();
  const typeDisadvantagePenalty = await battleEngine.TYPE_DISADVANTAGE_PENALTY();
  const criticalMultiplier = await battleEngine.CRITICAL_MULTIPLIER();
  const minDamage = await battleEngine.MIN_DAMAGE();

  console.log("✅ Max Turns:", maxTurns.toString());
  console.log("✅ Type Advantage Bonus:", typeAdvantageBonus.toString() + "%");
  console.log("✅ Type Disadvantage Penalty:", typeDisadvantagePenalty.toString() + "%");
  console.log("✅ Critical Multiplier:", criticalMultiplier.toString() + "x");
  console.log("✅ Min Damage:", minDamage.toString());

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contract: {
      name: "BattleEngine",
      address: battleEngineAddress,
      transaction: deployTxInfo
    },
    configuration: {
      maxTurns: MAX_TURNS,
      typeAdvantageBonus: TYPE_ADVANTAGE_BONUS,
      typeDisadvantagePenalty: TYPE_DISADVANTAGE_PENALTY,
      criticalMultiplier: CRITICAL_MULTIPLIER,
      minDamage: MIN_DAMAGE
    },
    verification: {
      maxTurns: maxTurns.toString(),
      typeAdvantageBonus: typeAdvantageBonus.toString(),
      typeDisadvantagePenalty: typeDisadvantagePenalty.toString(),
      criticalMultiplier: criticalMultiplier.toString(),
      minDamage: minDamage.toString()
    }
  };

  console.log("\n📊 Deployment Summary:");
  console.log("==================================================");
  console.log("BattleEngine:", battleEngineAddress);
  console.log("Gas Used:", deployTxInfo.gasUsed);
  console.log("Gas Cost:", deployTxInfo.costInEth, "ETH");
  console.log("Block:", deployTxInfo.blockNumber);
  console.log("==================================================");

  // Save to file
  const fs = require("fs");
  const deploymentsDir = "deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  const pvpDir = `${deploymentsDir}/pvp`;
  if (!fs.existsSync(pvpDir)) {
    fs.mkdirSync(pvpDir);
  }
  fs.writeFileSync(
    `${pvpDir}/battle-engine-${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/pvp/battle-engine-" + network.name + ".json");
  console.log("\n🎉 BattleEngine deployment completed successfully!");

  return {
    battleEngine: battleEngineAddress,
    deploymentInfo
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
