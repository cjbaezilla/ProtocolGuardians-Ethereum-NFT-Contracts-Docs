# PvP System Contracts Documentation

## Overview

This document provides detailed technical documentation for all smart contracts in the Protocol Guardians PvP system.

## Table of Contents

1. [PlayerRegistry.sol](#playerregistrysol)
2. [BattleEngine.sol](#battleenginesol)
3. [PvPArena.sol](#pvparenasol)
4. [IProtocolGuardians.sol](#iprotocolguardianssol)
5. [Mock Contracts](#mock-contracts)

---

## PlayerRegistry.sol

**Purpose**: Manages player profiles, formations, ELO rankings, and XP progression.

### Key Features

- Player registration and profile management
- Formation configuration (1v1, 3v3, 5v5)
- ELO ranking system
- XP and level progression
- Matchmaking pool

### State Variables

```solidity
address public protocolGuardians;     // NFT contract address
uint256 public constant INITIAL_ELO;  // Starting ELO (1000)
uint256 public constant XP_PER_LEVEL; // XP needed per level (100)
uint256 public constant ELO_MIN;      // Minimum ELO (0)
uint256 private nextPlayerId;         // Auto-incrementing player ID

struct Player {
    uint256 id;                       // Unique player ID
    string username;                  // Display name (max 32 chars)
    string avatarUrl;                 // Avatar URL (max 500 chars)
    uint256 elo;                      // ELO rating
    uint256 xp;                       // Experience points
    uint256 wins;                     // Total wins
    uint256 losses;                   // Total losses
    uint256 level;                    // Player level
    bool isRegistered;                // Registration status
}

mapping(address => Player) public players;                          // Player data
mapping(address => mapping(uint8 => uint256[])) public formations;  // [player][type][tokenIds]
mapping(address => uint8) public matchmakingPool;                   // Available for challenges
```

### Main Functions

#### `registerPlayer(string memory username, string memory avatarUrl)`

Registers a new player in the system.

**Parameters:**
- `username`: Display name (1-32 characters, alphanumeric + spaces/hyphens)
- `avatarUrl`: Avatar image URL (0-500 characters)

**Requirements:**
- Not already registered
- Username not empty and not too long
- Avatar URL not too long

**Effects:**
- Creates new Player with ELO=1000, XP=0, Level=1
- Emits `PlayerRegistered` event

#### `updateProfile(string memory avatarUrl)`

Updates player avatar URL.

**Parameters:**
- `avatarUrl`: New avatar URL

#### `setFormation(uint8 battleType, uint256[] memory tokenIds)`

Sets a formation for a specific battle type.

**Parameters:**
- `battleType`: 1, 3, or 5 (number of cards)
- `tokenIds`: Array of NFT token IDs

**Requirements:**
- Formation size matches battle type
- Player owns all NFTs
- NFTs not in staking
- Formation not in use by pending challenge

**Validations:**
- Checks NFT ownership via `ownerOf()`
- Validates formation size (1, 3, or 5)
- Checks NFTs not staked (via external contract)

#### `updateEloXp(address winner, address loser, bool isRanking, int256 eloChange, uint256 winnerXp, uint256 loserXp)`

Updates player ELO and XP after a battle.

**Parameters:**
- `winner`: Winning player address
- `loser`: Losing player address
- `isRanking`: Whether this is a ranking battle
- `eloChange`: ELO difference (positive for winner)
- `winnerXp`: XP to award to winner
- `loserXp`: XP to award to loser

**Effects:**
- Updates winner/loser ELO
- Awards XP to both players
- Updates win/loss counters
- Increments level if XP threshold reached

#### `getMatchmakingPool(uint256 minElo, uint256 maxElo, uint8 battleType)`

Returns available opponents in ELO range.

**Parameters:**
- `minElo`: Minimum ELO to match
- `maxElo`: Maximum ELO to match
- `battleType`: Battle type to match (1, 3, or 5)

**Returns:**
- Array of eligible player addresses (max 10)

### Events

```solidity
event PlayerRegistered(address indexed player, uint256 playerId, string username);
event ProfileUpdated(address indexed player, string avatarUrl);
event FormationSet(address indexed player, uint8 battleType, uint256[] tokenIds);
event EloXpUpdated(address indexed player, uint256 newElo, uint256 newXp, uint256 level);
event JoinedMatchmaking(address indexed player, uint8 battleType);
event LeftMatchmaking(address indexed player);
```

---

## BattleEngine.sol

**Purpose**: Implements the core turn-based combat algorithm.

### Key Features

- Damage calculation with defense
- Type advantages/disadvantages
- Critical hit system
- Dodge/evasion based on Luck
- Turn order by Speed
- Turn limit (50 turns)

### Configuration Constants

```solidity
uint256 public constant MAX_TURNS = 50;
uint256 public constant TYPE_ADVANTAGE_BONUS = 15;        // 15% bonus
uint256 public constant TYPE_DISADVANTAGE_PENALTY = 15;   // 15% penalty
uint256 public constant CRITICAL_MULTIPLIER = 2;          // 2x damage
uint256 public constant MIN_DAMAGE = 1;                   // Minimum damage
```

### Type System

There are 10 card types in the game:
- 0: Galactic (beats 1, 2; weak to 3, 4)
- 1: Cosmic (beats 3, 4; weak to 5, 6)
- 2: Void (beats 5, 6; weak to 7, 8)
- ... (continues pattern)

### CardStats Struct

```solidity
struct CardStats {
    uint256 power;     // Attack power
    uint256 defense;   // Damage reduction
    uint256 speed;     // Turn order (higher = faster)
    uint256 hp;        // Health points
    uint256 mana;      // Not used in PvP
    uint256 stamina;   // Not used in PvP
    uint256 critical;  // Critical hit chance (per 100)
    uint256 luck;      // Dodge chance (per 100)
    uint256 cardType;  // Card type (0-9)
}
```

### Main Functions

#### `simulateBattle(CardStats[] memory team1, CardStats[] memory team2, uint256 randomSeed)`

Simulates a battle and returns the result without state changes.

**Returns:**
```solidity
struct BattleResult {
    uint8 winner;              // 0 = team1, 1 = team2
    uint256 turnsPlayed;       // Number of turns
    uint256 team1RemainingHP;  // Team1 total HP remaining
    uint256 team2RemainingHP;  // Team2 total HP remaining
}
```

#### `executeBattle(CardStats[] memory team1, CardStats[] memory team2, uint256 randomSeed)`

Executes a battle and emits events.

**Effects:**
- Sorts cards by Speed
- Executes turn-based combat
- Returns BattleResult

### Combat Algorithm

#### Turn Order
1. All cards sorted by Speed (fastest first)
2. Cards attack in order each turn

#### Attack Resolution (per card per turn)

1. **Dodge Check**: If `random(0, 1000) < defender.luck`, attack misses
2. **Critical Check**: If `random(0, 1000) < attacker.critical`, damage is 2x
3. **Damage Calculation**: 
   ```
   baseDamage = attacker.power
   defenseReduction = defender.defense / 2
   damage = max(baseDamage - defenseReduction, 1)
   ```
4. **Type Advantage**: Apply +15% if type advantage, -15% if disadvantage
5. **Apply Damage**: `defender.hp -= finalDamage`

#### Win Conditions

- Team loses when all cards have HP ≤ 0
- If 50 turns reached, winner is team with more total HP

---

## PvPArena.sol

**Purpose**: Orchestrates challenges, wagers, and battle execution.

### State Variables

```solidity
address public playerRegistryAddress;  // PlayerRegistry contract
address public battleEngineAddress;    // BattleEngine contract
address public signerAddress;          // Backend signer address
uint256 public challengeFee;           // Fee to create challenge (0.001 ETH)
uint256 public protocolFeePercent;     // Protocol fee % (3%)

enum ChallengeStatus { Pending, Accepted, Completed, Cancelled }
enum ChallengeType { Ranking, Wager }

struct Challenge {
    uint256 id;
    address challenger;
    address opponent;
    uint8 battleType;          // 1, 3, or 5
    ChallengeType challengeType;
    ChallengeStatus status;
    address wagerToken;        // ERC20 or zero address for ETH
    uint256 wagerAmount;
    uint256 creationTime;
}

mapping(uint256 => Challenge) public challenges;
uint256 private nextChallengeId;
```

### Main Functions

#### `createRankingChallenge(address opponent, uint8 battleType, SignedStats[] memory challengerStats)`

Creates a ranking challenge (affects ELO).

**Parameters:**
- `opponent`: Opponent address
- `battleType`: 1, 3, or 5
- `challengerStats`: Signed stats for challenger's cards

**Requirements:**
- Pays challenge fee (0.001 ETH)
- Both players registered
- Formations exist
- Stats signatures valid

#### `createWagerChallenge(address opponent, uint8 battleType, address wagerToken, uint256 wagerAmount, SignedStats[] memory challengerStats)`

Creates a challenge with a wager.

**Parameters:**
- `opponent`: Opponent address
- `battleType`: 1, 3, or 5
- `wagerToken`: ERC20 token address (or zero for ETH)
- `wagerAmount`: Wager amount
- `challengerStats`: Signed stats

**Requirements:**
- Pays challenge fee + wager
- Valid stats signatures
- Same token and amount must be paid by opponent

#### `acceptChallenge(uint256 challengeId, SignedStats[] memory opponentStats)`

Accepts a pending challenge and executes the battle.

**Parameters:**
- `challengeId`: Challenge ID
- `opponentStats`: Signed stats for accepting player

**Process:**
1. Validate challenge status
2. If wager challenge, collect wager payment
3. Verify stats signatures
4. Execute battle via BattleEngine
5. Update ELO/XP (if ranking)
6. Distribute winnings (if wager)
7. Update challenge status

**Distribution (Wager):**
- Winner receives: `wagerAmount * 2 * 97%`
- Protocol receives: `wagerAmount * 2 * 3%`

#### `cancelChallenge(uint256 challengeId)`

Cancels a pending challenge.

**Requirements:**
- Only challenger can cancel
- If wager challenge: 5% penalty goes to protocol

**Effects:**
- Refund remaining wager (95% if wager challenge)
- Set challenge status to Cancelled

### Signature Verification

#### `_verifyStatsSignature(SignedStats memory signedStats)`

Verifies ECDSA signature of stats.

**Process:**
1. Creates message: `keccak256(tokenId, stats[8], expiration)`
2. Creates signed message hash
3. Recovers signer from signature
4. Verifies signer matches `signerAddress`
5. Checks expiration

### Events

```solidity
event RankingChallengeCreated(uint256 indexed challengeId, address indexed challenger, address indexed opponent, uint8 battleType);
event WagerChallengeCreated(uint256 indexed challengeId, address indexed challenger, address indexed opponent, uint256 wagerAmount);
event ChallengeAccepted(uint256 indexed challengeId, address indexed opponent);
event BattleExecuted(uint256 indexed challengeId, address indexed winner, uint256 turns, int256 eloChange);
event ChallengeCancelled(uint256 indexed challengeId, address indexed canceller);
```

---

## IProtocolGuardians.sol

**Purpose**: Interface to interact with the ProtocolGuardians NFT contract.

### Functions

```solidity
function ownerOf(uint256 tokenId) external view returns (address);
```

Returns the owner of a specific token ID.

**Used by:**
- PlayerRegistry for formation validation
- PvPArena for ownership checks at challenge execution

---

## Mock Contracts

### MockProtocolGuardians.sol

Mock NFT contract for testing.

**Features:**
- Mint NFTs to any address
- Transfer NFTs
- `ownerOf()` query

### MockERC20.sol

Mock ERC20 token for testing wagers.

**Features:**
- Mint tokens
- Standard ERC20 transfers
- No transfer fees

---

## Security Considerations

### Access Control

- All admin functions protected by `Ownable`
- Only contract owner can modify fees
- Only owner can withdraw protocol fees

### Reentrancy Protection

- All payment functions use `ReentrancyGuard`
- State updates before external calls

### Signature Security

- ECDSA signatures prevent stat manipulation
- Expiration prevents replay attacks
- Signer address is updatable by owner

### Input Validation

- Formation sizes validated
- Stats array lengths checked
- Address zero checks
- Balance sufficient checks

---

## Gas Optimization

### Techniques Used

1. **Storage Packing**: Player struct optimized
2. **External Functions**: Reduced contract size
3. **Events Instead of Storage**: Efficient data logging
4. **View Functions**: Battle simulation without gas
5. **Lazy Evaluation**: Checks performed only when needed

### Estimated Gas Costs

| Operation | Estimated Gas |
|-----------|---------------|
| Register Player | ~120k |
| Set Formation (1v1) | ~60k |
| Set Formation (3v3) | ~120k |
| Set Formation (5v5) | ~180k |
| Create Challenge (Ranking) | ~150k |
| Create Challenge (Wager) | ~200k |
| Accept Challenge (1v1) | ~300k |
| Accept Challenge (3v3) | ~500k |
| Accept Challenge (5v5) | ~800k |
| Cancel Challenge | ~50k |
