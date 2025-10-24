# Frequently Asked Questions (FAQ)

## General Questions

### What is Protocol Guardians?
Protocol Guardians is an NFT collection built on Ethereum featuring digital entities called "Guardians" that can participate in expeditions, stake for rewards, and interact with the broader crypto ecosystem. Each Guardian has unique stats, abilities, and lore based on Ethereum's blockchain technology.

### What makes Protocol Guardians different from other NFT projects?
- **Ethereum Integration**: Built specifically for Ethereum with blockchain scaling optimization
- **Dual Income System**: Both staking (passive) and expeditions (active) for earning rewards
- **Strategic Gameplay**: Complex type advantages, party composition, and ability systems
- **Rich Lore**: Crypto-native backstories with Ethereum terminology
- **OpenSea Compatible**: Full metadata standards for marketplace integration

### How many Guardians are in the collection?
The collection features a scalable design with 8 types, 7 rarities, and 8 families, allowing for thousands of unique combinations. The exact supply depends on the minting strategy and community demand.

### What is the mint price?
Mint pricing will be announced closer to the launch date. The project focuses on accessibility while maintaining value for early adopters.

## Gameplay Questions

### How do expeditions work?
Expeditions are on-chain missions where you send 1-5 Guardians to complete tasks and earn rewards. Success depends on your party's stats, type advantages, luck, and party synergy. Higher difficulty missions offer better rewards but require stronger parties.

### What are the different difficulty levels?
- **Beginner** (30 min): 5,000 stats required, 50 tokens base reward
- **Novice** (2 hours): 10,000 stats required, 150 tokens base reward
- **Adept** (6 hours): 15,000 stats required, 400 tokens base reward
- **Expert** (12 hours): 20,000 stats required, 1,000 tokens base reward
- **Master** (24 hours): 25,000 stats required, 3,000 tokens base reward

### How do I calculate expedition success rate?
Success rate = 50% (base) + stats bonus + type advantage + luck bonus + party synergy
- **Stats bonus**: Up to 45% based on how much your party exceeds requirements
- **Type advantage**: 15% if your party has type advantage over mission
- **Luck bonus**: 0.01% per total party Luck stat
- **Party synergy**: 5% if all party members are same type

### Can I stake Guardians while they're on expeditions?
No, Guardians cannot be staked while on expeditions. This creates strategic decisions about resource allocation - you must choose between passive staking income or active expedition rewards.

### What are the different types and how do they work?
There are 8 types with a circular advantage system:
- **Galactic** ⭐ > **Cosmic** 🌌 > **Celestial** ☄️ > **Mechanical** 🤖 > **Dragon** 🐉 > **Beast** 🦁 > **Elemental** 🔥 > **Chaos** 💀 > **Galactic** ⭐

Each type has unique stat distributions and strategic advantages.

### What are families and how do they differ from types?
Families are thematic groupings that provide exclusive signature abilities:
- **Guardians**: Protective abilities
- **Beasts**: Hunt and instinct abilities
- **Mechanicals**: System and efficiency abilities
- **Elementals**: Elemental mastery abilities
- **Chaos**: Unpredictable abilities
- **Dragons**: Power and treasure abilities
- **Ancients**: Wisdom and knowledge abilities
- **Void**: Nullification abilities

### How do abilities work?
Guardians have 3 abilities that provide strategic advantages in expeditions and staking. Abilities have cooldowns and can only be used by Guardians of the appropriate rarity and family. Higher rarity Guardians have access to more powerful abilities.

### What are the different rarities?
- **Common** (40% supply): 4,000-5,000 stats, 1.0x multiplier
- **Uncommon** (25% supply): 5,500-6,500 stats, 1.5x multiplier
- **Rare** (15% supply): 7,000-8,000 stats, 2.0x multiplier
- **Epic** (10% supply): 8,500-9,500 stats, 2.5x multiplier
- **Legendary** (7% supply): 10,000-11,000 stats, 3.0x multiplier
- **Mythic** (2% supply): 11,500-12,500 stats, 3.5x multiplier
- **Transcendent** (1% supply): 12,000-14,000 stats, 4.0x multiplier

### How do I form the best party for expeditions?
Consider these factors:
- **Stats**: Ensure your party meets mission requirements
- **Type advantages**: Use types that have advantage over mission type
- **Party synergy**: Same-type parties get bonus success rate
- **Abilities**: Coordinate abilities for maximum effect
- **Rarity**: Higher rarity Guardians provide better rewards

### What happens if my expedition fails?
Failed expeditions provide no rewards, but your Guardians still enter cooldown. This creates risk/reward decisions - higher difficulty missions offer better rewards but have higher failure rates.

