# Arquitectura del Sistema ProtocolGuardians

## Visión General

ProtocolGuardians es un ecosistema de contratos inteligentes construido en Ethereum que permite el staking de NFTs con recompensas y gobernanza DAO. El sistema está diseñado para ser seguro, eficiente y descentralizado.

## Diagrama de Arquitectura

```mermaid
graph TB
    subgraph "Usuarios"
        U1[Usuario 1]
        U2[Usuario 2]
        U3[Usuario 3]
    end
    
    subgraph "Contratos Principales"
        NFT[ProtocolGuardians NFT]
        REWARD[ProtocolPower Token]
        STAKE[ProtocolStaking]
        TIMELOCK[ProtocolTimelock]
    end
    
    subgraph "Gobernanza"
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

## Componentes del Sistema

### 1. ProtocolGuardians NFT (ERC721)

**Propósito**: Colección de NFTs con metadatos inmutables

**Características**:
- Implementación con Solady para optimización de gas
- URI base inmutable (IPFS)
- Supply ilimitado
- Transferencias estándar ERC721

**Flujo de Datos**:
```mermaid
sequenceDiagram
    participant U as Usuario
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

**Propósito**: Token de recompensas con capacidades de gobernanza

**Características**:
- Implementación ERC20 estándar
- Extensiones de gobernanza (Votes, Permit)
- Minting on-demand
- Ownership por Timelock

**Estructura de Gobernanza**:
```mermaid
graph LR
    subgraph "Gobernanza"
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

**Propósito**: Contrato de staking con custody y distribución de recompensas

**Características**:
- Custody staking (NFTs transferidos al contrato)
- Cálculo preciso de recompensas
- Protección contra reentrancy
- Tracking de múltiples NFTs por usuario

**Flujo de Staking**:
```mermaid
sequenceDiagram
    participant U as Usuario
    participant N as ProtocolGuardians
    participant S as ProtocolStaking
    participant R as ProtocolPower
    
    U->>N: setApprovalForAll(S)
    U->>S: stake([tokenIds])
    N->>S: transferFrom(U, S, tokenId)
    S->>S: Record staking info
    
    loop Cada bloque
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

**Propósito**: Controlador de timelock para gobernanza DAO

**Características**:
- Delay configurable para ejecución (por defecto 2 días)
- Roles de proposer, executor y admin
- Cancelación de propuestas
- Ejecución segura de operaciones

**Flujo de Gobernanza**:
```mermaid
sequenceDiagram
    participant P as Proposer
    participant T as Timelock
    participant E as Executor
    participant R as ProtocolPower
    
    P->>T: schedule(operation)
    T->>T: Record operation
    T->>T: Wait 2 days
    
    E->>T: execute(operation)
    T->>R: Execute operation
    R->>R: Apply changes
```

## Cálculo de Recompensas

### Fórmula de Recompensas

```
Recompensas = Bloques_Stakeados × REWARD_RATE_PER_BLOCK
```

Donde:
- `REWARD_RATE_PER_BLOCK = 1388888888888888` (0.001388888888888888 tokens por bloque)
- `Bloques_Stakeados = Bloque_Actual - Bloque_Último_Claim`

### Ejemplo de Cálculo

```mermaid
graph TD
    A[NFT Staked] --> B[Block 1000]
    B --> C[Current Block 2000]
    C --> D[Blocks Staked: 1000]
    D --> E[Rewards: 1000 × 0.001388888888888888]
    E --> F[Rewards: 1.388888888888888 tokens]
```

## Seguridad

### Medidas de Seguridad Implementadas

1. **ReentrancyGuard**: Protección contra ataques de reentrancy
2. **Validación de Parámetros**: Verificación de todas las entradas
3. **Roles y Permisos**: Control de acceso granular
4. **Timelock**: Delay para operaciones críticas
5. **Safe Transfers**: Uso de SafeERC20 para transfers

### Diagrama de Seguridad

```mermaid
graph TB
    subgraph "Capas de Seguridad"
        RG[ReentrancyGuard]
        VP[Validación de Parámetros]
        RP[Roles y Permisos]
        TL[Timelock]
        ST[Safe Transfers]
    end
    
    RG --> VP
    VP --> RP
    RP --> TL
    TL --> ST
```

## Optimizaciones de Gas

### Estrategias Implementadas

1. **Solady**: Contratos optimizados para gas
2. **Batch Operations**: Operaciones en lote
3. **Storage Optimization**: Optimización de almacenamiento
4. **Event Optimization**: Eventos eficientes

### Comparación de Gas

| Operación | Gas Cost | Optimización |
|-----------|----------|--------------|
| Mint NFT | ~150k | Solady ERC721 |
| Stake NFT | ~200k | Batch operations |
| Claim Rewards | ~100k | Efficient calculation |
| Unstake NFT | ~180k | Batch operations |

## Escalabilidad

### Consideraciones de Escalabilidad

1. **Batch Operations**: Hasta 30 NFTs por transacción
2. **Gas Limits**: Operaciones optimizadas para límites de gas
3. **Storage Efficiency**: Mínimo uso de storage
4. **Event Optimization**: Eventos compactos

### Diagrama de Escalabilidad

```mermaid
graph LR
    subgraph "Escalabilidad"
        B[Batch Operations]
        G[Gas Optimization]
        S[Storage Efficiency]
        E[Event Optimization]
    end
    
    B --> G
    G --> S
    S --> E
```

## Monitoreo y Analytics

### Métricas Importantes

1. **Total Staked**: Número total de NFTs en staking
2. **Reward Rate**: Tasa de recompensas por bloque
3. **User Activity**: Actividad de usuarios
4. **Gas Usage**: Uso de gas por operación

### Dashboard de Monitoreo

```mermaid
graph TB
    subgraph "Métricas"
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

## Limitaciones del Sistema

### Limitaciones de Diseño
1. **Supply Ilimitado**: Protocol Guardians no tiene límite de supply
2. **Mint Público**: Cualquiera puede mintear NFTs
3. **Sin Pausa**: Staking no puede ser pausado
4. **Inmutabilidad**: Parámetros de recompensas son fijos

### Límites Técnicos
1. **Batch Operations**: Máximo 30 NFTs por transacción
2. **Gas Limits**: Operaciones en batch limitadas por gas
3. **Block-based Rewards**: Recompensas calculadas por bloque de Ethereum

## Próximos Pasos

1. **Auditoría de Seguridad**: Auditoría completa de contratos
2. **Optimizaciones**: Mejoras adicionales de gas
3. **Integraciones**: Integración con más plataformas
4. **Analytics**: Sistema de analytics avanzado

## Conclusión

La arquitectura de Protocol Guardians está diseñada para ser segura, eficiente y escalable. El sistema utiliza las mejores prácticas de desarrollo de contratos inteligentes y está optimizado para el ecosistema Ethereum.

Para más detalles técnicos, consulta la [Documentación de Contratos](./contratos.md).
