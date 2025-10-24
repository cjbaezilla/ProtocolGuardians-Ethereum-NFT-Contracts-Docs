# Expedition System Documentation

## Overview

Expeditions are on-chain missions where Guardians earn rewards based on their stats, abilities, and strategic party composition. The system features 5 difficulty levels, complex success rate calculations, and exponential reward scaling.

## Expedition Flow

```mermaid
flowchart TD
    A[Select Party] --> B[Choose Mission]
    B --> C[Calculate Success Rate]
    C --> D[Execute Mission]
    D --> E[Calculate Rewards]
    E --> F[Apply Cooldowns]
    F --> G[Update Stats]
    
    C --> H[Base Success: 50%]
    C --> I[Stats Bonus: min(45%, (party_stats - required) / required * 100)]
    C --> J[Type Advantage: +15% if advantageous]
    C --> K[Luck Bonus: sum(party_luck) * 0.01%]
    C --> L[Party Synergy: (same_type / total) * 5%]
    
    H --> M[Final Success = min(95%, Base + Stats + Type + Luck + Synergy)]
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N{Success?}
    N -->|Yes| O[Calculate Rewards]
    N -->|No| P[No Rewards]
    
    O --> Q[Base Reward * Rarity Multiplier * Difficulty Scaling]
    Q --> R[Apply Bonuses]
    R --> S[Distribute Rewards]
    
    P --> T[Apply Cooldowns]
    S --> T
    T --> U[Update Guardian States]
```

## Difficulty Levels

### 1. Beginner (30 minutes)
- **Required Stats**: 5,000
- **Base Reward**: 50 tokens
- **Success Rate**: 60-80%
- **Cooldown**: 30 minutes
- **Recommended Party**: 1-2 Common/Uncommon Guardians

### 2. Novice (2 hours)
- **Required Stats**: 10,000
- **Base Reward**: 150 tokens
- **Success Rate**: 50-70%
- **Cooldown**: 2 hours
- **Recommended Party**: 2-3 Uncommon/Rare Guardians

### 3. Adept (6 hours)
- **Required Stats**: 15,000
- **Base Reward**: 400 tokens
- **Success Rate**: 40-60%
- **Cooldown**: 6 hours
- **Recommended Party**: 3-4 Rare/Epic Guardians

### 4. Expert (12 hours)
- **Required Stats**: 20,000
- **Base Reward**: 1,000 tokens
- **Success Rate**: 30-50%
- **Cooldown**: 12 hours
- **Recommended Party**: 4-5 Epic/Legendary Guardians

### 5. Master (24 hours)
- **Required Stats**: 25,000
- **Base Reward**: 3,000 tokens
- **Success Rate**: 20-40%
- **Cooldown**: 24 hours
- **Recommended Party**: 5 Legendary/Mythic Guardians

## Success Rate Calculation

### Base Formula
```javascript
function calculateSuccessRate(party, mission) {
  const baseSuccess = 50;
  const statsBonus = Math.min(45, (party.totalStats - mission.requiredStats) / mission.requiredStats * 100);
  const typeAdvantage = hasTypeAdvantage(party, mission) ? 15 : 0;
  const luckBonus = party.totalLuck * 0.01;
  const partySynergy = (party.sameTypeGuardians / party.totalGuardians) * 5;
  
  return Math.min(95, baseSuccess + statsBonus + typeAdvantage + luckBonus + partySynergy);
}
```

### Component Breakdown

#### 1. Base Success (50%)
Every expedition starts with a 50% base success rate, ensuring some chance of success even with minimal stats.

#### 2. Stats Bonus (0-45%)
```javascript
const statsBonus = Math.min(45, (party.totalStats - mission.requiredStats) / mission.requiredStats * 100);
```
- **0% bonus**: Party stats exactly match requirements
- **45% bonus**: Party stats are 45% above requirements (capped)
- **Linear scaling**: Each 1% above requirements = 1% bonus

#### 3. Type Advantage (0-15%)
```javascript
const typeAdvantage = hasTypeAdvantage(party, mission) ? 15 : 0;
```
- **15% bonus**: If party contains type with advantage over mission type
- **0% bonus**: If no type advantage present
- **Type wheel**: Galactic > Cosmic > Celestial > Mechanical > Dragon > Beast > Elemental > Chaos > Galactic

