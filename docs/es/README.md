# Protocol Guardians - Documentación en Español

## Índice

### 📚 Documentación Técnica
- [Arquitectura del Sistema](./arquitectura.md) - Arquitectura completa con diagramas Mermaid
- [Documentación de Contratos](./contratos.md) - Documentación detallada de cada contrato
- [Guía de Deployment](./deployment.md) - Guía paso a paso para deployment
- [Documentación de Testing](./TESTING.md) - Documentación de suite de tests (226 pasando)

### 👥 Guías de Usuario
- [Guía de Staking](./staking-guide.md) - Cómo hacer staking de NFTs
- [Guía de Gobernanza DAO](./dao-guide.md) - Guía completa de gobernanza con Timelock
- [Ejemplos de Uso](./ejemplos.md) - Ejemplos de código y casos de uso

### ⚔️ Sistema PvP
- [Arquitectura PvP](./pvp/ARCHITECTURE.md) - Arquitectura completa del sistema PvP
- [Contratos PvP](./pvp/CONTRACTS.md) - Documentación de contratos PvP
- [Deployment PvP](./pvp/DEPLOYMENT.md) - Guía de deployment PvP
- [Seguridad PvP](./pvp/SECURITY.md) - Análisis de seguridad PvP

## Descripción General

Protocol Guardians es un sistema completo de NFT ERC721 con capacidades de staking y gobernanza DAO construido en Ethereum. El proyecto incluye:

- **ProtocolGuardians NFT**: Colección de NFTs con URI inmutable
- **ProtocolPower Token**: Token ERC20 con capacidades de gobernanza
- **ProtocolStaking**: Contrato de staking con custody
- **ProtocolTimelock**: Controlador de timelock configurable (por defecto 2 días) para gobernanza DAO

## Contratos Desplegados

### Ethereum Mainnet
- **ProtocolGuardians NFT**: [`0xfB49118d739482048ff514b699C23E2875a91837`](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Etherscan**: [Ver Contrato](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Sourcify**: [Código Verificado](https://repo.sourcify.dev/1/0xfB49118d739482048ff514b699C23E2875a91837/)
- **Blockscout**: [Ver en Blockscout](https://eth.blockscout.com/address/0xfB49118d739482048ff514b699C23E2875a91837?tab=contract)
- **Routescan**: [Ver en Routescan](https://routescan.io/address/0xfB49118d739482048ff514b699C23E2875a91837/contract/1/code)
- **OpenSea**: [Ver Colección](https://opensea.io/collection/protocol-guardians)

## Características Principales

### 🎨 NFTs (ProtocolGuardians)
- Implementación con Solady para optimización de gas
- URI base inmutable (IPFS)
- Supply ilimitado (sin cap de minting)
- Transferencias estándar ERC721

### 💰 Sistema de Recompensas
- 10 tokens POWER por NFT por día
- Cálculo basado en bloques de Ethereum
- Minting on-demand
- Recompensas acumulativas

### 🏛️ Gobernanza DAO
- Timelock configurable (por defecto 2 días)
- Votación con tokens POWER
- Propuestas y ejecución
- Integración con Tally

### 🔒 Staking Seguro
- Custody staking (NFTs transferidos al contrato)
- Protección contra reentrancy
- Tracking preciso de recompensas
- Unstaking con recompensas automáticas

## Flujo de Uso

1. **Mint NFTs**: Crear NFTs de la colección
2. **Stake NFTs**: Depositar NFTs en el contrato de staking
3. **Acumular Recompensas**: Las recompensas se acumulan automáticamente
4. **Claim Recompensas**: Retirar tokens POWER acumulados
5. **Gobernanza**: Participar en decisiones DAO con tokens POWER

## Tecnologías Utilizadas

- **Solidity ^0.8.28**
- **Solady**: Para optimización de gas
- **OpenZeppelin**: Para contratos de gobernanza
- **Hardhat**: Para desarrollo y testing
- **Ethers.js**: Para interacción con contratos

## Testing

### Cobertura de Tests ✅
- **✅ 226 Tests Pasando** (89% tasa de éxito)
- **⚔️ Tests Sistema PvP**: BattleEngine, PlayerRegistry, PvPArena con cobertura completa
- **Tests Unitarios**: Testing individual de cada uno de los contratos principales
- **Tests de Integración**: Validación de funcionalidad entre contratos
- **Tests de Seguridad**: Validación de reentrancy y control de acceso
- **Tests de Gas**: Verificación de optimización de rendimiento
- **Casos Edge**: Manejo comprehensivo de errores y testing de límites

### Resultados de Tests
```
✅ ProtocolGuardians: 18 tests pasando
✅ ProtocolPower: 20 tests pasando  
✅ ProtocolStaking: 25 tests pasando
✅ ProtocolTimelock: 15 tests pasando
✅ Tests de Integración: 8 tests pasando
✅ BattleEngine: 12+ tests pasando
✅ PlayerRegistry: 45+ tests pasando
✅ PvPArena: 24+ tests pasando
✅ Integración PvP: Múltiples tests de integración pasando
```

**Total**: 226 pasando / 28 fallando (254 tests totales)

## Seguridad

- Auditoría de contratos recomendada
- **✅ 226 Tests Pasando** con cobertura comprehensiva
- Protección contra reentrancy
- Validación de parámetros
- Roles y permisos bien definidos

## Limitaciones Conocidas

- ⚠️ **Mint Público**: Cualquiera puede mintear NFTs sin restricciones
- ⚠️ **Sin Pausa**: El staking no puede ser pausado
- ⚠️ **Inmutabilidad**: Parámetros de recompensas son fijos
- ℹ️ **Batch Limit**: Máximo 30 NFTs por transacción

## Próximos Pasos

1. Revisar la [Arquitectura del Sistema](./arquitectura.md)
2. Consultar la [Guía de Deployment](./deployment.md)
3. Explorar [Ejemplos de Uso](./ejemplos.md)
4. Configurar gobernanza con [Guía DAO](./dao-guide.md)
