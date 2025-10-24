# ProtocolGuardians Deployment Guide

## Prerequisites

### Required Tools
- Node.js >= 16.0.0
- npm or yarn
- Git
- Wallet with ETH for gas

### Dependencies
```bash
npm install --save-dev solady @openzeppelin/contracts
```

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Mainnet
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here

# Testnet (optional)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 2. Hardhat Configuration

The `hardhat.config.js` file is already configured with necessary networks:

```javascript
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL,
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

## Deployment Process

### 1. Preparation

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### 2. Local Deployment (Testing)

```bash
# Start local network
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Testnet Deployment

```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

### 4. Mainnet Deployment

```bash
# Deploy to Ethereum Mainnet
npx hardhat run scripts/deploy.js --network ethereum
```

## Production Deployment

### Deployed Contracts

The ProtocolGuardians NFT contract is already deployed and verified on Ethereum Mainnet:

- **ProtocolGuardians NFT**: [`0xfB49118d739482048ff514b699C23E2875a91837`](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Etherscan**: [View Contract](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Sourcify**: [Verified Source](https://repo.sourcify.dev/1/0xfB49118d739482048ff514b699C23E2875a91837/)
- **Blockscout**: [View on Blockscout](https://eth.blockscout.com/address/0xfB49118d739482048ff514b699C23E2875a91837?tab=contract)
- **Routescan**: [View on Routescan](https://routescan.io/address/0xfB49118d739482048ff514b699C23E2875a91837/contract/1/code)

## Deployment Script

### Script Structure

The `scripts/deploy.js` script includes:

1. **Contract Deployment**
2. **Role Configuration**
3. **Configuration Verification**
4. **Basic Tests**
5. **Information Saving**

### Custom Configuration

Before deployment, modify these variables in the script:

```javascript
// Configuration
const BASE_URI = "ipfs://QmYourIPFSHashHere/"; // Replace with your IPFS hash
const TIMELOCK_DELAY = 2 * 24 * 60 * 60; // 2 days in seconds (configurable)

// Roles (modify these addresses)
const proposers = [deployer.address]; // Add more proposers
const executors = [deployer.address]; // Add more executors
const admin = deployer.address; // Should be multisig in production
```

## Contract Verification

### 1. Etherscan Verification

```bash
# Verify on Base Sepolia
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Verify on Ethereum Mainnet
npx hardhat verify --network ethereum <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 2. Manual Verification

```javascript
// Verify configuration
const nftName = await protocolGuardians.name();
const rewardName = await protocolPower.name();
const stakingNFT = await protocolStaking.nftContract();
const timelockDelay = await protocolTimelock.getMinDelay();

console.log("NFT Name:", nftName);
console.log("Reward Name:", rewardName);
console.log("Staking NFT:", stakingNFT);
console.log("Timelock Delay:", timelockDelay, "seconds");
```

## Post-Deployment Configuration

### 1. Role Configuration

```javascript
// Grant proposer role
await protocolTimelock.grantRole(
    await protocolTimelock.PROPOSER_ROLE(),
    newProposerAddress
);

// Grant executor role
await protocolTimelock.grantRole(
    await protocolTimelock.EXECUTOR_ROLE(),
    newExecutorAddress
);
```

### 2. Multisig Configuration

```javascript
// Transfer admin role to multisig
await protocolTimelock.grantRole(
    await protocolTimelock.TIMELOCK_ADMIN_ROLE(),
    multisigAddress
);

// Revoke admin role from deployer
await protocolTimelock.revokeRole(
    await protocolTimelock.TIMELOCK_ADMIN_ROLE(),
    deployerAddress
);
```

### 3. IPFS Configuration

```javascript
// Verify baseURI is correct
const baseURI = await protocolGuardians._baseURI();
console.log("Base URI:", baseURI);

// BaseURI should point to your IPFS hash
// Example: "ipfs://QmYourHashHere/"
```

## Post-Deployment Monitoring

### 1. Functionality Verification