### How long do Guardians need to rest after expeditions?
Cooldown duration equals mission duration:
- **Beginner**: 30 minutes
- **Novice**: 2 hours
- **Adept**: 6 hours
- **Expert**: 12 hours
- **Master**: 24 hours

### Can I use abilities to reduce cooldowns?
Yes, certain abilities like "TIME DILATION" and "TEMPORAL MASTERY" can reduce cooldown durations, allowing for more frequent expeditions.

## Technical Questions

### What blockchain is Protocol Guardians built on?
Protocol Guardians is built on Ethereum, providing optimized gas fees, fast transactions, and seamless integration with the broader Ethereum ecosystem.

### How do I connect my wallet?
You'll need an Ethereum compatible wallet like MetaMask, Coinbase Wallet, or WalletConnect. Make sure your wallet is configured for Ethereum (Chain ID: 1).

### What are the gas fees like?
Ethereum provides optimized gas fees, making Protocol Guardians accessible for all players regardless of transaction size.

### How do I view my Guardians on OpenSea?
Protocol Guardians is fully compatible with OpenSea. You can view your Guardians at the collection page once the contract is deployed and verified.

### What metadata standards does Protocol Guardians use?
Protocol Guardians follows OpenSea metadata standards with additional fields for gameplay mechanics:
- **Core fields**: name, description, image, external_url, background_color
- **Attributes**: stats, type, family, rarity, abilities
- **Display types**: number, boost_number, boost_percentage, date, hidden
- **Ability data**: structured data for ability effects and cooldowns

### How do I integrate Protocol Guardians into my dApp?
Use the provided code snippets in the [Metadata Documentation](METADATA.md) to parse Guardian metadata and integrate with your dApp. The metadata structure is designed for easy integration.

### Can I build tools for Protocol Guardians?
Yes! The open metadata structure and smart contract integration make it easy to build tools, analytics, and third-party applications for the ProtocolGuardians ecosystem.

## Economic Questions

### How do I earn rewards?
There are two main ways to earn ProtocolPower tokens:
1. **Staking**: Passive income based on Guardian rarity and time staked
2. **Expeditions**: Active income based on mission success and party composition

### What are the staking rewards?
Staking rewards scale with rarity and time:
- **Common**: 10 tokens/hour
- **Uncommon**: 15 tokens/hour
- **Rare**: 20 tokens/hour
- **Epic**: 25 tokens/hour
- **Legendary**: 30 tokens/hour
- **Mythic**: 35 tokens/hour
- **Transcendent**: 40 tokens/hour

### How do expedition rewards work?
Expedition rewards = base reward × rarity multiplier × difficulty scaling
- **Base rewards**: 50-3,000 tokens depending on difficulty
- **Rarity multipliers**: 1.0x-4.0x based on party average rarity
- **Difficulty scaling**: Exponential scaling (1.5x per difficulty level)

### What is the total supply of ProtocolPower tokens?
The total supply and emission schedule will be announced closer to launch. The tokenomics are designed for long-term sustainability and value appreciation.

### How do I maximize my earnings?
- **For beginners**: Focus on staking for steady income
- **For intermediate players**: Mix staking and expeditions
- **For advanced players**: Optimize expedition strategies for maximum rewards
- **For collectors**: Focus on high-rarity Guardians for best multipliers

### What happens to rewards if I don't claim them?
Rewards accumulate and can be claimed at any time. There's no penalty for delayed claiming, but you won't earn additional rewards until you claim and restake.

### Can I sell my Guardians?
Yes, Guardians are fully tradeable NFTs. You can sell them on OpenSea or other compatible marketplaces. The value depends on rarity, stats, abilities, and market demand.

### What determines a Guardian's value?
Multiple factors influence value:
- **Rarity**: Higher rarity = better stats and rewards
- **Stats**: Total stat points and distribution
- **Abilities**: Powerful abilities increase value
- **Type**: Some types may be more desirable
- **Family**: Signature abilities can add value
- **Market demand**: Community preferences and trends

## Strategy Questions

### What's the best strategy for beginners?
1. **Start with staking**: Use your first Guardians for passive income
2. **Learn the system**: Understand types, families, and abilities
3. **Build your collection**: Acquire Guardians with good stat distributions
4. **Experiment with expeditions**: Try different party compositions
5. **Join the community**: Learn from experienced players

### How do I choose which Guardians to buy?
Consider these factors:
- **Rarity**: Higher rarity = better rewards
- **Stats**: Look for good stat distributions
- **Type**: Choose types that complement your strategy
- **Family**: Consider signature abilities
- **Price**: Balance value with your budget
- **Personal preference**: Choose Guardians you like!

