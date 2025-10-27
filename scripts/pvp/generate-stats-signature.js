const { ethers } = require("hardhat");

/**
 * Generate a cryptographic signature for card stats
 * This is used to prove the authenticity of stats off-chain
 * 
 * @param {number} tokenId - The NFT token ID
 * @param {Array} stats - Array of 8 stats [power, defense, speed, hp, mana, stamina, critical, luck]
 * @param {number} expiration - Unix timestamp when signature expires
 * @param {string} privateKey - Private key of the signer
 * @returns {Object} - Signature object with signature, expiration, and verification data
 */
async function generateStatsSignature(tokenId, stats, expiration, privateKey) {
  // Validate inputs
  if (!stats || stats.length !== 8) {
    throw new Error("Stats must be an array of 8 values");
  }

  // Create message to sign
  const message = ethers.solidityPackedKeccak256(
    ["uint256", "uint256[8]", "uint256"],
    [tokenId, stats, expiration]
  );

  // Create Ethereum signed message hash
  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "bytes32"],
    ["\x19Ethereum Signed Message:\n32", message]
  );

  // Sign the message
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(ethers.getBytes(message));

  return {
    tokenId: tokenId.toString(),
    stats: stats.map(s => s.toString()),
    expiration: expiration.toString(),
    signature: signature,
    message: message,
    signer: wallet.address
  };
}

/**
 * CLI usage
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log("Usage: node generate-stats-signature.js <tokenId> <stats> <expiration> [privateKey]");
    console.log("");
    console.log("Arguments:");
    console.log("  tokenId    - NFT token ID (number)");
    console.log("  stats      - JSON array of 8 stats [power, defense, speed, hp, mana, stamina, critical, luck]");
    console.log("  expiration - Unix timestamp in seconds (current + 3600 for 1 hour)");
    console.log("  privateKey - Private key of the signer (optional, uses SIGNER_PRIVATE_KEY env var)");
    console.log("");
    console.log("Example:");
    console.log('  node generate-stats-signature.js 1 "[1000, 500, 300, 2000, 100, 50, 200, 150]" "$(($(date +%s) + 3600))"');
    console.log("");
    process.exit(1);
  }

  const tokenId = parseInt(args[0]);
  let stats;
  try {
    stats = JSON.parse(args[1]);
  } catch (e) {
    console.error("Error: stats must be a valid JSON array");
    process.exit(1);
  }
  
  const expiration = parseInt(args[2]);
  const privateKey = args[3] || process.env.SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error("Error: Private key required (provide as argument or set SIGNER_PRIVATE_KEY env var)");
    process.exit(1);
  }

  try {
    const result = await generateStatsSignature(tokenId, stats, expiration, privateKey);

    console.log("\n✅ Stats signature generated successfully!\n");
    console.log("=" .repeat(60));
    console.log("SIGNATURE DATA");
    console.log("=" .repeat(60));
    console.log("Token ID:", result.tokenId);
    console.log("Stats:", result.stats.join(", "));
    console.log("Expiration:", new Date(parseInt(result.expiration) * 1000).toISOString());
    console.log("Signer:", result.signer);
    console.log("");
    console.log("Signature:", result.signature);
    console.log("Message Hash:", result.message);
    console.log("=" .repeat(60));
    console.log("");

    // Output in format for contract call
    console.log("For contract verification, use:");
    console.log(`verifyStatsSignature(\n  ${result.tokenId},\n  [${result.stats.join(", ")}],\n  ${result.expiration},\n  "${result.signature}"\n)`);
    console.log("");

  } catch (error) {
    console.error("Error generating signature:", error.message);
    process.exit(1);
  }
}

// Export function for use in other scripts
module.exports = generateStatsSignature;

// Run as CLI if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