#### 4. Luck Bonus (0-5%)
```javascript
const luckBonus = party.totalLuck * 0.01;
```
- **0.01% per Luck point**: Each Luck stat point adds 0.01% success rate
- **Maximum 5%**: Capped at 500 total party Luck
- **Linear scaling**: Direct correlation between Luck and success

#### 5. Party Synergy (0-5%)
```javascript
const partySynergy = (party.sameTypeGuardians / party.totalGuardians) * 5;
```
- **5% bonus**: If all party members are same type
- **Linear scaling**: Each 20% same type = 1% bonus
- **Encourages**: Type-focused party composition

### Final Success Rate
```javascript
const finalSuccess = Math.min(95, baseSuccess + statsBonus + typeAdvantage + luckBonus + partySynergy);
```
- **Maximum 95%**: No expedition is guaranteed to succeed
- **Minimum 50%**: Base success rate ensures some chance
- **Capped bonuses**: Prevents overwhelming advantages

## Reward Calculation

### Base Formula
```javascript
function calculateRewards(party, mission) {
  const baseReward = mission.baseReward;
  const rarityMultiplier = party.averageRarityMultiplier;
  const difficultyScaling = baseReward * Math.pow(1.5, mission.difficultyLevel);
  
  return baseReward * rarityMultiplier * difficultyScaling;
}
```

### Component Breakdown

#### 1. Base Reward
Each difficulty level has a base reward amount:
- **Beginner**: 50 tokens
- **Novice**: 150 tokens
- **Adept**: 400 tokens
- **Expert**: 1,000 tokens
- **Master**: 3,000 tokens

#### 2. Rarity Multiplier
```javascript
const rarityMultiplier = party.averageRarityMultiplier;
```
- **Common**: 1.0x
- **Uncommon**: 1.5x
- **Rare**: 2.0x
- **Epic**: 2.5x
- **Legendary**: 3.0x
- **Mythic**: 3.5x
- **Transcendent**: 4.0x

#### 3. Difficulty Scaling
```javascript
const difficultyScaling = baseReward * Math.pow(1.5, mission.difficultyLevel);
```
- **Exponential scaling**: Each difficulty level multiplies rewards by 1.5x
- **Beginner**: 1.0x (no scaling)
- **Novice**: 1.5x
- **Adept**: 2.25x
- **Expert**: 3.375x
- **Master**: 5.0625x

### Reward Examples

#### Example 1: Beginner Mission
```javascript
// Party: 2x Common, 1x Uncommon
const party = {
  averageRarityMultiplier: (1.0 + 1.0 + 1.5) / 3 // 1.17x
};
const mission = {
  baseReward: 50,
  difficultyLevel: 1
};

const baseReward = 50;
const rarityMultiplier = 1.17;
const difficultyScaling = 50 * Math.pow(1.5, 1); // 75

const finalReward = 50 * 1.17 * 1.5; // 87.75 tokens
```

#### Example 2: Expert Mission
```javascript
// Party: 3x Legendary, 2x Epic
const party = {
  averageRarityMultiplier: (3.0 + 3.0 + 3.0 + 2.5 + 2.5) / 5 // 2.8x
};
const mission = {
  baseReward: 1000,
  difficultyLevel: 4
};

const baseReward = 1000;
const rarityMultiplier = 2.8;
const difficultyScaling = 1000 * Math.pow(1.5, 4); // 5,062.5

const finalReward = 1000 * 2.8 * 5.0625; // 14,175 tokens
```

## Party Composition Strategies

### 1. Balanced Approach
**Composition**: 1 of each type
**Advantages**: Type coverage, versatility
**Disadvantages**: No type synergy bonuses
**Best For**: Beginners, learning the system

### 2. Type Synergy Approach
**Composition**: 3-4 of same type + 1-2 others
**Advantages**: Type synergy bonuses, focused strategy
**Disadvantages**: Vulnerable to type disadvantages
**Best For**: Experienced players, specific strategies

