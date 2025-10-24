const { ethers } = require("hardhat");
const { 
  getOptimizedFeeData, 
  estimateWithMargin, 
  askForConfirmation, 
  getGasConditions,
  executeOptimizedTransaction,
  formatGasInfo
} = require("./gas-utils");

async function calculateBatchStrategy(amount, maxBatchSize = 20) {
  if (amount <= 1) {
    return { strategy: 'individual', batches: [{ size: 1, count: amount }] };
  }
  
  const batches = [];
  let remaining = amount;
  
  while (remaining > 0) {
    const batchSize = Math.min(remaining, maxBatchSize);
    batches.push({ size: batchSize, count: 1 });
    remaining -= batchSize;
  }
  
  return {
    strategy: batches.length === 1 && batches[0].size > 1 ? 'single-batch' : 'multi-batch',
    batches
  };
}

async function estimateMintingStrategy(contract, recipient, cid, amount) {
  try {
    console.log("🔍 Analyzing minting strategies...");
    
    const individualGas = await contract.mint.estimateGas(recipient, cid);
    const individualTotal = individualGas * BigInt(amount);
    
    let batchGas = null;
    let batchTotal = null;
    
    if (amount > 1) {
      const cids = Array(amount).fill(cid);
      batchGas = await contract.batchMintToSingleAddress.estimateGas(recipient, cids);
      batchTotal = batchGas;
    }
    
    const feeData = await getOptimizedFeeData();
    const individualCost = individualTotal * feeData.maxFeePerGas;
    const batchCost = batchTotal ? batchTotal * feeData.maxFeePerGas : null;
    
    console.log(`📊 Individual minting: ${individualGas.toLocaleString()} gas per NFT`);
    console.log(`📊 Total individual: ${individualTotal.toLocaleString()} gas (${ethers.formatEther(individualCost)} ETH)`);
    
    if (batchCost) {
      console.log(`📊 Batch minting: ${batchGas.toLocaleString()} gas total`);
      console.log(`📊 Batch cost: ${ethers.formatEther(batchCost)} ETH`);
      
      const savings = individualCost - batchCost;
      const savingsPercent = (Number(savings) / Number(individualCost)) * 100;
      
      console.log(`💰 Batch savings: ${ethers.formatEther(savings)} ETH (${savingsPercent.toFixed(1)}%)`);
      
      return {
        strategy: savings > 0 ? 'batch' : 'individual',
        individualCost,
        batchCost,
        savings,
        savingsPercent
      };
    }
    
    return {
      strategy: 'individual',
      individualCost,
      batchCost: null,
      savings: 0n,
      savingsPercent: 0
    };
  } catch (error) {
    console.log("⚠️ Could not estimate batch strategy, falling back to individual minting");
    return {
      strategy: 'individual',
      individualCost: 0n,
      batchCost: null,
      savings: 0n,
      savingsPercent: 0
    };
  }
}

