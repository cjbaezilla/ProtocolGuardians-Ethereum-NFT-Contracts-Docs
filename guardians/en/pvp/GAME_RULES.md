# Protocol Guardians PvP Game Rules

## Overview

Welcome to Protocol Guardians PvP! This guide explains the rules, mechanics, and strategies for competitive PvP battles.

## Battle Modes

### 1v1 Battles
- Single card vs single card
- Fast-paced combat
- Quick decision making

### 3v3 Battles  
- Team of 3 cards
- Strategic formation planning
- Longer battles

### 5v5 Battles
- Full team combat
- Maximum strategic depth
- Most rewarding battles

## Registration

### Creating Your Account

1. Connect your wallet with ProtocolGuardians NFTs
2. Register with a unique username (1-32 characters)
3. Set an avatar image URL (optional)
4. Start with 1000 ELO rating

### Profile Customization

- Update avatar URL anytime
- Username is permanent (chosen once)
- Profile is linked to your wallet address

## Formations

### Setting Up Your Teams

**Maximum Formations**: 3 saved formations (one per battle type)

**How to Set Formation**:
1. Select battle type (1v1, 3v3, or 5v5)
2. Choose NFTs from your collection
3. Confirm ownership of all selected NFTs
4. Formation is saved and locked when used in challenges

**Formation Rules**:
- NFTs must be owned by you
- Cannot use staked NFTs
- Formation locked while challenge is pending
- Can modify formation when not in use

**Restrictions**:
- Cannot change formation if it's part of a pending challenge
- Must own all NFTs in formation
- NFTs must not be staked

## Challenges

### Creating Challenges

**Ranking Challenges**:
- Affects your ELO rating
- Costs 0.001 ETH challenge fee
- Must specify opponent and battle type
- Requires signed stats for your cards

**Wager Challenges**:
- Includes betting with tokens or ETH
- Costs 0.001 ETH challenge fee + wager amount
- Opponent must match wager exactly
- Does not affect ELO
- Winner takes 97% of total pool (3% protocol fee)

### Accepting Challenges

**Process**:
1. Receive challenge notification
2. Review opponent's proposed terms
3. For wager challenges, check token and amount
4. Provide signed stats for your cards
5. Accept or decline

**Acceptance Requirements**:
- Formations configured for battle type
- For wager challenges: Sufficient balance for wager
- Valid signed stats for all your cards

### Challenge States

**Pending**: Challenge created, waiting for acceptance
**Accepted**: Challenge accepted, battle ready to execute  
**Completed**: Battle finished, rewards distributed
**Cancelled**: Challenger cancelled, possible penalties apply

### Cancelling Challenges

**Who Can Cancel**: Only the challenger

**Penalties**:
- Ranking challenge: No penalty (free cancellation)
- Wager challenge: 5% of wager forfeited to protocol
- No ELO or XP loss for cancellation

**Refunds**:
- Ranking: Full challenge fee refunded
- Wager: 95% of wager refunded

## Combat System

### Turn Order

Cards attack in order of **Speed** stat:
- Higher Speed = Attacks first
- Same Speed = Random order
- Teams alternate turns until one is defeated

### Damage Calculation

**Base Formula**:
```
damage = attacker.power - (defender.defense / 2)
minimum_damage = 1
```

**Type Advantages**:
- Type advantage: +15% damage bonus
- Type disadvantage: -15% damage penalty
- No advantage: Normal damage

**Critical Hits**:
- Chance = critical_stat / 1000 (base 1000 system)
- Example: 250 critical = 25% critical chance (250/1000 = 0.25)
- Critical hits do 2x damage
- Random value ranges from 0-1000, compared directly against critical stat

**Dodge/Evasion**:
- Chance = luck_stat / 1000 (base 1000 system)
- Example: 150 luck = 15% dodge chance (150/1000 = 0.15)
- Successful dodge = 0 damage taken
- Random value ranges from 0-1000, compared directly against luck stat

### Win Conditions

**Victory**:
- All opponent cards have HP ≤ 0
- Must eliminate entire enemy team