### What's the optimal party size for expeditions?
- **Beginner missions**: 1-2 Guardians
- **Novice missions**: 2-3 Guardians
- **Adept missions**: 3-4 Guardians
- **Expert missions**: 4-5 Guardians
- **Master missions**: 5 Guardians (maximum)

### Should I focus on one type or diversify?
Both strategies have merits:
- **Type focus**: Better synergy bonuses, specialized strategies
- **Diversification**: More versatility, type advantage coverage
- **Recommendation**: Start diversified, then specialize as you learn

### How do I balance staking vs. expeditions?
- **Risk-averse**: Focus on staking for steady income
- **Risk-tolerant**: Focus on expeditions for higher rewards
- **Balanced**: Mix both strategies based on your Guardians and preferences
- **Advanced**: Optimize based on market conditions and opportunities

### What abilities should I prioritize?
- **Universal abilities**: Work with any Guardian
- **Family signature abilities**: Exclusive to specific families
- **Rarity-gated abilities**: More powerful but require higher rarity
- **Strategy-specific abilities**: Choose based on your playstyle

## Community Questions

### How do I join the community?
- **Discord**: Join our Discord server for discussions and updates
- **Twitter**: Follow us on Twitter for announcements
- **Ethereum**: Connect with the broader Ethereum ecosystem
- **OpenSea**: Follow the collection for updates

### Are there any community events?
Yes! We plan to host:
- **Minting events**: Special opportunities to acquire Guardians
- **Tournaments**: Competitive events with prizes
- **Community challenges**: Collaborative goals and rewards
- **Educational sessions**: Learn about the game and strategies

### Can I contribute to the project?
Absolutely! We welcome:
- **Feedback**: Share your thoughts and suggestions
- **Content**: Create guides, videos, and other content
- **Development**: Contribute to tools and applications
- **Community**: Help other players and grow the ecosystem

### How do I stay updated?
- **Discord**: Real-time updates and discussions
- **Twitter**: Announcements and news
- **Website**: Official updates and documentation
- **OpenSea**: Collection updates and new releases

## Troubleshooting

### My Guardians aren't showing up in my wallet
- **Check network**: Ensure you're on the correct Ethereum network
- **Refresh wallet**: Try refreshing your wallet
- **Check contract**: Verify the contract address
- **Contact support**: Reach out if issues persist

### I can't start an expedition
- **Check cooldowns**: Ensure Guardians aren't on cooldown
- **Check staking**: Unstake Guardians before expeditions
- **Check stats**: Ensure party meets requirements
- **Check gas**: Ensure you have enough ETH for gas fees

### My rewards aren't updating
- **Check network**: Ensure you're on the correct Ethereum network
- **Refresh page**: Try refreshing the dApp
- **Check transactions**: Verify transaction success
- **Contact support**: Reach out if issues persist

### I'm having trouble connecting my wallet
- **Check wallet**: Ensure your wallet supports the Ethereum network
- **Check network**: Add the Ethereum network to your wallet
- **Clear cache**: Try clearing your browser cache
- **Try different wallet**: Test with a different wallet

### The dApp is loading slowly
- **Check internet**: Ensure stable internet connection
- **Clear cache**: Clear browser cache and cookies
- **Try different browser**: Test with a different browser
- **Check network**: Ensure the Ethereum network is working properly

## Future Questions

### What features are planned?
- **PvP System**: Direct Guardian vs Guardian combat
- **Fusion System**: Combine Guardians to create new ones
- **Guild System**: Collaborative gameplay features
- **Seasonal Events**: Limited-time content and rewards
- **Mobile App**: Native mobile application

### Will there be more Guardians?
Yes! We plan to release:
- **New types**: Additional types with unique characteristics
- **New families**: New thematic groupings and abilities
- **Seasonal collections**: Limited-time releases
- **Community creations**: Player-designed Guardians

### How will the game evolve?
- **New mechanics**: Additional gameplay systems
- **Expanded lore**: Deeper Ethereum ecosystem integration
- **Community features**: More social and collaborative elements
- **Cross-platform**: Integration with the broader Ethereum ecosystem

### What about governance?
- **DAO structure**: Community governance for major decisions
- **Voting rights**: Based on Guardian ownership and participation
- **Proposal system**: Community-driven development
- **Transparency**: Open development and decision-making

---

This FAQ covers the most common questions about Protocol Guardians. For more detailed information, check out the specific documentation sections or join our community Discord!
