const { ethers } = require("hardhat");

async function estimateGasAndCost(contract, method, args = []) {
  try {
    const gasEstimate = await contract[method].estimateGas(...args);
    const gasPrice = await ethers.provider.getFeeData();
    const effectiveGasPrice = gasPrice.gasPrice || gasPrice.maxFeePerGas;
    const estimatedCost = gasEstimate * effectiveGasPrice;
    return {
      gasEstimate,
      effectiveGasPrice,
      estimatedCost
    };
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
}

async function executeTransaction(contract, method, args = [], txName, deployer) {
  console.log(`  ⛽ Estimating gas for ${txName}...`);
  
  const gasInfo = await estimateGasAndCost(contract, method, args);
  const estimatedCostEth = ethers.formatEther(gasInfo.estimatedCost);
  
  console.log(`  ⛽ Estimated gas: ${gasInfo.gasEstimate.toLocaleString()} | Cost: ~${estimatedCostEth} ETH`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance < gasInfo.estimatedCost) {
    throw new Error(`Insufficient balance. Required: ${estimatedCostEth} ETH, Available: ${ethers.formatEther(balance)} ETH`);
  }
  
  const tx = await contract[method](...args);
  console.log(`  ✅ Transaction: ${tx.hash}`);
  
  const receipt = await tx.wait();
  const actualCost = receipt.gasUsed * receipt.effectiveGasPrice;
  const actualCostEth = ethers.formatEther(actualCost);
  
  console.log(`  📊 Gas used: ${receipt.gasUsed.toLocaleString()} | Effective price: ${ethers.formatUnits(receipt.effectiveGasPrice, 'gwei')} gwei | Cost: ${actualCostEth} ETH`);
  
  return {
    name: txName,
    hash: tx.hash,
    from: receipt.from,
    to: receipt.to,
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    costInEth: actualCostEth,
    blockNumber: receipt.blockNumber
  };
}

function formatGasInfo(transactions) {
  const totalCost = transactions.reduce((sum, tx) => sum + parseFloat(tx.costInEth), 0);
  
  console.log("\n📊 Gas Usage Summary:");
  console.log("=".repeat(80));
  console.log("Transaction".padEnd(25) + "Gas Used".padEnd(15) + "Price (gwei)".padEnd(15) + "Cost (ETH)".padEnd(15));
  console.log("-".repeat(80));
  
  transactions.forEach(tx => {
    const gasUsed = parseInt(tx.gasUsed).toLocaleString();
    const priceGwei = ethers.formatUnits(tx.effectiveGasPrice, 'gwei');
    console.log(
      tx.name.padEnd(25) + 
      gasUsed.padEnd(15) + 
      priceGwei.padEnd(15) + 
      tx.costInEth.padEnd(15)
    );
  });
  
  console.log("-".repeat(80));
  console.log("TOTAL DEPLOYMENT COST:".padEnd(55) + totalCost.toFixed(6) + " ETH");
  console.log("=".repeat(80));
  
  return totalCost.toFixed(6);
}

async function main() {
  console.log("🚀 Starting Protocol Guardians deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const transactions = [];

  const BASE_URI = "ipfs://QmYourIPFSHashHere/"; // Replace with your actual IPFS hash
  const TIMELOCK_DELAY = 2 * 24 * 60 * 60; // 2 days in seconds
  
  const proposers = [deployer.address]; // Add more proposers as needed
  const executors = [deployer.address]; // Add more executors as needed
  const admin = deployer.address; // This should be a multisig in production

  console.log("📋 Deployment Configuration:");
  console.log("- Base URI:", BASE_URI);
  console.log("- Timelock Delay:", TIMELOCK_DELAY, "seconds (2 days)");
  console.log("- Proposers:", proposers);
  console.log("- Executors:", executors);
  console.log("- Admin:", admin);
  console.log("");

  console.log("1️⃣ Deploying ProtocolGuardians NFT...");
  const ProtocolGuardians = await ethers.getContractFactory("ProtocolGuardians");
  const guardians = await ProtocolGuardians.deploy(BASE_URI);
  await guardians.waitForDeployment();
  const guardiansAddress = await guardians.getAddress();
  
  const deployReceipt = await guardians.deploymentTransaction().wait();
  const deployTxInfo = {
    name: "Deploy ProtocolGuardians",
    hash: guardians.deploymentTransaction().hash,
    from: deployReceipt.from,
    to: deployReceipt.to,
    gasUsed: deployReceipt.gasUsed.toString(),
    effectiveGasPrice: deployReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(deployReceipt.gasUsed * deployReceipt.effectiveGasPrice),
    blockNumber: deployReceipt.blockNumber
  };
  transactions.push(deployTxInfo);
  
  console.log("✅ ProtocolGuardians deployed to:", guardiansAddress);

  console.log("\n2️⃣ Deploying ProtocolTimelock...");
  const ProtocolTimelock = await ethers.getContractFactory("ProtocolTimelock");
  const timelock = await ProtocolTimelock.deploy(TIMELOCK_DELAY, proposers, executors, admin);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  
  const timelockDeployReceipt = await timelock.deploymentTransaction().wait();
  const timelockDeployTxInfo = {
    name: "Deploy ProtocolTimelock",
    hash: timelock.deploymentTransaction().hash,
    from: timelockDeployReceipt.from,
    to: timelockDeployReceipt.to,
    gasUsed: timelockDeployReceipt.gasUsed.toString(),
    effectiveGasPrice: timelockDeployReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(timelockDeployReceipt.gasUsed * timelockDeployReceipt.effectiveGasPrice),
    blockNumber: timelockDeployReceipt.blockNumber
  };
  transactions.push(timelockDeployTxInfo);
  
  console.log("✅ ProtocolTimelock deployed to:", timelockAddress);

  console.log("\n3️⃣ Deploying ProtocolPower...");
  const ProtocolPower = await ethers.getContractFactory("ProtocolPower");
  const power = await ProtocolPower.deploy(deployer.address);
  await power.waitForDeployment();
  const powerAddress = await power.getAddress();
  
  const powerDeployReceipt = await power.deploymentTransaction().wait();
  const powerDeployTxInfo = {
    name: "Deploy ProtocolPower",
    hash: power.deploymentTransaction().hash,
    from: powerDeployReceipt.from,
    to: powerDeployReceipt.to,
    gasUsed: powerDeployReceipt.gasUsed.toString(),
    effectiveGasPrice: powerDeployReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(powerDeployReceipt.gasUsed * powerDeployReceipt.effectiveGasPrice),
    blockNumber: powerDeployReceipt.blockNumber
  };
  transactions.push(powerDeployTxInfo);
  
  console.log("✅ ProtocolPower deployed to:", powerAddress);

  console.log("\n4️⃣ Deploying ProtocolStaking...");
  const ProtocolStaking = await ethers.getContractFactory("ProtocolStaking");
  const staking = await ProtocolStaking.deploy(guardiansAddress, powerAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  
  const stakingDeployReceipt = await staking.deploymentTransaction().wait();
  const stakingDeployTxInfo = {
    name: "Deploy ProtocolStaking",
    hash: staking.deploymentTransaction().hash,
    from: stakingDeployReceipt.from,
    to: stakingDeployReceipt.to,
    gasUsed: stakingDeployReceipt.gasUsed.toString(),
    effectiveGasPrice: stakingDeployReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(stakingDeployReceipt.gasUsed * stakingDeployReceipt.effectiveGasPrice),
    blockNumber: stakingDeployReceipt.blockNumber
  };
  transactions.push(stakingDeployTxInfo);
  
  console.log("✅ ProtocolStaking deployed to:", stakingAddress);

  console.log("\n5️⃣ Setting up roles...");
  const grantMinterTx = await power.grantMinterRole(stakingAddress);
  const grantMinterReceipt = await grantMinterTx.wait();
  
  const grantMinterTxInfo = {
    name: "Grant Minter Role",
    hash: grantMinterTx.hash,
    from: grantMinterReceipt.from,
    to: grantMinterReceipt.to,
    gasUsed: grantMinterReceipt.gasUsed.toString(),
    effectiveGasPrice: grantMinterReceipt.effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(grantMinterReceipt.gasUsed * grantMinterReceipt.effectiveGasPrice),
    blockNumber: grantMinterReceipt.blockNumber
  };
  transactions.push(grantMinterTxInfo);
  
  console.log("✅ Granted minter role to ProtocolStaking contract");

  console.log("\n6️⃣ Verifying configurations...");
  
  const nftName = await guardians.name();
  const nftSymbol = await guardians.symbol();
  const nftBaseURI = await guardians._baseURI();
  console.log("✅ ProtocolGuardians - Name:", nftName, "Symbol:", nftSymbol);
  console.log("✅ ProtocolGuardians - Base URI:", nftBaseURI);

  const powerName = await power.name();
  const powerSymbol = await power.symbol();
  const powerOwner = await power.owner();
  const hasMinterRole = await power.hasMinterRole(stakingAddress);
  console.log("✅ ProtocolPower - Name:", powerName, "Symbol:", powerSymbol);
  console.log("✅ ProtocolPower - Owner:", powerOwner, "(Deployer)");
  console.log("✅ ProtocolPower - Staking contract has minter role:", hasMinterRole);

  const stakingNFT = await staking.nftContract();
  const stakingReward = await staking.rewardToken();
  const rewardRate = await staking.getRewardRatePerBlock();
  const tokensPerDay = await staking.getTokensPerDay();
  console.log("✅ ProtocolStaking - NFT Contract:", stakingNFT);
  console.log("✅ ProtocolStaking - Reward Token:", stakingReward);
  console.log("✅ ProtocolStaking - Reward Rate per Block:", rewardRate.toString());
  console.log("✅ ProtocolStaking - Tokens per Day:", ethers.formatEther(tokensPerDay));

  const timelockDelay = await timelock.getMinDelay();
  const isProposer = await timelock.hasRole(await timelock.PROPOSER_ROLE(), proposers[0]);
  const isExecutor = await timelock.hasRole(await timelock.EXECUTOR_ROLE(), executors[0]);
  console.log("✅ ProtocolTimelock - Delay:", timelockDelay.toString(), "seconds");
  console.log("✅ ProtocolTimelock - Proposer role:", isProposer);
  console.log("✅ ProtocolTimelock - Executor role:", isExecutor);

  console.log("\n7️⃣ Testing basic functionality...");
  
  const testCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const mintTx = await guardians.mint(deployer.address, testCID);
  await mintTx.wait();
  const tokenId = await guardians.totalSupply();
  console.log("✅ Successfully minted NFT with ID:", tokenId.toString());
  
  const tokenURI = await guardians.tokenURI(1);
  console.log("✅ Token URI:", tokenURI);

  const approvalTx = await guardians.setApprovalForAll(stakingAddress, true);
  await approvalTx.wait();
  console.log("✅ Approved staking contract for NFT transfers");

  const stakeTx = await staking.stake([1]);
  await stakeTx.wait();
  console.log("✅ Successfully staked NFT");

  for (let i = 0; i < 5; i++) {
    await ethers.provider.send("evm_mine");
  }

  const pendingRewards = await staking.getPendingRewards(1);
  console.log("✅ Pending rewards:", ethers.formatEther(pendingRewards), "POWER");

  const unstakeTx = await staking.unstake([1]);
  await unstakeTx.wait();
  console.log("✅ Successfully unstaked NFT");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📊 Contract Addresses:");
  console.log("=".repeat(50));
  console.log("ProtocolGuardians NFT:", guardiansAddress);
  console.log("ProtocolPower Token:", powerAddress);
  console.log("ProtocolStaking:", stakingAddress);
  console.log("ProtocolTimelock:", timelockAddress);
  console.log("=".repeat(50));

  const totalGasCost = formatGasInfo(transactions);

  console.log("\n🔗 Contract Interactions:");
  console.log("- ProtocolGuardians → ProtocolStaking: NFT transfers for staking");
  console.log("- ProtocolPower → ProtocolStaking: Token minting for rewards");
  console.log("- Deployer → ProtocolPower: Direct control of minter roles");
  console.log("- ProtocolStaking: Custody of staked NFTs");

  console.log("\n⚙️ Next Steps:");
  console.log("1. Update baseURI with your actual IPFS hash");
  console.log("2. Set up multisig for admin role in production");
  console.log("3. Add more proposers and executors as needed");
  console.log("4. Test governance proposals with Tally or similar");
  console.log("5. Deploy to testnet for further testing");

  console.log("\n📝 Important Notes:");
  console.log("- Base URI is immutable - ensure it's correct before deployment");
  console.log("- Timelock delay is 2 days - proposals take 2 days to execute");
  console.log("- Only addresses with proposer role can create governance proposals");
  console.log("- Only addresses with executor role can execute approved proposals");
  console.log("- Staking contract has minter role for reward tokens");

  const deploymentInfo = {
    network: await ethers.provider.getNetwork().then(n => n.name),
    chainId: await ethers.provider.getNetwork().then(n => n.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ProtocolGuardians: guardiansAddress,
      ProtocolPower: powerAddress,
      ProtocolStaking: stakingAddress,
      ProtocolTimelock: timelockAddress
    },
    configuration: {
      baseURI: BASE_URI,
      timelockDelay: TIMELOCK_DELAY,
      proposers: proposers,
      executors: executors,
      admin: admin
    },
    transactions: transactions,
    totalGasCost: totalGasCost
  };

  const fs = require('fs');
  const path = require('path');
  const deploymentPath = path.join(__dirname, '..', 'deployments.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployments.json");

  return {
    guardians: guardiansAddress,
    power: powerAddress,
    staking: stakingAddress,
    timelock: timelockAddress
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