async function main() {
  console.log("🎨 Starting ProtocolGuardians NFT minting...\n");

  const CONTRACT_ADDRESS = ""; // Replace with your deployed contract address
  const TO_ADDRESS = "0xaEeaA55ED4f7df9E4C5688011cEd1E2A1b696772"; // Set to null to use signer address, or specify a recipient address
  const AMOUNT = 1; // Number of NFTs to mint
  const CID = "bafybeidrpfjuwpzqpg3dgdwaoadyrn6vznhvgxitkma7uy3u54ncfakhyy"; // IPFS CID for metadata

  const [signer] = await ethers.getSigners();
  console.log("Minting NFTs with account:", signer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH\n");

  const recipientAddress = TO_ADDRESS || signer.address;

  console.log("📋 Minting Configuration:");
  console.log("- Contract Address:", CONTRACT_ADDRESS);
  console.log("- Recipient Address:", recipientAddress);
  console.log("- Amount to mint:", AMOUNT);
  console.log("- CID:", CID);
  console.log("");

  const ProtocolGuardians = await ethers.getContractFactory("ProtocolGuardians");
  const guardians = ProtocolGuardians.attach(CONTRACT_ADDRESS);

  try {
    const contractName = await guardians.name();
    const contractSymbol = await guardians.symbol();
    const owner = await guardians.owner();
    console.log("✅ Connected to contract:", contractName, `(${contractSymbol})`);
    console.log("✅ Contract owner:", owner);
    console.log("✅ Current total supply:", (await guardians.totalSupply()).toString());
    console.log("");
  } catch (error) {
    throw new Error(`❌ Failed to connect to contract at ${CONTRACT_ADDRESS}: ${error.message}`);
  }

  const contractOwner = await guardians.owner();
  if (signer.address.toLowerCase() !== contractOwner.toLowerCase()) {
    throw new Error(`❌ Only the contract owner can mint NFTs. Owner: ${contractOwner}, Signer: ${signer.address}`);
  }

  const transactions = [];
  const mintedTokenIds = [];

  console.log(`🎨 Analyzing minting strategy for ${AMOUNT} NFT(s)...`);
  const strategy = await estimateMintingStrategy(guardians, recipientAddress, CID, AMOUNT);
  const batchStrategy = await calculateBatchStrategy(AMOUNT);
  
  console.log(`📊 Recommended strategy: ${strategy.strategy}`);
  if (strategy.savings > 0) {
    console.log(`💰 Potential savings: ${ethers.formatEther(strategy.savings)} ETH (${strategy.savingsPercent.toFixed(1)}%)`);
  }
  
  const estimatedCost = strategy.strategy === 'batch' ? strategy.batchCost : strategy.individualCost;
  const confirmed = await askForConfirmation(
    `Mint ${AMOUNT} NFT(s) using ${strategy.strategy} strategy?`,
    ethers.formatEther(estimatedCost)
  );
  
  if (!confirmed) {
    console.log("❌ Minting cancelled by user");
    return;
  }

  if (strategy.strategy === 'batch' && AMOUNT > 1) {
    console.log(`\n🎨 Batch minting ${AMOUNT} NFT(s) to ${recipientAddress}...`);
    
    const cids = Array(AMOUNT).fill(CID);
    const batchTx = await executeOptimizedTransaction(
      guardians,
      "batchMintToSingleAddress",
      [recipientAddress, cids],
      `Batch mint ${AMOUNT} NFTs`,
      signer
    );
    
    transactions.push(batchTx);
    
    const initialSupply = await guardians.totalSupply();
    for (let i = 0; i < AMOUNT; i++) {
      const tokenId = (initialSupply - BigInt(AMOUNT) + BigInt(i + 1)).toString();
      mintedTokenIds.push(tokenId);
    }
    
    console.log(`🎨 Batch minted ${AMOUNT} NFTs with IDs: ${mintedTokenIds.join(', ')}`);
  } else {
    console.log(`\n🎨 Individual minting ${AMOUNT} NFT(s) to ${recipientAddress}...`);
    
    for (let i = 0; i < AMOUNT; i++) {
      console.log(`\n${i + 1}️⃣ Minting NFT #${i + 1}...`);
      
      const mintTx = await executeOptimizedTransaction(
        guardians, 
        "mint", 
        [recipientAddress, CID], 
        `Mint NFT #${i + 1}`, 
        signer
      );
      
      transactions.push(mintTx);
      
      const totalSupply = await guardians.totalSupply();
      const tokenId = totalSupply.toString();
      mintedTokenIds.push(tokenId);
      
      console.log(`  🎨 Minted NFT with ID: ${tokenId}`);
    }
  }

  console.log("\n🔍 Verifying minting results...");
  const finalTotalSupply = await guardians.totalSupply();
  console.log("✅ Final total supply:", finalTotalSupply.toString());
  
  console.log("\n🔗 Token URIs for minted NFTs:");
  for (const tokenId of mintedTokenIds) {
    try {
      const tokenURI = await guardians.tokenURI(tokenId);
      console.log(`  Token #${tokenId}: ${tokenURI}`);
    } catch (error) {
      console.log(`  Token #${tokenId}: Error getting URI - ${error.message}`);
    }
  }

  const totalGasCost = formatGasInfo(transactions);

  console.log("\n🎉 NFT minting completed successfully!");
  console.log("\n📊 Minting Summary:");
  console.log("=".repeat(50));
  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("Recipient:", recipientAddress);
  console.log("Amount Minted:", AMOUNT);
  console.log("Minted Token IDs:", mintedTokenIds.join(", "));
  console.log("Final Total Supply:", finalTotalSupply.toString());
  console.log("Total Cost:", totalGasCost, "ETH");
  console.log("=".repeat(50));

  console.log("\n⚙️ Next Steps:");
  console.log("1. Verify the NFTs in a block explorer");
  console.log("2. Check the NFTs in a wallet that supports the collection");
  console.log("3. Test transferring NFTs between addresses");

  console.log("\n📝 Important Notes:");
  console.log("- Only the contract owner can mint new NFTs");
  console.log("- Each NFT has a unique token ID");
  console.log("- Token URIs point to metadata stored at the base URI");
  console.log("- Gas optimization enabled with EIP-1559 and batch minting");

  return {
    contractAddress: CONTRACT_ADDRESS,
    recipient: recipientAddress,
    amountMinted: AMOUNT,
    mintedTokenIds: mintedTokenIds,
    finalTotalSupply: finalTotalSupply.toString(),
    totalCost: totalGasCost,
    transactions: transactions
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Minting failed:", error);
      process.exit(1);
    });
}

module.exports = main;
