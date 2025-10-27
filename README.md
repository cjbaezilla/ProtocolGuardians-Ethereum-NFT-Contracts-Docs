# Protocol Guardians - NFT Collection with Staking & DAO Governance

A complete ERC721 NFT ecosystem with staking capabilities and DAO governance built on Ethereum. This project implements a secure, gas-optimized NFT collection with automatic reward distribution and decentralized governance.

**🌐 Website**: [protocolguardians.com](https://protocolguardians.com)

## 🔒 Security-First Design

This project has been thoroughly analyzed for security vulnerabilities using [Slither](https://github.com/crytic/slither), a static analysis framework for Solidity. All critical security issues have been identified and fixed.

**Security Features:**
- ✅ **Static Analysis**: Automated vulnerability detection with Slither
- ✅ **Reentrancy Protection**: Checks-Effects-Interactions pattern implementation
- ✅ **Access Control**: Role-based permissions and Ownable pattern
- ✅ **Governance Security**: 2-day timelock for all administrative changes
- ✅ **Input Validation**: Comprehensive parameter validation
- ✅ **Emergency Functions**: Withdraw mechanisms for accidental ETH

📖 **[Read Full Security Analysis](./SECURITY.md)**

## 🏗️ Architecture

### Core Contracts
- **ProtocolGuardians**: ERC721 NFT collection with immutable IPFS metadata
- **ProtocolPower**: ERC20 token with governance capabilities for staking rewards
- **ProtocolStaking**: Custody staking contract with automatic reward distribution
- **ProtocolTimelock**: Configurable timelock controller (default 2-day) for secure DAO governance

### PvP System Contracts (Recently Enhanced)
- **PlayerRegistry**: Manages player profiles, formations, ELO rankings, and XP progression (45+ tests)
- **BattleEngine**: Implements turn-based combat algorithm with damage calculation, critical hits, and dodges (12+ tests)
- **PvPArena**: Orchestrates challenges, wagers, and battle execution (24+ tests)

### Key Features
- 🎨 **NFTs**: Solady-optimized ERC721 with immutable baseURI
- 💰 **Rewards**: 10 POWER tokens per NFT per day
- 🏛️ **Governance**: DAO with configurable timelock (default 2-day) and voting power
- ⚔️ **PvP Battles**: Asynchronous 1v1, 3v3, and 5v5 battles with ELO ranking and wagering
- 🔒 **Security**: Reentrancy protection and role-based access control

## 📝 Deployed Contracts

### Ethereum Mainnet
- **ProtocolGuardians NFT**: [`0xfB49118d739482048ff514b699C23E2875a91837`](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Etherscan**: [View Contract](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Sourcify**: [Verified Source](https://repo.sourcify.dev/1/0xfB49118d739482048ff514b699C23E2875a91837/)
- **Blockscout**: [View on Blockscout](https://eth.blockscout.com/address/0xfB49118d739482048ff514b699C23E2875a91837?tab=contract)
- **Routescan**: [View on Routescan](https://routescan.io/address/0xfB49118d739482048ff514b699C23E2875a91837/contract/1/code)
- **OpenSea**: [View Collection](https://opensea.io/collection/protocol-guardians)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd protocol-guardians

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run security analysis
slither .
```

### Deployment
```bash
# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js --network baseSepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network ethereum
```

### Upload to IPFS (Pinata)
Upload files to IPFS using Pinata Cloud. The script returns the IPFS hash (CID) of the uploaded file.

**Setup:**
1. Create an account at [Pinata Cloud](https://www.pinata.cloud/)
2. Generate a JWT token in your dashboard
3. Add the token to your `.env` file:
   ```
   PINATA_JWT=your_jwt_token_here
   ```

**Usage:**
```bash
# Upload a single file
node scripts/uploadToPinata.js <file-path>

# Examples
node scripts/uploadToPinata.js metadata/img/001-protocol-guardians.png
node scripts/uploadToPinata.js metadata/json/001-protocol-guardians.json
```

**Output:**
Returns the IPFS CID (Content Identifier) hash. You can access the file at:
```
https://gateway.pinata.cloud/ipfs/<CID>
```

**Supported file types:**
- Images (PNG, JPG, GIF, etc.)
- JSON files
- Any file type supported by IPFS

## 📚 Documentation

### Bilingual Documentation
- **[English Documentation](./docs/en/README.md)** - Complete English documentation
- **[Spanish Documentation](./docs/es/README.md)** - Complete Spanish documentation

### Security & Technical
- **[Security Analysis](./SECURITY.md)** - Comprehensive security analysis with Slither
- **[Contract Documentation](./docs/en/contracts.md)** - Detailed technical documentation
- **[Architecture Guide](./docs/en/architecture.md)** - System design and component interactions
- **[Deployment Guide](./docs/en/deployment.md)** - Step-by-step deployment instructions
- **[Testing Documentation](./docs/en/TESTING.md)** - Comprehensive test suite (226 passing)

### User Guides
- **[Staking Guide](./docs/en/staking-guide.md)** - How to stake NFTs and claim rewards
- **[DAO Guide](./docs/en/dao-guide.md)** - How to participate in DAO decisions
- **[Examples](./docs/en/examples.md)** - Practical code examples and use cases

### PvP System Documentation
- **[PvP System Architecture](./docs/en/pvp/ARCHITECTURE.md)** - Complete PvP system architecture
- **[PvP Contracts](./docs/en/pvp/CONTRACTS.md)** - Detailed PvP contracts documentation
- **[PvP Deployment](./docs/en/pvp/DEPLOYMENT.md)** - PvP deployment guide
- **[PvP Security](./docs/en/pvp/SECURITY.md)** - PvP security measures and considerations
- **[Game Rules](./guardians/en/pvp/GAME_RULES.md)** - Complete game rules and mechanics
- **[Battle Formulas](./guardians/en/pvp/BATTLE_FORMULAS.md)** - Detailed battle formulas reference

## 🧪 Testing

### Test Coverage
- **✅ 226 Tests Passing** (89% success rate)
- **⚔️ PvP System Tests**: BattleEngine, PlayerRegistry, PvPArena with 36+ tests
- **Unit Tests**: Individual contract testing for all core contracts
- **Integration Tests**: Cross-contract functionality validation
- **Security Tests**: Reentrancy and access control validation
- **Gas Tests**: Performance optimization verification
- **Edge Cases**: Comprehensive error handling and boundary testing

### Test Results
```
✅ ProtocolGuardians: 18 tests passing
✅ ProtocolPower: 20 tests passing  
✅ ProtocolStaking: 25 tests passing
✅ ProtocolTimelock: 15 tests passing
✅ Integration Tests: 8 tests passing
✅ BattleEngine: 12+ tests passing
✅ PlayerRegistry: 45+ tests passing
✅ PvPArena: 24+ tests passing
✅ PvP Integration: Multiple tests passing
```

**Total**: 226 passing / 28 failing (254 total tests)

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/ProtocolStaking.test.js
```

## 🔍 Security Analysis

### Automated Security Scanning
This project uses Slither for comprehensive security analysis:

```bash
# Install Slither
pip install slither-analyzer

# Run security analysis
slither .
```

### Security Measures Implemented
1. **ReentrancyGuard**: Protection against reentrancy attacks
2. **Access Control**: Role-based permissions and Ownable pattern
3. **Input Validation**: Comprehensive parameter validation
4. **Governance Security**: Timelock delays for critical operations
5. **Emergency Functions**: Withdraw mechanisms for accidental ETH
6. **Static Analysis**: Regular Slither scanning
7. **PvP Security**: Battle signature verification, formation locking, and challenge validation

## 🛠️ Development

### Available Scripts
```bash
npx hardhat help                      # List all available tasks
npx hardhat compile                   # Compile contracts
npx hardhat test                      # Run tests
npx hardhat coverage                  # Run test coverage
npx hardhat node                      # Start local blockchain
npx hardhat run scripts/deploy.js     # Deploy contracts
node scripts/uploadToPinata.js <file> # Upload file to IPFS via Pinata
```

### Project Structure
```
├── contracts/          # Smart contracts
├── test/              # Test files
├── scripts/           # Deployment scripts
├── docs/              # Documentation (EN/ES)
├── SECURITY.md        # Security analysis
└── README.md          # This file
```

## 🤝 Contributing

We welcome contributions to improve the Protocol Guardians ecosystem:

1. **Code Contributions**: Submit pull requests for bug fixes and features
2. **Documentation**: Help improve documentation in any language
3. **Testing**: Add test cases and improve coverage
4. **Security**: Report security issues responsibly

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.
