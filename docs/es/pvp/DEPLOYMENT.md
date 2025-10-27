# Guía de Deployment - Sistema PvP Protocol Guardians

## Visión General

Esta guía proporciona instrucciones paso a paso para desplegar el sistema PvP de Protocol Guardians en Ethereum o redes de prueba.

## Prerrequisitos

### Software Requerido

- Node.js >= 16.0.0
- npm o yarn
- Git
- Hardhat >= 2.0
- Billetera con ETH para gas fees

### Configuración del Entorno

```bash
# Clone el repositorio
git clone <repository-url>
cd cartas_eth_hardhat

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
```

### Variables de Entorno

Configura las siguientes variables en tu `.env`:

```env
# Dirección del contrato NFT ProtocolGuardians (ya desplegado)
PROTOCOL_GUARDIANS_ADDRESS=0x...

# Red a desplegar (mainnet, sepolia, hardhat, etc.)
NETWORK=sepolia

# RPC URL para la red elegida
RPC_URL=https://...

# Private key para deployment (¡MANTENER SEGURA!)
PRIVATE_KEY=...

# Address del signer para stats de backend
SIGNER_ADDRESS=0x...

# Configuración de fees
CHALLENGE_FEE_ETH=0.001
PROTOCOL_FEE_PERCENT=3

# Configuración del sistema
INITIAL_ELO=1000
XP_PER_LEVEL=100
```

## Orden de Deployment

El sistema PvP consta de 3 contratos que deben desplegarse en el siguiente orden:

1. **PlayerRegistry** - Registro de jugadores y formaciones
2. **BattleEngine** - Motor de combate
3. **PvPArena** - Arena principal (requiere los 2 anteriores)

## Opción 1: Deployment Automático (Recomendado)

### Desplegar Todo el Sistema

```bash
npx hardhat run scripts/pvp/deploy-all.js --network sepolia
```

Este script:
- Despliega los 3 contratos en orden
- Configura las dependencias entre contratos
- Muestra un resumen de addresses y configuración
- Guarda la información en `deployments/pvp-<network>-<timestamp>.json`

### Salida Esperada

```
📦 Deploying PvP System...
====================================

✅ PlayerRegistry deployed at: 0x...
✅ BattleEngine deployed at: 0x...
✅ PvPArena deployed at: 0x...

📊 Configuration:
- ProtocolGuardians: 0x...
- Initial ELO: 1000
- XP per level: 100
- Signer: 0x...
- Challenge fee: 0.001 ETH
- Protocol fee: 3%

💾 Deployment saved to: deployments/pvp-sepolia-1234567890.json
```

## Opción 2: Deployment Manual

Si necesitas más control sobre el proceso:

### 1. Desplegar PlayerRegistry

```bash
npx hardhat run scripts/pvp/deploy-player-registry.js --network sepolia \
  --player-registry.address 0xADDRESS
```

Verifica el deployment:

```javascript
const registry = await ethers.getContractAt("PlayerRegistry", deployedAddress);
const guardians = await registry.protocolGuardians();
console.log("ProtocolGuardians:", guardians);
```

### 2. Desplegar BattleEngine

```bash
npx hardhat run scripts/pvp/deploy-battle-engine.js --network sepolia
```

Verifica el deployment:

```javascript
const engine = await ethers.getContractAt("BattleEngine", deployedAddress);
const maxTurns = await engine.MAX_TURNS();
console.log("Max turns:", maxTurns.toString());
```

### 3. Desplegar PvPArena

```bash
PLAYER_REGISTRY_ADDRESS=0x... \
BATTLE_ENGINE_ADDRESS=0x... \
SIGNER_ADDRESS=0x... \
npx hardhat run scripts/pvp/deploy-pvp-arena.js --network sepolia
```

Verifica el deployment:

```javascript
const arena = await ethers.getContractAt("PvPArena", deployedAddress);
const signer = await arena.signerAddress();
const challengeFee = await arena.challengeFee();
console.log("Signer:", signer);
console.log("Challenge fee:", ethers.formatEther(challengeFee), "ETH");
```

## Verificación en Etherscan

### Usando Hardhat Verify

```bash
# Verificar todos los contratos
npx hardhat verify --network sepolia PLAYER_REGISTRY_ADDRESS
npx hardhat verify --network sepolia BATTLE_ENGINE_ADDRESS
npx hardhat verify --network sepolia PVP_ARENA_ADDRESS \
  PLAYER_REGISTRY_ADDRESS \
  BATTLE_ENGINE_ADDRESS \
  SIGNER_ADDRESS \
  0.001
```

### Verificar Configuración en el Contrato

```javascript
const arena = await ethers.getContractAt("PvPArena", PVP_ARENA_ADDRESS);

// Verificar conexiones
const registry = await arena.playerRegistryAddress();
const engine = await arena.battleEngineAddress();
const signer = await arena.signerAddress();

console.log("PlayerRegistry:", registry);
console.log("BattleEngine:", engine);
console.log("Signer:", signer);

// Verificar configuración
const challengeFee = await arena.challengeFee();
const protocolFee = await arena.protocolFeePercent();

console.log("Challenge fee:", ethers.formatEther(challengeFee), "ETH");
console.log("Protocol fee:", protocolFee.toString(), "%");
```

