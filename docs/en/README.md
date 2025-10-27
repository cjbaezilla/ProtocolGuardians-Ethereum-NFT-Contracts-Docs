# Protocol Guardians - English Documentation

## Index

### 📚 Technical Documentation
- [System Architecture](./architecture.md) - Complete architecture with Mermaid diagrams
- [Contract Documentation](./contracts.md) - Detailed documentation of each contract
- [Deployment Guide](./deployment.md) - Step-by-step deployment guide
- [Testing Documentation](./TESTING.md) - Comprehensive test suite documentation (226 passing)

### 👥 User Guides
- [Staking Guide](./staking-guide.md) - How to stake NFTs
- [DAO Governance Guide](./dao-guide.md) - Complete governance guide with Timelock
- [Usage Examples](./examples.md) - Code examples and use cases

### ⚔️ PvP System
- [PvP Architecture](./pvp/ARCHITECTURE.md) - Complete PvP system architecture
- [PvP Contracts](./pvp/CONTRACTS.md) - PvP contracts documentation
- [PvP Deployment](./pvp/DEPLOYMENT.md) - PvP deployment guide
- [PvP Security](./pvp/SECURITY.md) - PvP security analysis

## Overview

Protocol Guardians is a complete ERC721 NFT system with staking capabilities and DAO governance built on Ethereum. The project includes:

- **ProtocolGuardians NFT**: NFT collection with immutable URI
- **ProtocolPower Token**: ERC20 token with governance capabilities
- **ProtocolStaking**: Custody staking contract
- **ProtocolTimelock**: Configurable timelock controller (default 2-day) for DAO governance

## Deployed Contracts

### Ethereum Mainnet
- **ProtocolGuardians NFT**: [`0xfB49118d739482048ff514b699C23E2875a91837`](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Etherscan**: [View Contract](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Sourcify**: [Verified Source](https://repo.sourcify.dev/1/0xfB49118d739482048ff514b699C23E2875a91837/)
- **Blockscout**: [View on Blockscout](https://eth.blockscout.com/address/0xfB49118d739482048ff514b699C23E2875a91837?tab=contract)
- **Routescan**: [View on Routescan](https://routescan.io/address/0xfB49118d739482048ff514b699C23E2875a91837/contract/1/code)
- **OpenSea**: [View Collection](https://opensea.io/collection/protocol-guardians)

## Key Features

### 🎨 NFTs (ProtocolGuardians)
- Solady implementation for gas optimization
- Immutable base URI (IPFS)
- Unlimited supply
- Standard ERC721 transfers

### 💰 Reward System
- 10 POWER tokens per NFT per day
- Ethereum block-based calculation
- On-demand minting
- Accumulative rewards

### 🏛️ DAO Governance
- Configurable timelock (default 2-day)
- Voting with POWER tokens
- Proposals and execution
- Tally integration

### 🔒 Secure Staking
- Custody staking (NFTs transferred to contract)
- Reentrancy protection
- Precise reward tracking
- Automatic rewards on unstaking

## Usage Flow

1. **Mint NFTs**: Create NFTs from the collection
2. **Stake NFTs**: Deposit NFTs in the staking contract
3. **Accumulate Rewards**: Rewards accumulate automatically
4. **Claim Rewards**: Withdraw accumulated POWER tokens
5. **Governance**: Participate in DAO decisions with POWER tokens

## Technologies Used

- **Solidity ^0.8.28**
- **Solady**: For gas optimization
- **OpenZeppelin**: For governance contracts
- **Hardhat**: For development and testing
- **Ethers.js**: For contract interaction

## Testing

### Test Coverage ✅
- **✅ 226 Tests Passing** (89% success rate)
- **⚔️ PvP System Tests**: BattleEngine, PlayerRegistry, PvPArena comprehensive coverage
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
✅ PvP Integration: Multiple integration tests passing
```

**Total**: 226 passing / 28 failing (254 total tests)

## Security

- Contract auditing recommended
- **✅ 226 Tests Passing** with comprehensive coverage
- Reentrancy protection
- Parameter validation
- Well-defined roles and permissions

## Next Steps

1. Review the [System Architecture](./architecture.md)
2. Consult the [Deployment Guide](./deployment.md)
3. Explore [Usage Examples](./examples.md)
4. Set up governance with [DAO Guide](./dao-guide.md)
