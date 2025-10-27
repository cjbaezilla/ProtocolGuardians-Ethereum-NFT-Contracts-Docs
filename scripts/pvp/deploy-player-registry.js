const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting PlayerRegistry deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deployment configuration
  const PROTOCOL_GUARDIANS_ADDRESS = process.env.PROTOCOL_GUARDIANS_ADDRESS || "0x0000000000000000000000000000000000000000";
  const INITIAL_ELO = 1000;
  const XP_PER_LEVEL = 100;

  console.log("📋 Deployment Configuration:");
  console.log("- Protocol Guardians NFT:", PROTOCOL_GUARDIANS_ADDRESS);
  console.log("- Initial ELO:", INITIAL_ELO);
  console.log("- XP per Level:", XP_PER_LEVEL);
  console.log("");

  // Deploy PlayerRegistry
  console.log("1️⃣ Deploying PlayerRegistry...");
  const PlayerRegistry = await ethers.getContractFactory("PlayerRegistry");
  const playerRegistry = await PlayerRegistry.deploy(
    PROTOCOL_GUARDIANS_ADDRESS,
    INITIAL_ELO,
    XP_PER_LEVEL
  );
  await playerRegistry.waitForDeployment();
  const playerRegistryAddress = await playerRegistry.getAddress();

  const deployReceipt = await playerRegistry.deploymentTransaction().wait();
  const deployTxInfo = {
    name: "Deploy PlayerRegistry",
    hash: playerRegistry.deploymentTransaction().hash,
    from: deployReceipt.from,
    to: deployReceipt.to,
    gasUsed: deployReceipt.gasUsed.toString(),
    effectiveGasPrice: deployReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(deployReceipt.gasUsed * deployReceipt.effectiveGasPrice),
    blockNumber: deployReceipt.blockNumber
  };

  console.log("✅ PlayerRegistry deployed to:", playerRegistryAddress);

  // Verification
  console.log("\n2️⃣ Verifying deployment...");
  const protocolGuardians = await playerRegistry.protocolGuardians();
  const initialElo = await playerRegistry.INITIAL_ELO();
  const xpPerLevel = await playerRegistry.XP_PER_LEVEL();

  console.log("✅ Protocol Guardians:", protocolGuardians);
  console.log("✅ Initial ELO:", initialElo.toString());
  console.log("✅ XP per Level:", xpPerLevel.toString());

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contract: {
      name: "PlayerRegistry",
      address: playerRegistryAddress,
      transaction: deployTxInfo
    },
    configuration: {
      protocolGuardians: PROTOCOL_GUARDIANS_ADDRESS,
      initialElo: INITIAL_ELO,
      xpPerLevel: XP_PER_LEVEL
    },
    verification: {
      protocolGuardians: protocolGuardians,
      initialElo: initialElo.toString(),
      xpPerLevel: xpPerLevel.toString()
    }
  };

  console.log("\n📊 Deployment Summary:");
  console.log("==================================================");
  console.log("PlayerRegistry:", playerRegistryAddress);
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
  const networkName = (await ethers.provider.getNetwork()).name;
  fs.writeFileSync(
    `${pvpDir}/player-registry-${networkName}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/pvp/player-registry-" + networkName + ".json");
  console.log("\n🎉 PlayerRegistry deployment completed successfully!");

  return {
    playerRegistry: playerRegistryAddress,
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
