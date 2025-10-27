const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting PvPArena deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration - can be passed as environment variables
  const PLAYER_REGISTRY_ADDRESS = process.env.PLAYER_REGISTRY_ADDRESS || "";
  const BATTLE_ENGINE_ADDRESS = process.env.BATTLE_ENGINE_ADDRESS || "";
  const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS || deployer.address;
  const CHALLENGE_FEE = ethers.parseEther(process.env.CHALLENGE_FEE || "0.001"); // 0.001 ETH
  const PROTOCOL_FEE_PERCENT = 3; // 3%

  console.log("📋 Deployment Configuration:");
  console.log("- Player Registry:", PLAYER_REGISTRY_ADDRESS);
  console.log("- Battle Engine:", BATTLE_ENGINE_ADDRESS);
  console.log("- Signer Address:", SIGNER_ADDRESS);
  console.log("- Challenge Fee:", ethers.formatEther(CHALLENGE_FEE), "ETH");
  console.log("- Protocol Fee Percent:", PROTOCOL_FEE_PERCENT + "%");
  console.log("");

  if (!PLAYER_REGISTRY_ADDRESS || !BATTLE_ENGINE_ADDRESS) {
    console.error("❌ Error: PLAYER_REGISTRY_ADDRESS and BATTLE_ENGINE_ADDRESS must be set");
    process.exit(1);
  }

  // Deploy PvPArena
  console.log("1️⃣ Deploying PvPArena...");
  const PvPArena = await ethers.getContractFactory("PvPArena");
  const pvpArena = await PvPArena.deploy(
    PLAYER_REGISTRY_ADDRESS,
    BATTLE_ENGINE_ADDRESS,
    SIGNER_ADDRESS,
    CHALLENGE_FEE,
    PROTOCOL_FEE_PERCENT
  );
  await pvpArena.waitForDeployment();
  const pvpArenaAddress = await pvpArena.getAddress();

  const deployReceipt = await pvpArena.deploymentTransaction().wait();
  const deployTxInfo = {
    name: "Deploy PvPArena",
    hash: pvpArena.deploymentTransaction().hash,
    from: deployReceipt.from,
    to: deployReceipt.to,
    gasUsed: deployReceipt.gasUsed.toString(),
    effectiveGasPrice: deployReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(deployReceipt.gasUsed * deployReceipt.effectiveGasPrice),
    blockNumber: deployReceipt.blockNumber
  };

  console.log("✅ PvPArena deployed to:", pvpArenaAddress);

  // Verification
  console.log("\n2️⃣ Verifying deployment...");
  const playerRegistryAddress = await pvpArena.playerRegistryAddress();
  const battleEngineAddress = await pvpArena.battleEngineAddress();
  const signerAddress = await pvpArena.signerAddress();
  const challengeFee = await pvpArena.challengeFee();
  const protocolFeePercent = await pvpArena.protocolFeePercent();

  console.log("✅ Player Registry:", playerRegistryAddress);
  console.log("✅ Battle Engine:", battleEngineAddress);
  console.log("✅ Signer Address:", signerAddress);
  console.log("✅ Challenge Fee:", ethers.formatEther(challengeFee), "ETH");
  console.log("✅ Protocol Fee Percent:", protocolFeePercent.toString() + "%");

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contract: {
      name: "PvPArena",
      address: pvpArenaAddress,
      transaction: deployTxInfo
    },
    configuration: {
      playerRegistry: PLAYER_REGISTRY_ADDRESS,
      battleEngine: BATTLE_ENGINE_ADDRESS,
      signer: SIGNER_ADDRESS,
      challengeFee: ethers.formatEther(CHALLENGE_FEE),
      protocolFeePercent: PROTOCOL_FEE_PERCENT
    },
    verification: {
      playerRegistry: playerRegistryAddress,
      battleEngine: battleEngineAddress,
      signer: signerAddress,
      challengeFee: ethers.formatEther(challengeFee),
      protocolFeePercent: protocolFeePercent.toString()
    }
  };

  console.log("\n📊 Deployment Summary:");
  console.log("==================================================");
  console.log("PvPArena:", pvpArenaAddress);
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
    `${pvpDir}/pvp-arena-${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/pvp/pvp-arena-" + network.name + ".json");
  console.log("\n🎉 PvPArena deployment completed successfully!");

  console.log("\n📝 Next Steps:");
  console.log("1. Ensure PLAYER_REGISTRY_ADDRESS and BATTLE_ENGINE_ADDRESS are set in .env");
  console.log("2. Set PVP_SIGNER_ADDRESS for signature verification");
  console.log("3. Configure frontend to use PvPArena address:", pvpArenaAddress);

  return {
    pvpArena: pvpArenaAddress,
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