### 3. Counter-Strategy Approach
**Composition**: Types chosen to counter specific mission types
**Advantages**: Maximum type advantage
**Disadvantages**: Limited versatility
**Best For**: Advanced players, mission-specific optimization

### 4. Rarity Focus Approach
**Composition**: Highest rarity Guardians available
**Advantages**: Maximum stat bonuses, best abilities
**Disadvantages**: High cost, limited availability
**Best For**: Players with high-value collections

## Recommended Party Compositions

### By Difficulty Level

#### Beginner Missions
- **Party Size**: 1-2 Guardians
- **Recommended**: 1x Common + 1x Uncommon
- **Strategy**: Basic stats, learning mechanics
- **Success Rate**: 60-80%

#### Novice Missions
- **Party Size**: 2-3 Guardians
- **Recommended**: 2x Uncommon + 1x Rare
- **Strategy**: Balanced stats, type coverage
- **Success Rate**: 50-70%

#### Adept Missions
- **Party Size**: 3-4 Guardians
- **Recommended**: 2x Rare + 2x Epic
- **Strategy**: Type synergy, ability combinations
- **Success Rate**: 40-60%

#### Expert Missions
- **Party Size**: 4-5 Guardians
- **Recommended**: 3x Epic + 2x Legendary
- **Strategy**: High stats, strategic abilities
- **Success Rate**: 30-50%

#### Master Missions
- **Party Size**: 5 Guardians
- **Recommended**: 3x Legendary + 2x Mythic
- **Strategy**: Maximum stats, ultimate abilities
- **Success Rate**: 20-40%

### By Mission Type

#### Speed-Critical Missions
- **Recommended**: 3x Galactic + 2x Cosmic
- **Reasoning**: High Speed + Mana for quick completion
- **Abilities**: Speed buffs, duration reduction

#### Power-Focus Missions
- **Recommended**: 2x Dragon + 2x Beast + 1x Elemental
- **Reasoning**: Maximum Power output
- **Abilities**: Power buffs, damage amplification

#### Balanced Missions
- **Recommended**: 1x each type
- **Reasoning**: Type advantage coverage
- **Abilities**: Versatile ability coverage

#### Defensive Missions
- **Recommended**: 3x Mechanical + 2x Celestial
- **Reasoning**: High Defense + Mana
- **Abilities**: Defense buffs, damage mitigation

#### Luck-Based Missions
- **Recommended**: 2x Chaos + 2x Cosmic + 1x Galactic
- **Reasoning**: Maximum Luck + Mana
- **Abilities**: Luck buffs, probability manipulation

## Cooldown System

### Cooldown Duration
```javascript
const cooldownDuration = mission.duration;
```
- **1:1 ratio**: Cooldown equals mission duration
- **Beginner**: 30 minutes cooldown
- **Novice**: 2 hours cooldown
- **Adept**: 6 hours cooldown
- **Expert**: 12 hours cooldown
- **Master**: 24 hours cooldown

### Cooldown Management
```javascript
function canStartExpedition(guardian) {
  const lastExpedition = guardian.lastExpeditionTime;
  const cooldownDuration = guardian.cooldownDuration;
  const currentTime = Date.now() / 1000;
  
  return (currentTime - lastExpedition) >= cooldownDuration;
}
```

### Cooldown Reduction
Certain abilities can reduce cooldown duration:
- **TIME DILATION**: Reduces all cooldowns by 50% for 8 hours
- **TEMPORAL MASTERY**: Reduces all cooldowns by 75% for 12 hours
- **TIME MASTERY**: Reduces expedition durations by 50% for 12 hours

## Mission Types

### 1. Speed Missions
**Focus**: Speed and Mana stats
**Type Advantage**: Galactic > Cosmic
**Recommended**: High Speed/Mana Guardians
**Abilities**: Speed buffs, duration reduction

### 2. Power Missions
**Focus**: Power and HP stats
**Type Advantage**: Dragon > Beast
**Recommended**: High Power/HP Guardians
**Abilities**: Power buffs, damage amplification

