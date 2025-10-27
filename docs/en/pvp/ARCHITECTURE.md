# PvP System Architecture

## Overview

The Protocol Guardians PvP system is a decentralized player-versus-player combat system built on Ethereum. It enables NFT holders to battle each other in asynchronous 1v1, 3v3, and 5v5 battles with integrated ranking, betting, and reward distribution.

## System Components

### Core Contracts

1. **PlayerRegistry.sol**: Manages player profiles, formations, and matchmaking
2. **BattleEngine.sol**: Implements the turn-based combat algorithm
3. **PvPArena.sol**: Orchestrates challenges, wagers, and battle execution
4. **IProtocolGuardians.sol**: Interface to interact with the main NFT contract

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  (Metadata Parsing, Signature Generation, UI)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                            │
│  (Stats Signing Service)                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PvPArena.sol                              │
│  - Challenge Creation/Acceptance                             │
│  - Wager Management                                          │
│  - Signature Verification                                    │
│  - ELO/XP Updates                                            │
│  - Reward Distribution                                       │
└─────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│PlayerRegistry│    │BattleEngine  │    │ProtocolGuard.│
│              │    │              │    │   NFT        │
│-Profiles     │    │-Combat Logic │    │              │
│-Formations   │    │-Damage Calc  │    │-Owner Check  │
│-ELO/XP       │    │-Turn Order   │    │-Transfer     │
│-Matchmaking  │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow

### 1. Player Registration Flow

```
User → PlayerRegistry.registerPlayer()
     → Store: username, avatar, ELO=1000, XP=0, level=1
     → Event: PlayerRegistered
```

### 2. Formation Setup Flow

```
User → PlayerRegistry.setFormation(battleType, tokenIds)
     → Validate: ownership, formation size (1/3/5)
     → Store: formation mapping
     → Event: FormationSet
```

### 3. Challenge Flow (Ranking)

```
Challenger → PvPArena.createRankingChallenge(
                   opponent, battleType, signedStats)
             → Pay challenge fee (0.001 ETH)
             → Validate: both registered, formations exist
             → Store: Challenge struct
             → Event: RankingChallengeCreated
             
Opponent   → PvPArena.acceptChallenge(challengeId)
             → Execute battle (if valid)
             → Update ELO/XP
             → Event: BattleCompleted
```

### 4. Challenge Flow (Wager)

```
Challenger → PvPArena.createWagerChallenge(
                   opponent, battleType, token, amount, stats)
             → Pay challenge fee + wager
             → Validate: formations, stats valid
             → Store: Challenge with wager info
             → Event: WagerChallengeCreated
             
Opponent   → PvPArena.acceptChallenge(challengeId, stats)
             → Pay matching wager
             → Execute battle
             → Winner gets: (wager * 2 * 0.97)
             → Protocol gets: (wager * 2 * 0.03)
```

### 5. Battle Execution Flow

```
PvPArena.acceptChallenge()
    → Verify stats signatures (both players)
    → Validate NFT ownership
    → BattleEngine.executeBattle(team1Stats, team2Stats)
        → Sort cards by Speed
        → Loop turns (max 50):
            → For each card: calculate dodge, critical, damage
            → Apply type advantage/penalty
            → Reduce HP
            → Check win condition
        → Return: winner, turns, remaining HP
    → Update PlayerRegistry (ELO/XP if ranking)
    → Distribute rewards (if wager)
    → Event: BattleExecuted
```

## Design Decisions

### Decentralization

- All game logic on-chain for transparency
- No server-side manipulation possible
- Player data stored on-chain

### Gas Optimization

- Separate BattleEngine contract for combat logic
- Stats passed as parameters (not fetched)
- Events used for efficient state tracking
- Packed storage for small uints

### Security

- ECDSA signature verification for stats authenticity
- ReentrancyGuard on payment functions
- Owner checks on critical functions
- Formation validation before battle

### Scalability

- Asynchronous challenges (no simultaneous play required)
- Stat signatures expire after 1 hour
- Modular contract design (independent deployment)
- Efficient storage patterns

## Contract Interactions

### PvPArena → PlayerRegistry

- `registerPlayer()`: Check registration
- `getPlayerProfile()`: Get ELO/XP for updates
- `updateEloXp()`: Adjust player ranking
- `validateFormation()`: Check formation validity

### PvPArena → BattleEngine

- `executeBattle()`: Run combat simulation
- Returns `BattleResult` with winner info

### PvPArena → ProtocolGuardians NFT

- `ownerOf(tokenId)`: Validate ownership
- Called at challenge creation and acceptance

## Gas Considerations

### Typical Gas Costs (estimated)

- Player Registration: ~120k gas
- Set Formation: ~60k gas (per formation)
- Create Challenge: ~150k gas
- Accept Challenge (1v1): ~300k gas
- Accept Challenge (3v3): ~500k gas
- Accept Challenge (5v5): ~800k gas

### Optimization Techniques

1. **Storage**: Use `uint256` arrays instead of structs where possible
2. **Events**: Use indexed fields for efficient filtering
3. **Computation**: Move heavy calculations to BattleEngine
4. **Packaging**: Batch operations when possible

## Integration with Frontend

### Required Actions

1. **Metadata Parsing**: Fetch NFT metadata from IPFS
2. **Stats Extraction**: Parse stats from metadata
3. **Signature Generation**: Send stats to backend for signing
4. **Contract Interaction**: Call PvPArena functions with signed stats
5. **Event Listening**: Listen to BattleCompleted events

### Backend Requirements

- Signer service with private key
- Stats validation before signing
- Rate limiting per address
- Signature expiration (1 hour)

## Testing Architecture

### Test Structure

```
test/pvp/
├── BattleEngine.test.js      (combat logic)
├── PlayerRegistry.test.js    (profiles, formations)
├── PvPArena.test.js          (challenges, rewards)
└── Integration.test.js       (complete flows)
```

### Mock Contracts

- `MockProtocolGuardians.sol`: NFT contract for testing
- `MockERC20.sol`: Token contract for wager testing

## Future Enhancements

### Potential Improvements

1. **Tournament System**: Multi-round competitions
2. **Guild Battles**: Team vs team combat
3. **Seasonal Rewards**: Periodic ELO resets with prizes
4. **NFT Upgrades**: Stat enhancement system
5. **Replay System**: Store and playback battles

## Deployment Considerations

### Contract Deployment Order

1. **PlayerRegistry**: No dependencies
2. **BattleEngine**: No dependencies
3. **PvPArena**: Requires PlayerRegistry and BattleEngine addresses

### Configuration

- `challengeFee`: 0.001 ETH (configurable by owner)
- `protocolFeePercent`: 3% (configurable by owner)
- `signerAddress`: Backend signer (updatable by owner)
- `INITIAL_ELO`: 1000
- `XP_PER_LEVEL`: 100

### Access Control

- All contracts use `Ownable` from OpenZeppelin
- Owner can update fees, pause functionality
- Only owner can withdraw accumulated protocol fees
