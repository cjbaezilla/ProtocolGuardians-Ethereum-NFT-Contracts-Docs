const { ethers } = require("hardhat");
const deployPlayerRegistry = require("./deploy-player-registry");
const deployBattleEngine = require("./deploy-battle-engine");
const deployPvPArena = require("./deploy-pvp-arena");

async function main() {
  console.log("🚀 Starting complete PvP system deployment...\n");
  console.log("=" .repeat(60));
  console.log("PROTOCOL GUARDIANS - PVP SYSTEM DEPLOYMENT");
  console.log("=" .repeat(60));
  console.log("");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Deployer:", deployer.address);
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("");

  // Load existing ProtocolGuardians NFT address
  const PROTOCOL_GUARDIANS_ADDRESS = process.env.PROTOCOL_GUARDIANS_ADDRESS || "0xfB49118d739482048ff514b699C23E2875a91837";
  console.log("Using ProtocolGuardians NFT:", PROTOCOL_GUARDIANS_ADDRESS);
  console.log("");

  const deploymentResults = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {}
  };

  try {
    // Step 1: Deploy PlayerRegistry
    console.log("=" .repeat(60));
    console.log("STEP 1: Deploying PlayerRegistry");
    console.log("=" .repeat(60));
    process.env.PROTOCOL_GUARDIANS_ADDRESS = PROTOCOL_GUARDIANS_ADDRESS;
    const playerRegistryResult = await deployPlayerRegistry();
    deploymentResults.contracts.playerRegistry = playerRegistryResult;
    console.log("");

    // Wait a bit between deployments
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Deploy BattleEngine
    console.log("=" .repeat(60));
    console.log("STEP 2: Deploying BattleEngine");
    console.log("=" .repeat(60));
    const battleEngineResult = await deployBattleEngine();
    deploymentResults.contracts.battleEngine = battleEngineResult;
    console.log("");

    // Wait a bit between deployments
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Deploy PvPArena
    console.log("=" .repeat(60));
    console.log("STEP 3: Deploying PvPArena");
    console.log("=" .repeat(60));
    process.env.PLAYER_REGISTRY_ADDRESS = playerRegistryResult.playerRegistry;
    process.env.BATTLE_ENGINE_ADDRESS = battleEngineResult.battleEngine;
    process.env.SIGNER_ADDRESS = deployer.address;
    const pvpArenaResult = await deployPvPArena();
    deploymentResults.contracts.pvpArena = pvpArenaResult;
    console.log("");

    // Final Summary
    console.log("=" .repeat(60));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=" .repeat(60));
    console.log("");
    console.log("📊 Contract Addresses:");
    console.log("=" .repeat(60));
    console.log("PlayerRegistry:", playerRegistryResult.playerRegistry);
    console.log("BattleEngine:", battleEngineResult.battleEngine);
    console.log("PvPArena:", pvpArenaResult.pvpArena);
    console.log("=" .repeat(60));
    console.log("");

    // Save complete deployment info
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
      `${pvpDir}/complete-pvp-system-${network.name}.json`,
      JSON.stringify(deploymentResults, null, 2)
    );

    console.log("💾 Complete deployment info saved to: deployments/pvp/complete-pvp-system-" + network.name + ".json");
    console.log("");

    // Next steps
    console.log("📝 Next Steps:");
    console.log("=" .repeat(60));
    console.log("1. Save these addresses to your .env file:");
    console.log(`   PLAYER_REGISTRY_ADDRESS=${playerRegistryResult.playerRegistry}`);
    console.log(`   BATTLE_ENGINE_ADDRESS=${battleEngineResult.battleEngine}`);
    console.log(`   PVP_ARENA_ADDRESS=${pvpArenaResult.pvpArena}`);
    console.log("");
    console.log("2. Update your frontend configuration with these addresses");
    console.log("");
    console.log("3. Verify contracts on block explorer (if needed)");
    console.log("");
    console.log("4. Test the PvP system with integration tests");
    console.log("");
    console.log("5. Update documentation with deployment information");
    console.log("");

    console.log("🎉 PvP System deployment completed successfully!");
    console.log("");

    return deploymentResults;

  } catch (error) {
    console.error("\n❌ Deployment failed at some step:", error);
    console.error("\nPartial deployment info:");
    console.log(JSON.stringify(deploymentResults, null, 2));
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Complete deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
