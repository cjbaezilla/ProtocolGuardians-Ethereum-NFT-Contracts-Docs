const { ethers } = require("hardhat");

/**
 * Update the signer address in PvPArena contract
 * This is used when you need to change who signs the stat signatures
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node set-signer.js <newSignerAddress> [pvPArenaAddress]");
    console.log("");
    console.log("Arguments:");
    console.log("  newSignerAddress - New address that will sign stats");
    console.log("  pvPArenaAddress  - PvPArena contract address (optional, uses env var)");
    console.log("");
    console.log("Example:");
    console.log("  node set-signer.js 0x1234567890123456789012345678901234567890");
    console.log("");
    process.exit(1);
  }

  const newSignerAddress = args[0];
  const pvpArenaAddress = args[1] || process.env.PVP_ARENA_ADDRESS;

  if (!pvpArenaAddress) {
    console.error("Error: PvPArena address required (provide as argument or set PVP_ARENA_ADDRESS env var)");
    process.exit(1);
  }

  // Validate address
  if (!ethers.isAddress(newSignerAddress)) {
    console.error("Error: Invalid address format");
    process.exit(1);
  }

  console.log("📝 Setting Signer Address");
  console.log("=" .repeat(60));
  console.log("PvPArena Address:", pvpArenaAddress);
  console.log("New Signer Address:", newSignerAddress);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("From:", deployer.address);
  console.log("");

  try {
    const PvPArena = await ethers.getContractFactory("PvPArena");
    const pvpArena = await PvPArena.attach(pvpArenaAddress);

    // Check current signer
    const currentSigner = await pvpArena.signerAddress();
    console.log("Current Signer:", currentSigner);
    console.log("");

    // Verify deployer is owner
    const owner = await pvpArena.owner();
    if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
      console.error("Error: You must be the contract owner to change the signer");
      process.exit(1);
    }

    // Update signer
    console.log("Updating signer...");
    const tx = await pvpArena.setSignerAddress(newSignerAddress);
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Signer updated successfully!");
    console.log("");

    // Verify the change
    const newSigner = await pvpArena.signerAddress();
    console.log("Verification:");
    console.log("New Signer Address:", newSigner);
    console.log("");

    if (newSigner.toLowerCase() === newSignerAddress.toLowerCase()) {
      console.log("✅ Verification passed!");
    } else {
      console.log("❌ Verification failed!");
    }

    console.log("");
    console.log("Transaction Details:");
    console.log("  Block:", receipt.blockNumber);
    console.log("  Gas Used:", receipt.gasUsed.toString());
    console.log("  Gas Cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
    console.log("");

  } catch (error) {
    console.error("Error updating signer:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

module.exports = main;
