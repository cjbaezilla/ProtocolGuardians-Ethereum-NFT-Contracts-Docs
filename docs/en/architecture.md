# Protocol Guardians System Architecture

## Overview

Protocol Guardians is an ecosystem of smart contracts built on Ethereum that enables NFT staking with rewards and DAO governance. The system is designed to be secure, efficient, and decentralized.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Users"
        U1[User 1]
        U2[User 2]
        U3[User 3]
    end
    
    subgraph "Main Contracts"
        NFT[ProtocolGuardians NFT]
        REWARD[ProtocolPower Token]
        STAKE[ProtocolStaking]
        TIMELOCK[ProtocolTimelock]
    end
    
    subgraph "Governance"
        PROPOSER[Proposers]
        EXECUTOR[Executors]
        ADMIN[Admin]
    end
    
    U1 --> NFT
    U2 --> NFT
    U3 --> NFT
    
    NFT --> STAKE
    STAKE --> REWARD
    
    TIMELOCK --> REWARD
    PROPOSER --> TIMELOCK
    EXECUTOR --> TIMELOCK
    ADMIN --> TIMELOCK
    
    STAKE --> U1
    STAKE --> U2
    STAKE --> U3
```

## System Components

### 1. ProtocolGuardians NFT (ERC721)

**Purpose**: NFT collection with immutable metadata

**Features**:
- Solady implementation for gas optimization
- Immutable base URI (IPFS)
- Unlimited supply
- Standard ERC721 transfers

**Data Flow**:
```mermaid
sequenceDiagram
    participant U as User
    participant N as ProtocolGuardians
    participant S as Staking
    
    U->>N: mint()
    N->>U: NFT minted
    U->>N: setApprovalForAll(S)
    U->>S: stake([tokenIds])
    N->>S: transferFrom(U, S, tokenId)
    S->>U: NFTs staked
```

### 2. ProtocolPower Token (ERC20)

**Purpose**: Reward token with governance capabilities

**Features**:
- Standard ERC20 implementation
- Governance extensions (Votes, Permit)
- On-demand minting
- Timelock ownership

**Governance Structure**:
```mermaid
graph LR
    subgraph "Governance"
        V[Voting Power]
        D[Delegation]
        P[Proposals]
        E[Execution]
    end
    
    REWARD --> V
    V --> D
    D --> P
    P --> E
    E --> REWARD
```

### 3. ProtocolStaking

**Purpose**: Custody staking contract with reward distribution

**Features**:
- Custody staking (NFTs transferred to contract)
- Precise reward calculation
- Reentrancy protection
- Multiple NFT tracking per user

**Staking Flow**:
```mermaid
sequenceDiagram
    participant U as User
    participant N as ProtocolGuardians
    participant S as ProtocolStaking
    participant R as ProtocolPower
    
    U->>N: setApprovalForAll(S)
    U->>S: stake([tokenIds])
    N->>S: transferFrom(U, S, tokenId)
    S->>S: Record staking info
    
    loop Each block
        S->>S: Calculate pending rewards
    end
    
    U->>S: claimRewards([tokenIds])
    S->>R: mint(U, amount)
    R->>U: Transfer tokens
    
    U->>S: unstake([tokenIds])
    S->>R: mint(U, finalRewards)
    S->>N: transferFrom(S, U, tokenId)
    N->>U: Return NFT
```

### 4. ProtocolTimelock

**Purpose**: Timelock controller for DAO governance

**Features**:
- 2-day delay for execution
- Proposer, executor, and admin roles
- Proposal cancellation
- Secure operation execution

**Governance Flow**:
```mermaid
sequenceDiagram
    participant P as Proposer
    participant T as Timelock
    participant E as Executor
    participant R as ProtocolPower
    
    P->>T: schedule(operation)
    T->>T: Record operation
    T->>T: Wait configured delay
    
    E->>T: execute(operation)
    T->>R: Execute operation
    R->>R: Apply changes
```

## Reward Calculation

### Reward Formula

```
Rewards = Blocks_Staked × REWARD_RATE_PER_BLOCK
```

Where:
- `REWARD_RATE_PER_BLOCK = 1388888888888888` (0.001388888888888888 tokens per block)
- `Blocks_Staked = Current_Block - Last_Claim_Block`

### Calculation Example

```mermaid
graph TD
    A[NFT Staked] --> B[Block 1000]
    B --> C[Current Block 2000]
    C --> D[Blocks Staked: 1000]
    D --> E[Rewards: 1000 × 0.001388888888888888]
    E --> F[Rewards: 1.388888888888888 tokens]
```

## Security

### Implemented Security Measures

1. **ReentrancyGuard**: In ProtocolStaking
2. **Role-based Access**: In all contracts
3. **Parameter Validation**: In all functions
4. **Safe Transfers**: Using SafeERC20
5. **Timelock Delay**: Configurable delay for critical operations

### Security Diagram

```mermaid
graph TB
    subgraph "Security Layers"
        RG[ReentrancyGuard]
        VP[Parameter Validation]
        RP[Roles and Permissions]
        TL[Timelock]
        ST[Safe Transfers]
    end
    
    RG --> VP
    VP --> RP
    RP --> TL
    TL --> ST
```

## Gas Optimization

### Implemented Strategies

1. **Solady**: Gas-optimized contracts
2. **Batch Operations**: Batch operations
3. **Storage Optimization**: Storage optimization
4. **Event Optimization**: Efficient events

### Gas Cost Comparison

| Operation | Gas Cost | Optimization |
|-----------|----------|--------------|
| Mint NFT | ~150k | Solady ERC721 |
| Stake NFT | ~200k | Batch operations |
| Claim Rewards | ~100k | Efficient calculation |
| Unstake NFT | ~180k | Batch operations |

## Scalability

### Scalability Considerations

1. **Batch Operations**: Up to 50 NFTs per transaction
2. **Gas Limits**: Operations optimized for gas limits
3. **Storage Efficiency**: Minimal storage usage
4. **Event Optimization**: Compact events

### Scalability Diagram

```mermaid
graph LR
    subgraph "Scalability"
        B[Batch Operations]
        G[Gas Optimization]
        S[Storage Efficiency]
        E[Event Optimization]
    end
    
    B --> G
    G --> S
    S --> E
```

## Monitoring and Analytics

### Important Metrics

1. **Total Staked**: Total number of NFTs in staking
2. **Reward Rate**: Reward rate per block
3. **User Activity**: User activity
4. **Gas Usage**: Gas usage per operation

### Monitoring Dashboard

```mermaid
graph TB
    subgraph "Metrics"
        TS[Total Staked]
        RR[Reward Rate]
        UA[User Activity]
        GU[Gas Usage]
    end
    
    TS --> D[Dashboard]
    RR --> D
    UA --> D
    GU --> D
```

## Next Steps

1. **Security Audit**: Complete contract audit
2. **Optimizations**: Additional gas optimizations
3. **Integrations**: Integration with more platforms
4. **Analytics**: Advanced analytics system

## Conclusion

The Protocol Guardians architecture is designed to be secure, efficient, and scalable. The system uses best practices for smart contract development and is optimized for the Ethereum ecosystem.

For more technical details, consult the [Contract Documentation](./contracts.md).