**Turn Limit**:
- Maximum 50 turns per battle
- After 50 turns, team with most total HP wins
- No ties (winner always determined)

### Card Types

Protocol Guardians features 8 distinct types with a circular advantage system:

**Type Wheel** (each type beats one type and is weak to another):
- **Galactic ⭐** beats **Cosmic 🌌** (weak to **Chaos 💀**)
- **Cosmic 🌌** beats **Celestial ☄️** (weak to **Galactic ⭐**)
- **Celestial ☄️** beats **Mechanical 🤖** (weak to **Cosmic 🌌**)
- **Mechanical 🤖** beats **Dragon 🐉** (weak to **Celestial ☄️**)
- **Dragon 🐉** beats **Beast 🦁** (weak to **Mechanical 🤖**)
- **Beast 🦁** beats **Elemental 🔥** (weak to **Dragon 🐉**)
- **Elemental 🔥** beats **Chaos 💀** (weak to **Beast 🦁**)
- **Chaos 💀** beats **Galactic ⭐** (weak to **Elemental 🔥**)

**Type Effectiveness:**
- Type advantage: +15% damage bonus
- Type disadvantage: -15% damage penalty
- No advantage/disadvantage: Normal damage (100%)

## ELO Ranking System

### Initial Rating

- Starting ELO: **1000**
- Minimum ELO: **0**
- No maximum limit

### ELO Changes

**Winning Against Higher ELO**: +30 to +40 points
**Winning Against Similar ELO**: +20 to +30 points  
**Winning Against Lower ELO**: +10 to +20 points

**Losing Against Higher ELO**: -10 to -20 points
**Losing Against Similar ELO**: -20 to -30 points
**Losing Against Lower ELO**: -30 to -40 points

### ELO Calculation

Formula adjusts based on ELO difference:
- Large skill gap = smaller point changes
- Close matchups = larger point changes
- Prevents easy farming of low-ELO players

### Ranking Features

- Separate ELO for ranked battles only
- Wager battles don't affect ELO
- Public leaderboards based on ELO
- ELO used for matchmaking

## XP and Levels

### XP Gain

**After Each Battle**:
- Winner: **+50 XP**
- Loser: **+20 XP**
- Applies to both ranking and wager battles

### Level Progression

**Level Formula**: Level = (XP / 100) + 1

**Examples**:
- Level 1: 0-99 XP
- Level 2: 100-199 XP  
- Level 3: 200-299 XP
- Level 10: 900-999 XP

**Level Benefits**:
- Levels don't grant direct combat bonuses
- Used for display and matchmaking
- Indicates overall battle experience
- Pure prestige system

## Matchmaking

### How It Works

**Automatic Matching**:
- Players with configured formations are automatically available
- Search for opponents in ELO range (±100 points)
- Returns up to 10 eligible opponents
- Can challenge anyone in your ELO range

**ELO Range**:
- Can search ±100 ELO from your current rating
- Prevents overwhelming mismatches
- Encourages competitive battles

**Matchmaking Pool**:
- Join matchmaking to be discoverable
- Leave matchmaking to be hidden
- Can be in matchmaking for multiple battle types

## Wager System

### Supported Tokens

**Native ETH**:
- Zero address (0x0)
- Most common wager type
- Direct value transfer

**ERC20 Tokens**:
- Any ERC20 token without transfer fees
- Both players must use same token
- Must approve contract for amount
- Winnings sent immediately

### Wager Rules

**Betting Requirements**:
- Both players bet the same amount
- Both players use the same token type
- Challenger sets amount, opponent must match exactly
- Cannot partially accept challenges

**Winnings Distribution**:
- Winner receives: `(wager * 2) * 97%`
- Protocol receives: `(wager * 2) * 3%`
- Distributed immediately after battle
- No delay or vesting

**Wager Distribution Examples:**

**Example 1: ETH Wager**
- Challenger Wager: 0.1 ETH
- Opponent Wager: 0.1 ETH
- Total Pool: 0.2 ETH
- Winner Receives: 0.2 ETH * 0.97 = 0.194 ETH
- Protocol Receives: 0.2 ETH * 0.03 = 0.006 ETH

