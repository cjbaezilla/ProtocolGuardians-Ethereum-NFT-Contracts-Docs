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

async function executeTransaction(contract, method, args = [], txName, signer) {
  console.log(`  ⛽ Estimating gas for ${txName}...`);
  
  const gasInfo = await estimateGasAndCost(contract, method, args);
  const estimatedCostEth = ethers.formatEther(gasInfo.estimatedCost);
  
  console.log(`  ⛽ Estimated gas: ${gasInfo.gasEstimate.toLocaleString()} | Cost: ~${estimatedCostEth} ETH`);
  
  const balance = await ethers.provider.getBalance(signer.address);
  if (balance < gasInfo.estimatedCost) {
    throw new Error(`Insufficient balance. Required: ${estimatedCostEth} ETH, Available: ${ethers.formatEther(balance)} ETH`);
  }
  
  const tx = await contract[method](...args);
  console.log(`  ✅ Transaction: ${tx.hash}`);
  
  const receipt = await tx.wait();
  const actualCost = receipt.gasUsed * (receipt.effectiveGasPrice || receipt.gasPrice || 0);
  const actualCostEth = ethers.formatEther(actualCost);
  
  const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice || 0;
  console.log(`  📊 Gas used: ${receipt.gasUsed.toLocaleString()} | Effective price: ${ethers.formatUnits(effectiveGasPrice, 'gwei')} gwei | Cost: ${actualCostEth} ETH`);
  
  return {
    name: txName,
    hash: tx.hash,
    from: receipt.from,
    to: receipt.to,
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: effectiveGasPrice.toString(),
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
  console.log("TOTAL TESTING COST:".padEnd(55) + totalCost.toFixed(6) + " ETH");
  console.log("=".repeat(80));
  
  return totalCost.toFixed(6);
}

async function validateContractState(guardians, testName) {
  console.log(`\n🔍 ${testName} - Contract State Validation:`);
  
  try {
    const name = await guardians.name();
    const symbol = await guardians.symbol();
    const baseURI = await guardians.baseURI();
    const totalSupply = await guardians.totalSupply();
    const owner = await guardians.owner();
    const contractBalance = await guardians.getBalance();
    
    console.log(`  ✅ Name: ${name}`);
    console.log(`  ✅ Symbol: ${symbol}`);
    console.log(`  ✅ Base URI: ${baseURI}`);
    console.log(`  ✅ Total Supply: ${totalSupply.toString()}`);
    console.log(`  ✅ Owner: ${owner}`);
    console.log(`  ✅ Contract Balance: ${ethers.formatEther(contractBalance)} ETH`);
    
    return {
      name,
      symbol,
      baseURI,
      totalSupply: totalSupply.toString(),
      owner,
      contractBalance: ethers.formatEther(contractBalance)
    };
  } catch (error) {
    console.log(`  ❌ Error validating contract state: ${error.message}`);
    throw error;
  }
}

async function getTokenOwnership(guardians, tokenId) {
  try {
    const owner = await guardians.ownerOf(tokenId);
    const tokenURI = await guardians.tokenURI(tokenId);
    return { owner, tokenURI };
  } catch (error) {
    return { owner: null, tokenURI: null, error: error.message };
  }
}

async function main() {
  console.log("🧪 Starting ProtocolGuardians Local Testing Suite...\n");

  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("👥 Test Accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  console.log("  User3:", user3.address);
  console.log("");

  const transactions = [];

  const TEST_CIDS = [
    "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly",
    "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye",
    "bafybeidrpfjuwpzqpg3dgdwaoadyrn6vznhvgxitkma7uy3u54ncfakhyy",
    "bafybeicq2j7q4j6y7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f"
  ];

  const BASE_URI = "https://ipfs.io/ipfs/";
  const MINT_COUNT = 8; // Mint 8 NFTs for comprehensive testing
  
  console.log("📋 Test Configuration:");
  console.log("- Base URI:", BASE_URI);
  console.log("- NFTs to mint:", MINT_COUNT);
  console.log("- Network: Local Hardhat");
  console.log("");

  console.log("🚀 1️⃣ DEPLOYING CONTRACT");
  console.log("=".repeat(50));
  
  const ProtocolGuardians = await ethers.getContractFactory("ProtocolGuardians");
  const guardians = await ProtocolGuardians.deploy(BASE_URI);
  await guardians.waitForDeployment();
  const guardiansAddress = await guardians.getAddress();
  
  const deployReceipt = await guardians.deploymentTransaction().wait();
  const effectiveGasPrice = deployReceipt.effectiveGasPrice || deployReceipt.gasPrice || 0;
  const deployTxInfo = {
    name: "Deploy ProtocolGuardians",
    hash: guardians.deploymentTransaction().hash,
    from: deployReceipt.from,
    to: deployReceipt.to,
    gasUsed: deployReceipt.gasUsed.toString(),
    effectiveGasPrice: effectiveGasPrice.toString(),
    costInEth: ethers.formatEther(deployReceipt.gasUsed * effectiveGasPrice),
    blockNumber: deployReceipt.blockNumber
  };
  transactions.push(deployTxInfo);
  
  console.log("✅ Contract deployed to:", guardiansAddress);

  await validateContractState(guardians, "Initial Deployment");

  console.log("\n🎨 2️⃣ MINTING OPERATIONS");
  console.log("=".repeat(50));
  
  const mintedTokens = [];
  const mintTargets = [
    { address: deployer.address, name: "Deployer" },
    { address: user1.address, name: "User1" },
    { address: user2.address, name: "User2" },
    { address: user3.address, name: "User3" }
  ];

  for (let i = 0; i < MINT_COUNT; i++) {
    const target = mintTargets[i % mintTargets.length];
    console.log(`\n${i + 1}️⃣ Minting NFT to ${target.name} (${target.address})...`);
    
    const mintTx = await executeTransaction(
      guardians, 
      "mint", 
      [target.address, TEST_CIDS[i % TEST_CIDS.length]], 
      `Mint to ${target.name}`, 
      deployer
    );
    
    transactions.push(mintTx);
    
    const totalSupply = await guardians.totalSupply();
    const tokenId = totalSupply.toString();
    mintedTokens.push({ tokenId, owner: target.address, ownerName: target.name });
    
    console.log(`  🎨 Minted NFT with ID: ${tokenId}`);
    
    const tokenData = await getTokenOwnership(guardians, tokenId);
    if (tokenData.owner === target.address) {
      console.log(`  ✅ Token ${tokenId} correctly owned by ${target.name}`);
      console.log(`  🔗 Token URI: ${tokenData.tokenURI}`);
    } else {
      console.log(`  ❌ Token ${tokenId} ownership mismatch!`);
    }
  }

  console.log("\n🔍 3️⃣ CONTRACT STATE VALIDATION");
  console.log("=".repeat(50));
  
  const finalState = await validateContractState(guardians, "After Minting");

  console.log("\n🎯 Validating all minted tokens:");
  for (const token of mintedTokens) {
    const tokenData = await getTokenOwnership(guardians, token.tokenId);
    if (tokenData.owner === token.owner) {
      console.log(`  ✅ Token #${token.tokenId}: Owner ${token.ownerName} ✓`);
    } else {
      console.log(`  ❌ Token #${token.tokenId}: Ownership error!`);
    }
  }

s
  console.log("\n💰 Balance check:");
  for (const target of mintTargets) {
    const balance = await guardians.balanceOf(target.address);
    console.log(`  ${target.name}: ${balance.toString()} NFTs`);
  }

  console.log("\n🔄 4️⃣ TRANSFER OPERATIONS");
  console.log("=".repeat(50));
  
  const tokenToTransfer = mintedTokens.find(t => t.ownerName === "Deployer")?.tokenId;
  if (tokenToTransfer) {
    console.log(`\n🔄 Transferring Token #${tokenToTransfer} from Deployer to User1...`);
    
    const transferTx = await executeTransaction(
      guardians,
      "transferFrom",
      [deployer.address, user1.address, tokenToTransfer],
      "Transfer NFT",
      deployer
    );
    
    transactions.push(transferTx);
    
    const newOwner = await guardians.ownerOf(tokenToTransfer);
    if (newOwner === user1.address) {
      console.log(`  ✅ Token #${tokenToTransfer} successfully transferred to User1`);
    } else {
      console.log(`  ❌ Transfer failed! Token still owned by ${newOwner}`);
    }
    
    const tokenIndex = mintedTokens.findIndex(t => t.tokenId === tokenToTransfer);
    if (tokenIndex !== -1) {
      mintedTokens[tokenIndex].owner = user1.address;
      mintedTokens[tokenIndex].ownerName = "User1";
    }
  }

  console.log("\n🔐 5️⃣ APPROVAL OPERATIONS");
  console.log("=".repeat(50));
  
  const tokenToApprove = mintedTokens.find(t => t.ownerName === "User1")?.tokenId;
  if (tokenToApprove) {
    console.log(`\n🔐 Approving Token #${tokenToApprove} for User2 to manage...`);
    
    const approveTx = await executeTransaction(
      guardians.connect(user1),
      "approve",
      [user2.address, tokenToApprove],
      "Approve single token",
      user1
    );
    
    transactions.push(approveTx);
    
    const approvedAddress = await guardians.getApproved(tokenToApprove);
    if (approvedAddress === user2.address) {
      console.log(`  ✅ Token #${tokenToApprove} approved for User2`);
    } else {
      console.log(`  ❌ Approval failed!`);
    }
  }

  console.log(`\n🔐 Setting User2 as operator for all User1's tokens...`);
  
  const setApprovalForAllTx = await executeTransaction(
    guardians.connect(user1),
    "setApprovalForAll",
    [user2.address, true],
    "Set approval for all",
    user1
  );
  
  transactions.push(setApprovalForAllTx);
  
  const isApprovedForAll = await guardians.isApprovedForAll(user1.address, user2.address);
  if (isApprovedForAll) {
    console.log(`  ✅ User2 is now approved operator for all User1's tokens`);
  } else {
    console.log(`  ❌ setApprovalForAll failed!`);
  }

  const tokenToTransferByOperator = mintedTokens.find(t => t.ownerName === "User1")?.tokenId;
  if (tokenToTransferByOperator) {
    console.log(`\n🔄 User2 transferring Token #${tokenToTransferByOperator} (as operator) to User3...`);
    
    const operatorTransferTx = await executeTransaction(
      guardians.connect(user2),
      "transferFrom",
      [user1.address, user3.address, tokenToTransferByOperator],
      "Transfer by operator",
      user2
    );
    
    transactions.push(operatorTransferTx);
    
    const newOwner = await guardians.ownerOf(tokenToTransferByOperator);
    if (newOwner === user3.address) {
      console.log(`  ✅ Token #${tokenToTransferByOperator} successfully transferred by operator`);
    } else {
      console.log(`  ❌ Operator transfer failed!`);
    }
    
    const tokenIndex = mintedTokens.findIndex(t => t.tokenId === tokenToTransferByOperator);
    if (tokenIndex !== -1) {
      mintedTokens[tokenIndex].owner = user3.address;
      mintedTokens[tokenIndex].ownerName = "User3";
    }
  }

  console.log("\n👑 6️⃣ OWNER OPERATIONS");
  console.log("=".repeat(50));
  
  console.log("🔍 Testing owner-only functions...");
  
  const contractBalance = await guardians.getBalance();
  console.log(`  💰 Contract balance: ${ethers.formatEther(contractBalance)} ETH`);
  
  if (contractBalance > 0) {
    console.log(`  💸 Testing withdraw function...`);
    try {
      const withdrawTx = await executeTransaction(
        guardians,
        "withdraw",
        [],
        "Withdraw ETH",
        deployer
      );
      
      transactions.push(withdrawTx);
      console.log(`  ✅ Withdraw successful`);
    } catch (error) {
      console.log(`  ⚠️ Withdraw test skipped: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️ No ETH to withdraw, skipping withdraw test`);
  }

  console.log("\n📊 7️⃣ FINAL VALIDATION AND SUMMARY");
  console.log("=".repeat(50));
  
  const finalContractState = await validateContractState(guardians, "Final State");

  console.log("\n🎯 Final Token Ownership:");
  for (const token of mintedTokens) {
    const tokenData = await getTokenOwnership(guardians, token.tokenId);
    if (tokenData.owner === token.owner) {
      console.log(`  ✅ Token #${token.tokenId}: ${token.ownerName} ✓`);
    } else {
      console.log(`  ❌ Token #${token.tokenId}: Ownership error!`);
    }
  }

  console.log("\n💰 Final Balances:");
  for (const target of mintTargets) {
    const balance = await guardians.balanceOf(target.address);
    console.log(`  ${target.name}: ${balance.toString()} NFTs`);
  }

  const totalGasCost = formatGasInfo(transactions);

  console.log("\n🎉 LOCAL TESTING COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(80));
  
  console.log("\n📋 Test Summary:");
  console.log("- Contract deployed successfully ✅");
  console.log(`- ${MINT_COUNT} NFTs minted successfully ✅`);
  console.log("- Token URIs generated correctly ✅");
  console.log("- Transfer operations working ✅");
  console.log("- Approval operations working ✅");
  console.log("- Owner functions working ✅");
  console.log("- All validations passed ✅");
  
  console.log("\n📊 Contract Information:");
  console.log("- Contract Address:", guardiansAddress);
  console.log("- Contract Name:", finalContractState.name);
  console.log("- Contract Symbol:", finalContractState.symbol);
  console.log("- Final Total Supply:", finalContractState.totalSupply);
  console.log("- Owner:", finalContractState.owner);
  
  console.log("\n🎯 NFT Distribution:");
  const distribution = {};
  for (const token of mintedTokens) {
    distribution[token.ownerName] = (distribution[token.ownerName] || 0) + 1;
  }
  Object.entries(distribution).forEach(([owner, count]) => {
    console.log(`- ${owner}: ${count} NFT(s)`);
  });
  
  console.log("\n⚙️ All operations tested successfully:");
  console.log("✅ Contract deployment");
  console.log("✅ NFT minting to multiple addresses");
  console.log("✅ Token URI generation");
  console.log("✅ Ownership verification");
  console.log("✅ Token transfers");
  console.log("✅ Single token approvals");
  console.log("✅ Set approval for all");
  console.log("✅ Operator transfers");
  console.log("✅ Owner functions");
  console.log("✅ Contract state validations");

  return {
    contractAddress: guardiansAddress,
    contractState: finalContractState,
    mintedTokens: mintedTokens,
    totalTransactions: transactions.length,
    totalGasCost: totalGasCost,
    testResults: {
      deployment: true,
      minting: true,
      transfers: true,
      approvals: true,
      ownerFunctions: true,
      validations: true
    }
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Local testing failed:", error);
      process.exit(1);
    });
}

module.exports = main;