### 3. Defense Missions
**Focus**: Defense and Stamina stats
**Type Advantage**: Mechanical > Dragon
**Recommended**: High Defense/Stamina Guardians
**Abilities**: Defense buffs, damage mitigation

### 4. Magic Missions
**Focus**: Mana and Critical stats
**Type Advantage**: Elemental > Chaos
**Recommended**: High Mana/Critical Guardians
**Abilities**: Mana buffs, critical amplification

### 5. Luck Missions
**Focus**: Luck and Critical stats
**Type Advantage**: Chaos > Galactic
**Recommended**: High Luck/Critical Guardians
**Abilities**: Luck buffs, probability manipulation

## Implementation Examples

### Example 1: Success Rate Calculation
```javascript
// Party: 3x Legendary Galactic, 2x Epic Cosmic
// Mission: Expert (20,000 stats required)

const party = {
  totalStats: 25000,
  totalLuck: 500,
  sameTypeGuardians: 3,
  totalGuardians: 5,
  hasTypeAdvantage: true
};

const mission = {
  requiredStats: 20000,
  difficultyLevel: 4
};

// Calculation:
const baseSuccess = 50;
const statsBonus = Math.min(45, (25000 - 20000) / 20000 * 100); // 25%
const typeAdvantage = 15; // Galactic > Cosmic
const luckBonus = 500 * 0.01; // 5%
const partySynergy = (3 / 5) * 5; // 3%

const finalSuccess = Math.min(95, 50 + 25 + 15 + 5 + 3); // 98% -> 95% (capped)
```

### Example 2: Reward Calculation
```javascript
// Same party and mission
const baseReward = 1000; // Expert base reward
const rarityMultiplier = (3 * 3.0 + 2 * 2.5) / 5; // 2.8x average
const difficultyScaling = 1000 * Math.pow(1.5, 4); // 5,062.5

const finalReward = 1000 * 2.8 * 5.0625; // 14,175 tokens
```

### Example 3: Party Optimization
```javascript
// Mission: Dragon-type, requires high Power and HP
// Recommended party: 2x Dragon + 2x Beast + 1x Elemental

const recommendedParty = [
  { type: 'Dragon', stats: { power: 3000, hp: 2500 } },
  { type: 'Dragon', stats: { power: 2800, hp: 2400 } },
  { type: 'Beast', stats: { power: 2000, speed: 2500 } },
  { type: 'Beast', stats: { power: 1900, speed: 2300 } },
  { type: 'Elemental', stats: { power: 1800, mana: 2000 } }
];

// This party provides:
// - High Power (Dragon advantage)
// - Type advantage (Beast > Dragon)
// - Balanced stats for mission requirements
// - Synergy bonuses for same types
```

## Balance Considerations

### Success Rate Balance
- **Base 50%**: Ensures some chance of success
- **Maximum 95%**: Prevents guaranteed success
- **Linear scaling**: Predictable stat bonuses
- **Type advantages**: Meaningful but not overwhelming

### Reward Balance
- **Exponential scaling**: Higher difficulty = significantly better rewards
- **Rarity multipliers**: Higher rarity = better rewards
- **Difficulty scaling**: Encourages challenging missions
- **Cost vs. benefit**: Balanced risk/reward ratio

### Strategic Depth
- **Party composition matters**: Different strategies for different missions
- **Type advantages**: Meaningful choices for party selection
- **Cooldown management**: Strategic timing considerations
- **Ability combinations**: Complex interactions between abilities

## Future Considerations

### Planned Features
- **Mission Variants**: Different mission types within each difficulty
- **Seasonal Events**: Limited-time missions with special rewards
- **Guild Missions**: Collaborative missions for multiple players
- **Dynamic Difficulty**: Missions that adapt to party strength

### Balance Updates
- **Success rates**: May be adjusted based on gameplay data
- **Reward scaling**: Fine-tuning based on economic data
- **Cooldown durations**: Optimization based on player behavior
- **New mission types**: Addition of new mission categories

---

The expedition system provides deep strategic gameplay with meaningful choices for party composition, mission selection, and ability usage. The complex success rate calculation and reward scaling create a balanced risk/reward system that encourages both strategic thinking and long-term progression.