**Example 2: ERC20 Token Wager (POWER tokens)**
- Challenger Wager: 1000 POWER tokens
- Opponent Wager: 1000 POWER tokens
- Total Pool: 2000 POWER tokens
- Winner Receives: 2000 * 0.97 = 1940 POWER tokens
- Protocol Receives: 2000 * 0.03 = 60 POWER tokens

**Example 3: High-Value Wager**
- Challenger Wager: 1.0 ETH
- Opponent Wager: 1.0 ETH
- Total Pool: 2.0 ETH
- Winner Receives: 2.0 ETH * 0.97 = 1.94 ETH
- Protocol Receives: 2.0 ETH * 0.03 = 0.06 ETH

**Cancellation**:
- Challenger can cancel with 5% penalty
- Penalty goes to protocol
- Opponent loses nothing
- Other party can wait indefinitely

## Gameplay Tips

### Formation Strategy

1. **Balance Your Team**: Mix high damage, high defense, and high speed
2. **Type Coverage**: Include different card types to counter various opponents
3. **Speed Matters**: Faster cards attack first and more often
4. **HP is King**: Survive longer to deal more damage

### Offensive Tips

- High Power + Low Defense = Glass cannon (high risk, high reward)
- Balance Power and Defense for consistency
- Critical chance adds burst damage
- Speed determines who strikes first

### Defensive Tips

- High Defense reduces incoming damage
- Luck gives you chances to completely dodge
- HP is your resource to manage
- High Defense + High HP = Tank builds

### Strategic Tips

1. Know your opponent's ELO before accepting
2. Check their win/loss ratio if available
3. For wagers: Only bet what you can afford to lose
4. Practice with ranking battles before large wagers
5. Monitor gas prices when accepting challenges

## Fees and Costs

### Challenge Creation Fee

- Fixed: **0.001 ETH per challenge**
- Paid by challenger
- Non-refundable unless challenge expires
- Goes to protocol treasury

### Protocol Fees

**Wager Fee**: **3% of total pool**
- Deducted from winnings
- Only applies to wager battles
- Used for protocol development and maintenance

### Gas Costs

**Typical Gas Usage**:
- Create Challenge: ~150k gas
- Accept Challenge (1v1): ~300k gas
- Accept Challenge (3v3): ~500k gas
- Accept Challenge (5v5): ~800k gas

**Note**: Gas costs vary with network congestion. Check current prices before battles.

## Restrictions

### What You Cannot Do

❌ Use staked NFTs in formations
❌ Challenge with formations you don't own
❌ Accept challenges without configured formations
❌ Modify formations while they're in pending challenges
❌ Cancel someone else's challenge
❌ Use ERC20 tokens with transfer fees for wagers

### What Happens If...

**You Sell an NFT**: Formation becomes invalid, cannot accept new challenges
**You Stake All Formations**: Cannot create or accept challenges
**Stats Change**: Stats are immutable from NFT metadata, cannot be altered
**Gas Runs Out**: Transaction fails, no penalties applied

## Fair Play

### Anti-Cheating Measures

- Stats verified via cryptographic signatures
- NFT ownership checked on-chain
- Battle results calculated deterministically
- All battles are transparent and auditable

### Prohibited Activities

- Using third-party exploits
- Manipulating stats (statistically impossible due to signatures)
- Collusion between players for guaranteed outcomes
- Automated bot challenges (against terms of service)

### Reporting Issues

If you encounter:
- Suspected cheating
- Contract bugs or unexpected behavior
- Unfair challenges or disputes
- Technical issues

**Contact**: support@protocolguardians.com

## Glossary

**ELO**: Rating system for player skill matching
**Formation**: Saved team configuration for battles
**Challenge**: Invitation to battle from one player to another
**Wager**: Betting system with token rewards
**Stats**: Card characteristics (Power, Defense, Speed, HP, etc.)
**Type Advantage**: Elemental-like advantage system
**Critical Hit**: Random chance for 2x damage
**Dodge**: Random chance to avoid all damage
**Turn**: Single action cycle in combat
**Gas**: Ethereum transaction fee