```javascript
// Basic minting test with IPFS CID
const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
const mintTx = await protocolGuardians.mint(userAddress, cid);
await mintTx.wait();

// Basic staking test
await protocolGuardians.setApprovalForAll(stakingAddress, true);
await protocolStaking.stake([1]);

// Basic governance test
const proposalTx = await protocolTimelock.schedule(
    target, value, data, predecessor, salt, delay
);
```

### 2. Event Monitoring

```javascript
// Monitor staking events
protocolStaking.on("NFTsStaked", (owner, tokenIds) => {
    console.log("NFTs staked:", owner, tokenIds);
});

// Monitor governance events
protocolTimelock.on("CallScheduled", (id, target, value, data, predecessor, delay) => {
    console.log("Proposal scheduled:", id);
});
```

## Troubleshooting

### Common Issues

#### 1. Gas Error
```
Error: insufficient funds for gas
```
**Solution**: Ensure you have enough ETH for gas.

#### 2. Network Error
```
Error: network connection failed
```
**Solution**: Check RPC URL and internet connection.

#### 3. Verification Error
```
Error: contract verification failed
```
**Solution**: Verify constructor parameters are correct.

### Deployment Logs

The deployment script generates detailed logs:

```
🚀 Starting ProtocolGuardians deployment...

📋 Deployment Configuration:
- Base URI: ipfs://QmYourHashHere/
- Timelock Delay: 172800 seconds (2 days)
- Proposers: [0x...]
- Executors: [0x...]
- Admin: 0x...

1️⃣ Deploying ProtocolGuardians NFT...
✅ ProtocolGuardians deployed to: 0x...

2️⃣ Deploying ProtocolTimelock...
✅ ProtocolTimelock deployed to: 0x...

3️⃣ Deploying ProtocolPower...
✅ ProtocolPower deployed to: 0x...

4️⃣ Deploying ProtocolStaking...
✅ ProtocolStaking deployed to: 0x...

5️⃣ Setting up roles...
✅ Granted minter role to ProtocolStaking contract

6️⃣ Verifying configurations...
✅ ProtocolGuardians - Name: ProtocolGuardians Symbol: GUARDIAN
✅ ProtocolPower - Name: ProtocolPower Symbol: CREWARD
✅ ProtocolStaking - NFT Contract: 0x...
✅ ProtocolTimelock - Delay: 172800 seconds

7️⃣ Testing basic functionality...
✅ Successfully minted NFT with ID: 1
✅ Token URI: https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
✅ Approved staking contract for NFT transfers
✅ Successfully staked NFT
✅ Pending rewards: 0.000006944444444444 CREWARD
✅ Successfully unstaked NFT

🎉 Deployment completed successfully!

📊 Contract Addresses:
==================================================
ProtocolGuardians NFT: 0x...
ProtocolPower Token: 0x...
ProtocolStaking: 0x...
ProtocolTimelock: 0x...
==================================================
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Tests passing
- [ ] BaseURI configured correctly
- [ ] Roles defined

### Deployment
- [ ] Contracts deployed
- [ ] Roles configured
- [ ] Verifications passing
- [ ] Basic tests working

### Post-Deployment
- [ ] Contracts verified on Etherscan
- [ ] Multisig configured
- [ ] Monitoring active
- [ ] Documentation updated

## Next Steps

1. **Configure Multisig**: Transfer admin role to multisig
2. **Configure Proposers**: Add more proposers
3. **Configure Executors**: Add more executors
4. **Testing**: Test all functionalities
5. **Documentation**: Update documentation with addresses

## Additional Resources

- [Staking Guide](./staking-guide.md)
- [DAO Governance Guide](./dao-guide.md)
- [Usage Examples](./examples.md)
- [System Architecture](./architecture.md)

## Support

If you encounter issues during deployment:

1. Check deployment logs
2. Verify network configuration
3. Ensure you have enough ETH for gas
4. Consult technical documentation
5. Contact development team
