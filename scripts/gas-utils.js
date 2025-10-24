const { ethers } = require("hardhat");
const readline = require('readline');


async function getOptimizedFeeData() {
  try {
    const feeData = await ethers.provider.getFeeData();
    const baseFee = feeData.gasPrice || 0n;
    
    const maxPriorityFeePerGas = ethers.parseUnits("1.5", "gwei");
    
    const maxFeePerGas = (baseFee * 2n) + maxPriorityFeePerGas;
    
    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      baseFee,
      gasPrice: feeData.gasPrice
    };
  } catch (error) {
    throw new Error(`Failed to get fee data: ${error.message}`);
  }
}

function estimateWithMargin(gasEstimate, marginPercent = 10) {
  const margin = (gasEstimate * BigInt(marginPercent)) / 100n;
  return gasEstimate + margin;
}

async function askForConfirmation(message, estimatedCost) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const gasConditions = await getGasConditions();

  return new Promise((resolve) => {
    console.log(`\n💰 ${message}`);
    console.log(`💰 Estimated cost: ${estimatedCost} ETH`);
    console.log(`💰 Current gas conditions: ${gasConditions}`);
    
    rl.question('Do you want to proceed? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

function formatTransactionOptions(gasLimit, feeData) {
  return {
    gasLimit,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
  };
}

async function getGasConditions() {
  try {
    const feeData = await ethers.provider.getFeeData();
    const baseFeeGwei = ethers.formatUnits(feeData.gasPrice || 0n, "gwei");
    const baseFeeNum = parseFloat(baseFeeGwei);
    
    let condition = "🟡 Moderate";
    if (baseFeeNum < 20) {
      condition = "🟢 Excellent (Low gas)";
    } else if (baseFeeNum < 30) {
      condition = "🟢 Good";
    } else if (baseFeeNum < 50) {
      condition = "🟡 Moderate";
    } else if (baseFeeNum < 80) {
      condition = "🟠 High";
    } else {
      condition = "🔴 Very High";
    }
    
    return `${condition} (Base fee: ${baseFeeGwei} gwei)`;
  } catch (error) {
    return "❓ Unknown";
  }
}

async function estimateGasAndCost(contract, method, args = []) {
  try {
    const gasEstimate = await contract[method].estimateGas(...args);
    const feeData = await getOptimizedFeeData();
    const gasLimit = estimateWithMargin(gasEstimate);
    const estimatedCost = gasLimit * feeData.maxFeePerGas;
    
    return {
      gasEstimate,
      gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      estimatedCost,
      baseFee: feeData.baseFee
    };
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
}

async function executeOptimizedTransaction(contract, method, args = [], txName, signer) {
  console.log(`  ⛽ Estimating gas for ${txName}...`);
  
  const gasInfo = await estimateGasAndCost(contract, method, args);
  const estimatedCostEth = ethers.formatEther(gasInfo.estimatedCost);
  
  console.log(`  ⛽ Estimated gas: ${gasInfo.gasEstimate.toLocaleString()} | Gas limit: ${gasInfo.gasLimit.toLocaleString()}`);
  console.log(`  ⛽ Max fee: ${ethers.formatUnits(gasInfo.maxFeePerGas, 'gwei')} gwei | Priority fee: ${ethers.formatUnits(gasInfo.maxPriorityFeePerGas, 'gwei')} gwei`);
  console.log(`  ⛽ Estimated cost: ~${estimatedCostEth} ETH`);
  
  const balance = await ethers.provider.getBalance(signer.address);
  if (balance < gasInfo.estimatedCost) {
    throw new Error(`Insufficient balance. Required: ${estimatedCostEth} ETH, Available: ${ethers.formatEther(balance)} ETH`);
  }
  
  const txOptions = formatTransactionOptions(gasInfo.gasLimit, gasInfo);
  
  const tx = await contract[method](...args, txOptions);
  console.log(`  ✅ Transaction: ${tx.hash}`);
  
  const receipt = await tx.wait();
  const actualCost = receipt.gasUsed * receipt.effectiveGasPrice;
  const actualCostEth = ethers.formatEther(actualCost);
  
  console.log(`  📊 Gas used: ${receipt.gasUsed.toLocaleString()} | Effective price: ${ethers.formatUnits(receipt.effectiveGasPrice, 'gwei')} gwei | Cost: ${actualCostEth} ETH`);
  
  const savings = parseFloat(estimatedCostEth) - parseFloat(actualCostEth);
  if (savings > 0) {
    console.log(`  💰 Savings: ${savings.toFixed(6)} ETH`);
  }
  
  return {
    name: txName,
    hash: tx.hash,
    from: receipt.from,
    to: receipt.to,
    gasUsed: receipt.gasUsed.toString(),
    gasLimit: gasInfo.gasLimit.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    maxFeePerGas: gasInfo.maxFeePerGas.toString(),
    maxPriorityFeePerGas: gasInfo.maxPriorityFeePerGas.toString(),
    costInEth: actualCostEth,
    estimatedCostInEth: estimatedCostEth,
    savings: savings.toFixed(6),
    blockNumber: receipt.blockNumber
  };
}

function formatGasInfo(transactions) {
  const totalCost = transactions.reduce((sum, tx) => sum + parseFloat(tx.costInEth), 0);
  const totalEstimated = transactions.reduce((sum, tx) => sum + parseFloat(tx.estimatedCostInEth || tx.costInEth), 0);
  const totalSavings = totalEstimated - totalCost;
  
  console.log("\n📊 Gas Usage Summary:");
  console.log("=".repeat(100));
  console.log("Transaction".padEnd(25) + "Gas Used".padEnd(15) + "Max Fee".padEnd(15) + "Cost (ETH)".padEnd(15) + "Savings".padEnd(15));
  console.log("-".repeat(100));
  
  transactions.forEach(tx => {
    const gasUsed = parseInt(tx.gasUsed).toLocaleString();
    const maxFeeGwei = ethers.formatUnits(tx.maxFeePerGas || tx.effectiveGasPrice, 'gwei');
    const savings = parseFloat(tx.savings || 0);
    console.log(
      tx.name.padEnd(25) + 
      gasUsed.padEnd(15) + 
      maxFeeGwei.padEnd(15) + 
      tx.costInEth.padEnd(15) +
      (savings > 0 ? `+${savings.toFixed(6)}` : "0.000000").padEnd(15)
    );
  });
  
  console.log("-".repeat(100));
  console.log("TOTAL COST:".padEnd(55) + totalCost.toFixed(6) + " ETH");
  if (totalSavings > 0) {
    console.log("TOTAL SAVINGS:".padEnd(55) + totalSavings.toFixed(6) + " ETH");
  }
  console.log("=".repeat(100));
  
  return totalCost.toFixed(6);
}

module.exports = {
  getOptimizedFeeData,
  estimateWithMargin,
  askForConfirmation,
  formatTransactionOptions,
  getGasConditions,
  estimateGasAndCost,
  executeOptimizedTransaction,
  formatGasInfo
};
