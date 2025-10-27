# PvP System Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Protocol Guardians PvP system to Ethereum or test networks.

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Hardhat installed and configured
- Ethereum account with sufficient ETH for gas
- Private key or mnemonic phrase for deployment

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
PROTOCOL_GUARDIANS_ADDRESS=0xfB49118d739482048ff514b699C23E2875a91837

# Optional: Override defaults
CHALLENGE_FEE=0.001
SIGNER_ADDRESS=0x...

# Network Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

Verify compilation succeeds without errors.

## Deployment Process

### Option 1: Deploy All Contracts (Recommended)

Deploy all contracts in the correct order with a single command:

```bash
npx hardhat run scripts/pvp/deploy-all.js --network <network>
```

**Example:**
```bash
# Deploy to local Hardhat network
npx hardhat run scripts/pvp/deploy-all.js --network localhost

# Deploy to Sepolia testnet
npx hardhat run scripts/pvp/deploy-all.js --network sepolia

# Deploy to Ethereum mainnet
npx hardhat run scripts/pvp/deploy-all.js --network ethereum
```

This will:
1. Deploy PlayerRegistry
2. Deploy BattleEngine
3. Deploy PvPArena (with proper configuration)
4. Save deployment info to `deployments/pvp/complete-pvp-system-<network>.json`

### Option 2: Deploy Contracts Individually

Deploy contracts one by one:

#### Step 1: Deploy PlayerRegistry

```bash
npx hardhat run scripts/pvp/deploy-player-registry.js --network <network>
```

**Configuration:**
- `PROTOCOL_GUARDIANS_ADDRESS`: Main NFT contract address
- `INITIAL_ELO`: Starting ELO (default: 1000)
- `XP_PER_LEVEL`: XP per level (default: 100)

#### Step 2: Deploy BattleEngine

```bash
npx hardhat run scripts/pvp/deploy-battle-engine.js --network <network>
```

**Configuration:**
- `MAX_TURNS`: Maximum battle turns (default: 50)
- `TYPE_ADVANTAGE_BONUS`: Type advantage % (default: 15)
- `TYPE_DISADVANTAGE_PENALTY`: Type disadvantage % (default: 15)
- `CRITICAL_MULTIPLIER`: Critical hit multiplier (default: 2)
- `MIN_DAMAGE`: Minimum damage (default: 1)

#### Step 3: Deploy PvPArena

```bash
# Set environment variables
export PLAYER_REGISTRY_ADDRESS=<address_from_step_1>
export BATTLE_ENGINE_ADDRESS=<address_from_step_2>
export SIGNER_ADDRESS=<backend_signer_address>

npx hardhat run scripts/pvp/deploy-pvp-arena.js --network <network>
```

**Configuration:**
- `PLAYER_REGISTRY_ADDRESS`: Address from Step 1
- `BATTLE_ENGINE_ADDRESS`: Address from Step 2
- `SIGNER_ADDRESS`: Backend signing service address
- `CHALLENGE_FEE`: Fee to create challenges (default: 0.001 ETH)
- `PROTOCOL_FEE_PERCENT`: Protocol fee % (default: 3)

## Post-Deployment Steps

### 1. Verify Contracts

#### Using Hardhat Verify Plugin

```bash
# Verify PlayerRegistry
npx hardhat verify --network <network> <PLAYER_REGISTRY_ADDRESS> <PROTOCOL_GUARDIANS_ADDRESS> 1000 100

# Verify BattleEngine
npx hardhat verify --network <network> <BATTLE_ENGINE_ADDRESS> 50 15 15 2 1

# Verify PvPArena
npx hardhat verify --network <network> <PVP_ARENA_ADDRESS> <PLAYER_REGISTRY_ADDRESS> <BATTLE_ENGINE_ADDRESS> <SIGNER_ADDRESS> "1000000000000000" 3
```

#### Using Etherscan

1. Go to Etherscan for your network
2. Navigate to the contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Fill in the form with contract details

### 2. Configure Backend Signer

The backend service needs to generate signatures for NFT stats. Update the signer configuration:

```bash
# Using the set-signer script
npx hardhat run scripts/pvp/set-signer.js --network <network>

# Or call the contract directly
npx hardhat console --network <network>
```

In the console:
```javascript
const PvPArena = await ethers.getContractAt("PvPArena", PVP_ARENA_ADDRESS);
await pvpArena.setSignerAddress(BACKEND_SIGNER_ADDRESS);
```

### 3. Set Up Backend Signature Service

Your backend must:

1. Expose an API endpoint to sign stats
2. Use the same private key as the deployed signer address
3. Validate stats before signing
4. Include expiration (1 hour from current time)
5. Rate limit requests

Example signature generation:
```javascript
const message = keccak256(abi.encodePacked(
    tokenId,
    statsArray,
    expiration
));
const signature = await wallet.signMessage(arrayify(message));
```

### 4. Update Frontend Configuration

Update your frontend to use the deployed contract addresses:

```javascript
const config = {
  playerRegistryAddress: "0x...",
  battleEngineAddress: "0x...",
  pvpArenaAddress: "0x...",
  protocolGuardiansAddress: "0x...",
  backendApiUrl: "https://your-api.com",
  network: "mainnet" // or "sepolia", "localhost"
};
```

### 5. Test the Deployment

#### Create Test Players

```javascript
const playerRegistry = await ethers.getContractAt("PlayerRegistry", PLAYER_REGISTRY_ADDRESS);

// Register a test player
await playerRegistry.registerPlayer("TestPlayer", "https://example.com/avatar.png");

// Set a formation
await playerRegistry.setFormation(1, [tokenId]);
```

#### Create a Test Challenge

```javascript
const pvpArena = await ethers.getContractAt("PvPArena", PVP_ARENA_ADDRESS);

// Get signed stats from backend
const signedStats = await backendApi.getSignedStats(tokenIds);

// Create challenge
await pvpArena.createRankingChallenge(
  opponentAddress,
  1, // 1v1 battle type
  signedStats,
  { value: ethers.parseEther("0.001") } // Challenge fee
);
```

## Network-Specific Instructions

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/pvp/deploy-all.js --network localhost
```

### Sepolia Testnet

```bash
# Ensure you have Sepolia ETH
npx hardhat run scripts/pvp/deploy-all.js --network sepolia
```

### Ethereum Mainnet

```bash
# Double-check all addresses and configuration
# Ensure sufficient ETH for gas
npx hardhat run scripts/pvp/deploy-all.js --network ethereum
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npx hardhat test`)
- [ ] Contracts compiled successfully
- [ ] Environment variables configured
- [ ] Sufficient ETH in deployment account
- [ ] ProtocolGuardians NFT address verified
- [ ] Backend signer service ready

### Deployment

- [ ] PlayerRegistry deployed
- [ ] BattleEngine deployed
- [ ] PvPArena deployed
- [ ] All addresses saved to deployment JSON

### Post-Deployment

- [ ] Contracts verified on Etherscan
- [ ] Signer address configured
- [ ] Backend API operational
- [ ] Frontend updated with addresses
- [ ] Test transactions executed
- [ ] First real battle completed successfully

## Configuration Management

### Updating Fees

```bash
npx hardhat console --network <network>

const pvpArena = await ethers.getContractAt("PvPArena", PVP_ARENA_ADDRESS);

// Update challenge fee
await pvpArena.setChallengeFee(ethers.parseEther("0.002"));

// Update protocol fee percentage
await pvpArena.setProtocolFeePercent(5);
```

### Pausing Contracts

```bash
// Pause matchmaking
await pvpArena.setPauseStatus(0, true); // Pause ranking challenges

// Pause wagers
await pvpArena.setPauseStatus(1, true); // Pause wager challenges

// Unpause
await pvpArena.setPauseStatus(0, false);
```

### Withdrawing Fees

```bash
// Withdraw accumulated ETH fees
await pvpArena.withdrawFees();

// Withdraw specific ERC20 fees
await pvpArena.emergencyWithdraw(erc20TokenAddress);
```

## Troubleshooting

### Common Issues

#### 1. Out of Gas

**Problem**: Deployment fails with "out of gas" error.

**Solution**:
- Increase gas limit in `hardhat.config.js`
- Check gas prices on the network
- Ensure sufficient balance

#### 2. Signature Verification Fails

**Problem**: Backend signatures not validating.

**Solution**:
- Verify signer address matches in PvPArena contract
- Check message format matches contract expectation
- Ensure correct keccak256 hashing
- Verify signature hasn't expired

#### 3. Formation Validation Fails

**Problem**: Can't set formation.

**Solution**:
- Verify NFT ownership
- Check NFTs not in staking
- Ensure formation size matches battle type
- Verify formation not in use by pending challenge

### Getting Help

- Check contract events for detailed error messages
- Review transaction logs on Etherscan
- Use Hardhat console for debugging
- Consult contract documentation

## Security Considerations

### Admin Access

- Keep private keys secure
- Use multi-sig wallet for production
- Rotate admin keys periodically
- Monitor contract for suspicious activity

### Fee Management

- Periodically withdraw protocol fees
- Monitor accumulated balances
- Set reasonable fee amounts
- Consider fee distribution to stakeholders

### Backend Security

- Secure signer private key
- Implement rate limiting
- Validate all stats before signing
- Monitor for signature replay attempts

## Maintenance

### Regular Tasks

- Weekly: Check accumulated fees
- Weekly: Review contract events
- Monthly: Update documentation
- As needed: Adjust fees based on network conditions

### Monitoring

Monitor the following metrics:
- Number of battles per day
- Average gas costs
- Protocol fee accumulation
- Error rates in challenge execution
- Player ELO distribution

## Next Steps

After deployment:

1. Test thoroughly on testnet
2. Get community feedback
3. Conduct security audit
4. Deploy to mainnet
5. Launch frontend
6. Announce to community
7. Monitor and iterate
