const { ethers } = require("hardhat");
const { 
  getOptimizedFeeData, 
  estimateWithMargin, 
  askForConfirmation, 
  getGasConditions,
  executeOptimizedTransaction,
  formatGasInfo
} = require("./gas-utils");

async function estimateDeploymentGas(contractFactory, constructorArgs = []) {
  try {
    console.log("🔍 Estimating deployment gas...");
    
    const feeData = await getOptimizedFeeData();
    const gasConditions = await getGasConditions();
    
    console.log(`📊 Current gas conditions: ${gasConditions}`);
    
    const gasEstimate = await contractFactory.getDeployTransaction(...constructorArgs).then(tx => 
      ethers.provider.estimateGas(tx)
    );
    
    const gasLimit = estimateWithMargin(gasEstimate);
    const estimatedCost = gasLimit * feeData.maxFeePerGas;
    const estimatedCostEth = ethers.formatEther(estimatedCost);
    
    console.log(`📊 Deployment estimation:`);
    console.log(`   Gas estimate: ${gasEstimate.toLocaleString()}`);
    console.log(`   Gas limit (with 10% margin): ${gasLimit.toLocaleString()}`);
    console.log(`   Max fee per gas: ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);
    console.log(`   Priority fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')} gwei`);
    console.log(`   Estimated cost: ${estimatedCostEth} ETH`);
    
    return {
      gasEstimate,
      gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      estimatedCost,
      estimatedCostEth,
      gasConditions
    };
  } catch (error) {
    throw new Error(`Deployment gas estimation failed: ${error.message}`);
  }
}

async function main() {
  console.log("🚀 Starting ProtocolGuardians NFT deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const transactions = [];

  const BASE_URI = process.env.BASE_URI || "https://ipfs.io/ipfs/"; // Replace with your actual IPFS hash
  
  console.log("📋 Deployment Configuration:");
  console.log("- Base URI:", BASE_URI);
  console.log("");

  console.log("1️⃣ Preparing ProtocolGuardians deployment...");
  const ProtocolGuardians = await ethers.getContractFactory("ProtocolGuardians");
  
  const deploymentEstimate = await estimateDeploymentGas(ProtocolGuardians, [BASE_URI]);
  
  // Ask for confirmation
  const confirmed = await askForConfirmation(
    "Deploy ProtocolGuardians NFT contract?",
    deploymentEstimate.estimatedCostEth
  );
  
  if (!confirmed) {
    console.log("❌ Deployment cancelled by user");
    return;
  }

  console.log("\n🚀 Deploying ProtocolGuardians NFT with optimized gas settings...");
  
  const deployTx = await ProtocolGuardians.getDeployTransaction(BASE_URI);
  const txOptions = {
    gasLimit: deploymentEstimate.gasLimit,
    maxFeePerGas: deploymentEstimate.maxFeePerGas,
    maxPriorityFeePerGas: deploymentEstimate.maxPriorityFeePerGas
  };
  
  const guardians = await ProtocolGuardians.deploy(BASE_URI, txOptions);
  await guardians.waitForDeployment();
  const guardiansAddress = await guardians.getAddress();
  
  const deployReceipt = await guardians.deploymentTransaction().wait();
  const actualCost = deployReceipt.gasUsed * deployReceipt.effectiveGasPrice;
  const actualCostEth = ethers.formatEther(actualCost);
  
  const deployTxInfo = {
    name: "Deploy ProtocolGuardians",
    hash: guardians.deploymentTransaction().hash,
    from: deployReceipt.from,
    to: deployReceipt.to,
    gasUsed: deployReceipt.gasUsed.toString(),
    gasLimit: deploymentEstimate.gasLimit.toString(),
    effectiveGasPrice: deployReceipt.effectiveGasPrice.toString(),
    maxFeePerGas: deploymentEstimate.maxFeePerGas.toString(),
    maxPriorityFeePerGas: deploymentEstimate.maxPriorityFeePerGas.toString(),
    costInEth: actualCostEth,
    estimatedCostInEth: deploymentEstimate.estimatedCostEth,
    savings: (parseFloat(deploymentEstimate.estimatedCostEth) - parseFloat(actualCostEth)).toFixed(6),
    blockNumber: deployReceipt.blockNumber
  };
  transactions.push(deployTxInfo);
  
  console.log("✅ ProtocolGuardians deployed to:", guardiansAddress);
  console.log(`📊 Actual cost: ${actualCostEth} ETH (Estimated: ${deploymentEstimate.estimatedCostEth} ETH)`);

  console.log("\n2️⃣ Verifying configurations...");
  
  const nftName = await guardians.name();
  const nftSymbol = await guardians.symbol();
  const nftBaseURI = await guardians.baseURI();
  const totalSupply = await guardians.totalSupply();
  
  console.log("✅ ProtocolGuardians - Name:", nftName);
  console.log("✅ ProtocolGuardians - Symbol:", nftSymbol);
  console.log("✅ ProtocolGuardians - Base URI:", nftBaseURI);
  console.log("✅ ProtocolGuardians - Total Supply:", totalSupply.toString());

  const totalGasCost = formatGasInfo(transactions);

  console.log("\n🎉 NFT deployment completed successfully!");
  console.log("\n📊 Contract Information:");
  console.log("=".repeat(50));
  console.log("Contract Name:", nftName);
  console.log("Contract Symbol:", nftSymbol);
  console.log("Contract Address:", guardiansAddress);
  console.log("Base URI:", nftBaseURI);
  console.log("Owner:", deployer.address);
  console.log("=".repeat(50));

  console.log("\n⚙️ Next Steps:");
  console.log("1. Update baseURI with your actual IPFS hash if needed");
  console.log("2. Use the mint script to mint NFTs to specific addresses");
  console.log("3. Verify the contract on block explorer");
  console.log("4. Test the contract functionality");

  console.log("\n📝 Important Notes:");
  console.log("- Base URI is immutable - ensure it's correct before deployment");
  console.log("- Only the owner can mint new NFTs");
  console.log("- Total deployment cost:", totalGasCost, "ETH");
  console.log("- Gas optimization enabled with EIP-1559");

  return {
    address: guardiansAddress,
    name: nftName,
    symbol: nftSymbol,
    baseURI: nftBaseURI,
    owner: deployer.address,
    totalCost: totalGasCost
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
