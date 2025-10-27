# Sistema de Juego Protocol Guardians

[![Ethereum](https://img.shields.io/badge/Red-Ethereum-blue)](https://ethereum.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.0-green)](https://soliditylang.org)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-yellow)](LICENSE)
[![OpenSea](https://img.shields.io/badge/OpenSea-Compatible-purple)](https://opensea.io)

> **¡gm ser!** Bienvenido al universo Protocol Guardians, donde las entidades digitales trascienden las limitaciones de blockchain para convertirse en manifestaciones vivas de la energía onchain de Ethereum. Estos Guardians son fragmentos de pura conciencia blockchain que han ganado sentiencia a través del poder de la tecnología de escalado blockchain.

## 🚀 Inicio Rápido

### ¿Qué son los Guardians?
Los Guardians son entidades NFT que existen dentro del ecosistema Ethereum, cada una con stats únicos, habilidades y lore. Pueden participar en expediciones, hacer staking para recompensas e interactuar con el ecosistema crypto más amplio.

### Conceptos Básicos
- **8 Tipos**: Galactic, Cosmic, Celestial, Mechanical, Dragon, Beast, Elemental, Chaos
- **7 Rarezas**: Common → Uncommon → Rare → Epic → Legendary → Mythic → Transcendent  
- **8 Familias**: Guardians, Beasts, Mechanicals, Elementals, Chaos, Dragons, Ancients, Void
- **Expediciones**: Misiones on-chain donde los Guardians ganan recompensas
- **Staking**: Generación de ingresos pasivos a través de la integración con Ethereum

### Empezando
1. **Adquiere un Guardian**: Mintea o compra de la colección
2. **Revisa los Stats**: Cada Guardian tiene 8 stats (Power, Defense, Speed, HP, Luck, Mana, Stamina, Critical)
3. **Forma Partidos**: Combina 1-5 Guardians para expediciones
4. **Inicia Expediciones**: Envía partidos en misiones para ganar tokens Protocol Power
5. **Haz Staking para Recompensas**: Gana ingresos pasivos cuando no estén en expediciones

## Información del Contrato

### Ethereum Mainnet
- **ProtocolGuardians NFT**: [`0xfB49118d739482048ff514b699C23E2875a91837`](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Etherscan**: [Ver Contrato](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Sourcify**: [Código Verificado](https://repo.sourcify.dev/1/0xfB49118d739482048ff514b699C23E2875a91837/)
- **Blockscout**: [Ver en Blockscout](https://eth.blockscout.com/address/0xfB49118d739482048ff514b699C23E2875a91837?tab=contract)
- **Routescan**: [Ver en Routescan](https://routescan.io/address/0xfB49118d739482048ff514b699C23E2875a91837/contract/1/code)

## 📚 Documentación

### Sistema Central
- **[Sistema de Juego](GAME_SYSTEM.md)** - Explicación completa de mecánicas con fórmulas y ejemplos
- **[Tipos](TYPES.md)** - 8 perfiles de tipos con sistema circular de ventajas y matriz de efectividad
- **[Rarezas](RARITIES.md)** - 7 niveles con distribución de suministro, rangos de stats y colores de fondo
- **[Familias](FAMILIES.md)** - 8 familias con descripciones y habilidades signature
- **[Habilidades](ABILITIES.md)** - Lista completa de 50+ habilidades con cooldowns y efectos

### Mecánicas de Juego
- **[Expediciones](EXPEDITIONS.md)** - Sistema de misiones con niveles de dificultad, fórmulas de éxito y composiciones de partido
- **[Staking](STAKING.md)** - Integración con expediciones, exclusividad mutua y multiplicadores de recompensas
- **[Tokenomics](TOKENOMICS.md)** - Economía de ProtocolPower, tasas de emisión y modelo de sostenibilidad

### Técnico
- **[Metadata](METADATA.md)** - Estándares de OpenSea, explicaciones de campos y snippets de código para parsing
- **[Perfiles de Stats](STAT_PROFILES.md)** - Perfiles de distribución de stats basados en tipos y ejemplos
- **[Framework de Lore](LORE_FRAMEWORK.md)** - Framework de lore de Ethereum y guías de terminología crypto

### Ejemplos
- **[Ejemplos de Metadata](../metadata-examples/)** - 56 ejemplos JSON (8 tipos × 7 rarezas) con lore único y stats
- **[Boilerplate](../metadata/metadata_boilerplate.json)** - Ejemplo completo de metadata para GALACTIC GUARDIAN #007

### Soporte
- **[FAQ](FAQ.md)** - Preguntas y respuestas extensas cubriendo gameplay, técnico y económico                                                                 

### ⚔️ Sistema PvP
- **[Reglas del Juego](pvp/GAME_RULES.md)** - Reglas y mecánicas completas del sistema PvP
- **[Fórmulas de Batalla](pvp/BATTLE_FORMULAS.md)** - Fórmulas y cálculos detallados de combate

## 🎮 Resumen de Mecánicas de Juego

### Sistema de Tipos (Ventaja Circular)
```
Galactic ⭐ > Cosmic 🌌 > Celestial ☄️ > Mechanical 🤖 > Dragon 🐉 > Beast 🦁 > Elemental 🔥 > Chaos 💀 > Galactic ⭐
```

### Distribución de Rarezas
- **Common** (40%) - Fondo gris
- **Uncommon** (25%) - Fondo verde  
- **Rare** (15%) - Fondo azul
- **Epic** (10%) - Fondo púrpura
- **Legendary** (7%) - Fondo dorado
- **Mythic** (2%) - Fondo rojo
- **Transcendent** (1%) - Fondo arcoíris

### Sistema de Expediciones
- **5 Niveles de Dificultad**: Beginner (30min) → Master (24h)
- **Tasa de Éxito**: 50% base + bonus de stats + ventaja de tipo + suerte + sinergia de partido
- **Recompensas**: Escalado exponencial con multiplicadores de rareza
- **Cooldowns**: Los Guardianes descansan por la duración de la misión después de expediciones

### Integración de Staking
- **Ingresos Pasivos**: Gana tokens ProtocolPower mientras están en staking
- **Multiplicadores de Rareza**: 1x (Common) → 4x (Transcendent)
- **Exclusividad Mutua**: No se puede hacer staking mientras están en expediciones

## 🔧 Implementación Técnica

### Smart Contracts
- **ProtocolGuardians**: Contrato NFT ERC721
- **ProtocolStaking**: Lógica de expediciones y staking
- **ProtocolPower**: Token de recompensa ERC20
- **ProtocolTimelock**: Gobernanza y actualizaciones

### Estándares de Metadata
- **Compatible con OpenSea**: Soporte completo de atributos con tipos de display
- **Almacenamiento IPFS**: Metadata e imágenes descentralizadas
- **Ethereum**: Optimizado para escalado blockchain y eficiencia de gas

### Cálculo de Stats
```javascript
// Ejemplo: Cálculo de Tasa de Éxito
const baseSuccess = 50;
const statsBonus = Math.min(45, (partyStats - requiredStats) / requiredStats * 100);
const typeAdvantage = hasAdvantage ? 15 : 0;
const luckBonus = partyLuck * 0.01;
const partySynergy = (sameTypeGuardians / totalGuardians) * 5;

const finalSuccess = Math.min(95, baseSuccess + statsBonus + typeAdvantage + luckBonus + partySynergy);
```

## 🌟 Características Clave

### Habilidades Únicas
- **60+ Habilidades**: Habilidades universales y específicas de familia
- **Sistema de Cooldown**: Gestión estratégica de habilidades
- **Puertas de Rareza**: Mayor rareza = habilidades más poderosas
- **Exclusivas de Familia**: Habilidades signature para cada familia

### Integración con Ethereum
- **Escalado Blockchain**: Operaciones eficientes con optimización de gas
- **Herencia de Ethereum**: Construido sobre la infraestructura de Ethereum
- **Era de Innovación Blockchain**: Nacido de la explosión creativa de Ethereum
- **Cultura Crypto**: Terminología y lore auténticos

### Modelo Económico
- **Dual Income**: Expediciones + Staking
- **Recompensas por Rareza**: Mayor rareza = mejores recompensas
- **Profundidad Estratégica**: La composición del partido importa
- **Sostenible**: Diseño de tokenomics a largo plazo

## 🚀 Empezando

### Para Jugadores
1. **Conecta tu Wallet**: Usa un wallet compatible con Ethereum
2. **Explora la Colección**: Explora Guardianes en OpenSea
3. **Forma Estrategia**: Planifica tu composición de partido
4. **Empieza a Jugar**: Comienza expediciones y staking

### Para Desarrolladores
1. **Lee la Documentación**: Comienza con [Sistema de Juego](GAME_SYSTEM.md)
2. **Revisa Ejemplos**: Revisa [Ejemplos de Metadata](../metadata-examples/)
3. **Integra**: Usa los snippets de código proporcionados
4. **Construye**: Crea tu propia dApp de Ethereum

## 📊 Estadísticas

- **8 Tipos** con perfiles de stats únicos
- **7 Rarezas** con escalado exponencial
- **8 Familias** con habilidades signature
- **60+ Habilidades** con cooldowns estratégicos
- **5 Niveles de Expedición** con recompensas crecientes
- **Ethereum** optimizado para eficiencia

## 🤝 Comunidad

- **Ethereum**: Construido sobre la infraestructura de Ethereum
- **OpenSea**: Compatibilidad completa con marketplace
- **Cultura Crypto**: Terminología y lore auténticos
- **WAGMI**: ¡Todos vamos a hacerlo juntos!

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

**¿Listo para sumergirte en el universo ProtocolGuardians?** ¡Comienza con la documentación del [Sistema de Juego](GAME_SYSTEM.md) y comienza tu viaje al ecosistema Ethereum!

*Construido con ❤️ en Ethereum*