## Configuración Post-Deployment

### 1. Configurar Backend

Actualiza tu backend con las siguientes addresses:

```javascript
const PVP_CONFIG = {
  playerRegistry: "0x...",
  battleEngine: "0x...",
  pvpArena: "0x...",
  signerAddress: "0x...",
  signerPrivateKey: "0x...", // ¡MANTENER PRIVADA!
  protocolGuardians: "0x...",
};
```

### 2. Configurar Frontend

Actualiza tus contratos en el frontend:

```typescript
export const PVP_CONTRACTS = {
  playerRegistry: {
    address: "0x...",
    abi: PlayerRegistryABI,
  },
  pvpArena: {
    address: "0x...",
    abi: PvPArenaABI,
  },
};
```

### 3. Pruebas de Integración

```bash
# Ejecutar tests de integración
npm run test -- test/pvp/integration.test.js --network sepolia
```

## Deployment en Mainnet

### Checklist Pre-Deployment

- [ ] Auditar contratos con Slither o herramienta similar
- [ ] Ejecutar todos los tests (cobertura >70%)
- [ ] Probar en testnet (Sepolia/Goerli)
- [ ] Verificar gas estimates
- [ ] Configurar backup de private keys
- [ ] Tener ETH suficiente para gas (estimado: ~5-10 ETH)
- [ ] Configurar monitoreo de contratos

### Comandos de Deployment

```bash
# 1. Compilar contratos
npx hardhat compile

# 2. Ejecutar tests
npm run test

# 3. Desplegar en mainnet
npx hardhat run scripts/pvp/deploy-all.js --network mainnet

# 4. Verificar en Etherscan
npx hardhat verify --network mainnet --contract "contracts/pvp/..."
```

## Gestión de Configuración

### Actualizar Fees

```javascript
// Solo owner puede actualizar
await pvpArena.setChallengeFee(ethers.parseEther("0.002"));
await pvpArena.setProtocolFee(5); // 5%
```

### Actualizar Signer Address

```javascript
// Si necesitas cambiar el signer del backend
await pvpArena.setSignerAddress(NEW_SIGNER_ADDRESS);
```

### Funciones de Pausa

```javascript
// Pausar completamente el sistema
await pvpArena.setPauseStatus(true, true, true);

// Pausar solo matchmaking
await pvpArena.setPauseStatus(true, false, false);

// Reanudar operaciones
await pvpArena.setPauseStatus(false, false, false);
```

## Retiro de Fees

### Verificar Balance

```javascript
const balance = await ethers.provider.getBalance(arenaAddress);
console.log("Contract balance:", ethers.formatEther(balance), "ETH");
```

### Retirar Fees

```javascript
// Solo owner puede retirar
await pvpArena.withdrawFees();
```

## Monitoreo Post-Deployment

### Eventos Importantes

```javascript
// Escuchar eventos del arena
arena.on("ChallengeCreated", (challengeId, challenger, opponent, isWager) => {
  console.log("Challenge created:", challengeId);
});

arena.on("BattleCompleted", (challengeId, winner, isWager, reward) => {
  console.log("Battle completed:", winner);
});
```

### Métricas a Monitorear

- Número de jugadores registrados
- Número de combates ejecutados
- Fees acumulados
- Gas costs promedio
- Tasa de éxito de desafíos

## Troubleshooting

### Error: "Invalid signer address"

- Verifica que SIGNER_ADDRESS esté correctamente configurado
- Asegúrate de usar la address correcta (no la private key)

### Error: "Insufficient funds"

- Verifica que la wallet tenga suficiente ETH
- Calcula el gas necesario antes del deployment

### Error: "Contract verification failed"

- Verifica que los parámetros del constructor sean correctos
- Espera unos minutos antes de verificar
- Usa `--no-compile` si ya compilaste

## Seguridad

### Mejores Prácticas

- **Nunca** commits private keys al repositorio
- Usa variables de entorno para datos sensibles
- Mantén backups seguros de contract addresses
- Monitorea los contratos regularmente
- Implementa multisig para funciones administrativas

### Funciones Críticas Protegidas

Todas las funciones administrativas requieren el rol `onlyOwner`:

```solidity
modifier onlyOwner() {
    require(msg.sender == owner(), "Not authorized");
    _;
}
```

### Plan de Rollback

Si se detecta un problema crítico:

1. Pausar el sistema: `setPauseStatus(true, true, true)`
2. Anunciar la pausa a la comunidad
3. Investigar el problema
4. Determinar si es necesario un nuevo deployment
5. Reanudar con precaución

## Redes Soportadas

### Mainnet
- Ethereum Mainnet
- Gas cost: Alto
- Verificación automática disponible

### Testnets
- Sepolia (recomendado)
- Goerli (deprecado)
- Hardhat Network (desarrollo local)

### L2s (Futuro)
- Optimism
- Arbitrum
- Polygon

## Contacto y Soporte

Para preguntas sobre deployment:
- GitHub Issues
- Documentación técnica
- Equipo de desarrollo

## Recursos Adicionales

- [Guía de Arquitectura](./ARCHITECTURE.md)
- [Documentación de Contratos](./CONTRACTS.md)
- [Análisis de Seguridad](./SECURITY.md)
- [Scripts de Utilidad](../README.md#scripts)
