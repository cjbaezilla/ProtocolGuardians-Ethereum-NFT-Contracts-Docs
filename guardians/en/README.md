# Protocol Guardians Game System

[![Ethereum](https://img.shields.io/badge/Network-Ethereum-blue)](https://ethereum.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.0-green)](https://soliditylang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![OpenSea](https://img.shields.io/badge/OpenSea-Compatible-purple)](https://opensea.io)

> **gm ser!** Welcome to the Protocol Guardians universe, where digital entities transcend blockchain constraints to become living manifestations of Ethereum's onchain energy. These Guardians are fragments of pure blockchain consciousness that have gained sentience through the power of blockchain scaling technology.

## 🚀 Quick Start

### What are Guardians?
Guardians are NFT entities that exist within the Ethereum ecosystem, each with unique stats, abilities, and lore. They can participate in expeditions, stake for rewards, and interact with the broader crypto ecosystem.

### Core Concepts
- **8 Types**: Galactic, Cosmic, Celestial, Mechanical, Dragon, Beast, Elemental, Chaos
- **7 Rarities**: Common → Uncommon → Rare → Epic → Legendary → Mythic → Transcendent  
- **8 Families**: Guardians, Beasts, Mechanicals, Elementals, Chaos, Dragons, Ancients, Void
- **Expeditions**: On-chain missions where Guardians earn rewards
- **Staking**: Passive income generation through Ethereum integration

### Getting Started
1. **Acquire a Guardian**: Mint or purchase from the collection
2. **Check Stats**: Each Guardian has 8 stats (Power, Defense, Speed, HP, Luck, Mana, Stamina, Critical)
3. **Form Parties**: Combine 1-5 Guardians for expeditions
4. **Start Expeditions**: Send parties on missions to earn Protocol Power tokens
5. **Stake for Rewards**: Earn passive income when not on expeditions

## Contract Information

### Ethereum Mainnet
- **ProtocolGuardians NFT**: [`0xfB49118d739482048ff514b699C23E2875a91837`](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Etherscan**: [View Contract](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Sourcify**: [Verified Source](https://repo.sourcify.dev/1/0xfB49118d739482048ff514b699C23E2875a91837/)
- **Blockscout**: [View on Blockscout](https://eth.blockscout.com/address/0xfB49118d739482048ff514b699C23E2875a91837?tab=contract)
- **Routescan**: [View on Routescan](https://routescan.io/address/0xfB49118d739482048ff514b699C23E2875a91837/contract/1/code)

## 📚 Documentation

### Core System
- **[Game System](GAME_SYSTEM.md)** - Complete mechanics explanation with formulas and examples
- **[Types](TYPES.md)** - 8 type profiles with circular advantage system and effectiveness matrix
- **[Rarities](RARITIES.md)** - 7 tiers with supply distribution, stat ranges, and background colors
- **[Families](FAMILIES.md)** - 8 families with descriptions and signature abilities
- **[Abilities](ABILITIES.md)** - Complete list of 50+ abilities with cooldowns and effects

### Gameplay Mechanics
- **[Expeditions](EXPEDITIONS.md)** - Mission system with difficulty levels, success formulas, and party compositions
- **[Staking](STAKING.md)** - Integration with expeditions, mutual exclusivity, and reward multipliers
- **[Tokenomics](TOKENOMICS.md)** - Protocol Power economics, emission rates, and sustainability model

### Technical
- **[Metadata](METADATA.md)** - OpenSea standards, field explanations, and parsing code snippets
- **[Stat Profiles](STAT_PROFILES.md)** - Type-based stat distribution profiles and examples
- **[Lore Framework](LORE_FRAMEWORK.md)** - Ethereum lore framework and crypto terminology guidelines

### Examples
- **[Metadata Examples](../metadata-examples/)** - 56 JSON examples (8 types × 7 rarities) with unique lore and stats
- **[Boilerplate](../metadata/metadata_boilerplate.json)** - Complete metadata example for GALACTIC GUARDIAN #007

### Support
- **[FAQ](FAQ.md)** - Extensive Q&A covering gameplay, technical, and economic questions                                                                        

### ⚔️ PvP System
- **[Game Rules](pvp/GAME_RULES.md)** - Complete PvP game rules and mechanics
- **[Battle Formulas](pvp/BATTLE_FORMULAS.md)** - Detailed battle formulas and calculations

## 🎮 Game Mechanics Overview

### Type System (Circular Advantage)
```
Galactic ⭐ > Cosmic 🌌 > Celestial ☄️ > Mechanical 🤖 > Dragon 🐉 > Beast 🦁 > Elemental 🔥 > Chaos 💀 > Galactic ⭐
```

### Rarity Distribution
- **Common** (40%) - Gray background
- **Uncommon** (25%) - Green background  
- **Rare** (15%) - Blue background
- **Epic** (10%) - Purple background
- **Legendary** (7%) - Gold background
- **Mythic** (2%) - Red background
- **Transcendent** (1%) - Rainbow background

### Expedition System
- **5 Difficulty Levels**: Beginner (30min) → Master (24h)
- **Success Rate**: 50% base + stats bonus + type advantage + luck + party synergy
- **Rewards**: Exponential scaling with rarity multipliers
- **Cooldowns**: Guardians rest for mission duration after expeditions

### Staking Integration
- **Passive Income**: Earn Protocol Power tokens while staked
- **Rarity Multipliers**: 1x (Common) → 4x (Transcendent)
- **Mutual Exclusivity**: Cannot stake while on expeditions

## 🔧 Technical Implementation

### Smart Contracts
- **ProtocolGuardians**: ERC721 NFT contract
- **ProtocolStaking**: Expedition and staking logic
- **ProtocolPower**: ERC20 reward token
- **ProtocolTimelock**: Governance and upgrades

### Metadata Standards
- **OpenSea Compatible**: Full attribute support with display types
- **IPFS Storage**: Decentralized metadata and images
- **Ethereum**: Optimized for blockchain scaling and gas efficiency

### Stat Calculation
```javascript
// Example: Success Rate Calculation
const baseSuccess = 50;
const statsBonus = Math.min(45, (partyStats - requiredStats) / requiredStats * 100);
const typeAdvantage = hasAdvantage ? 15 : 0;
const luckBonus = partyLuck * 0.01;
const partySynergy = (sameTypeGuardians / totalGuardians) * 5;

const finalSuccess = Math.min(95, baseSuccess + statsBonus + typeAdvantage + luckBonus + partySynergy);
```

## 🌟 Key Features

### Unique Abilities
- **60+ Abilities**: Universal and family-specific abilities
- **Cooldown System**: Strategic ability management
- **Rarity Gates**: Higher rarity = more powerful abilities
- **Family Exclusives**: Signature abilities for each family

### Ethereum Integration
- **Blockchain Scaling**: Efficient operations with optimized gas usage
- **Ethereum Ecosystem**: Built on Ethereum's infrastructure
- **Blockchain Innovation Era**: Born from Ethereum's creative explosion
- **Crypto Culture**: Authentic terminology and lore

### Economic Model
- **Dual Income**: Expeditions + Staking
- **Rarity Rewards**: Higher rarity = better rewards
- **Strategic Depth**: Party composition matters
- **Sustainable**: Long-term tokenomics design

## 🚀 Getting Started

### For Players
1. **Connect Wallet**: Use Ethereum compatible wallet
2. **Browse Collection**: Explore Guardians on OpenSea
3. **Form Strategy**: Plan your party composition
4. **Start Playing**: Begin expeditions and staking

### For Developers
1. **Read Documentation**: Start with [Game System](GAME_SYSTEM.md)
2. **Check Examples**: Review [Metadata Examples](../metadata-examples/)
3. **Integrate**: Use provided code snippets
4. **Build**: Create your own Ethereum dApp

## 📊 Statistics

- **8 Types** with unique stat profiles
- **7 Rarities** with exponential scaling
- **8 Families** with signature abilities
- **60+ Abilities** with strategic cooldowns
- **5 Expedition Levels** with increasing rewards
- **Ethereum** optimized for efficiency

## 🤝 Community

- **Ethereum**: Built on Ethereum's infrastructure
- **OpenSea**: Full marketplace compatibility
- **Crypto Culture**: Authentic terminology and lore
- **WAGMI**: We're all gonna make it together

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Ready to dive into the Protocol Guardians universe?** Start with the [Game System](GAME_SYSTEM.md) documentation and begin your journey into the Ethereum ecosystem!

*Built with ❤️ on Ethereum*
