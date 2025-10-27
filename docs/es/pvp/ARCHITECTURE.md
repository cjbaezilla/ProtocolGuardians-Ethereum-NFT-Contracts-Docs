# Arquitectura del Sistema PvP

## Visión General

El sistema PvP de Protocol Guardians es un sistema de combate descentralizado jugador contra jugador construido sobre Ethereum. Permite que los holders de NFT se enfrenten en batallas asíncronas de 1v1, 3v3 y 5v5 con ranking integrado, apuestas y distribución de recompensas.

## Componentes del Sistema

### Contratos Principales

1. **PlayerRegistry.sol**: Gestiona perfiles de jugadores, formaciones y emparejamiento
2. **BattleEngine.sol**: Implementa el algoritmo de combate por turnos
3. **PvPArena.sol**: Orquesta desafíos, apuestas y ejecución de batallas
4. **IProtocolGuardians.sol**: Interface para interactuar con el contrato NFT principal

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  (Parseo de Metadata, Generación de Firmas, UI)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                            │
│  (Servicio de Firmado de Stats)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PvPArena.sol                              │
│  - Creación/Aceptación de Desafíos                          │
│  - Gestión de Apuestas                                       │
│  - Verificación de Firmas                                    │
│  - Actualización de ELO/XP                                   │
│  - Distribución de Recompensas                               │
└─────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│PlayerRegistry│    │BattleEngine  │    │ProtocolGuard.│
│              │    │              │    │   NFT        │
│-Perfiles     │    │-Lógica Comb. │    │              │
│-Formaciones  │    │-Cálculo Daño │    │-Verif. Owner │
│-ELO/XP       │    │-Orden Turnos │    │-Transfer     │
│-Matchmaking  │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Flujo de Datos

### 1. Flujo de Registro de Jugador

```
Usuario → PlayerRegistry.registerPlayer()
      → Almacena: username, avatar, ELO=1000, XP=0, nivel=1
      → Evento: PlayerRegistered
```

### 2. Flujo de Configuración de Formación

```
Usuario → PlayerRegistry.setFormation(battleType, tokenIds)
      → Valida: propiedad, tamaño de formación (1/3/5)
      → Almacena: mapping de formación
      → Evento: FormationSet
```

### 3. Flujo de Desafío (Ranking)

```
Retador → PvPArena.createRankingChallenge(
                    oponente, battleType, statsFirmadas)
          → Paga tarifa de desafío (0.001 ETH)
          → Valida: ambos registrados, formaciones existen
          → Almacena: Struct Challenge
          → Evento: RankingChallengeCreated
          
Oponente → PvPArena.acceptChallenge(challengeId)
          → Ejecuta batalla (si válido)
          → Actualiza ELO/XP
          → Evento: BattleCompleted
```

### 4. Flujo de Desafío (Apuesta)

```
Retador → PvPArena.createWagerChallenge(
                    oponente, battleType, token, cantidad, stats)
          → Paga tarifa + apuesta
          → Valida: formaciones, stats válidas
          → Almacena: Challenge con info de apuesta
          → Evento: WagerChallengeCreated
          
Oponente → PvPArena.acceptChallenge(challengeId, stats)
          → Paga apuesta equivalente
          → Ejecuta batalla
          → Ganador obtiene: (apuesta * 2 * 0.97)
          → Protocolo obtiene: (apuesta * 2 * 0.03)
```

### 5. Flujo de Ejecución de Batalla

```
PvPArena.acceptChallenge()
    → Verifica firmas de stats (ambos jugadores)
    → Valida propiedad de NFTs
    → BattleEngine.executeBattle(team1Stats, team2Stats)
        → Ordena cartas por Velocidad
        → Loop de turnos (máx. 50):
            → Para cada carta: calcula dodge, crítico, daño
            → Aplica ventaja de tipo
            → Reduce HP
            → Verifica condición de victoria
        → Retorna: ganador, turnos, HP restante
    → Actualiza PlayerRegistry (ELO/XP si ranking)
    → Distribuye recompensas (si apuesta)
    → Evento: BattleExecuted
```

## Decisiones de Diseño

### Descentralización

- Toda la lógica del juego on-chain para transparencia
- No es posible manipulación del lado del servidor
- Datos de jugadores almacenados on-chain

### Optimización de Gas

- Contrato BattleEngine separado para lógica de combate
- Stats pasadas como parámetros (no recuperadas)
- Eventos usados para rastreo eficiente de estado
- Almacenamiento empaquetado para uints pequeños

### Seguridad

- Verificación de firma ECDSA para autenticidad de stats
- ReentrancyGuard en funciones de pago
- Verificaciones de owner en funciones críticas
- Validación de formación antes de batalla

### Escalabilidad

- Desafíos asíncronos (no requiere juego simultáneo)
- Firmas de stats expiran después de 1 hora
- Diseño de contrato modular (despliegue independiente)
- Patrones de almacenamiento eficientes

## Interacciones entre Contratos

### PvPArena → PlayerRegistry

- `registerPlayer()`: Verificar registro
- `getPlayerProfile()`: Obtener ELO/XP para actualizaciones
- `updateEloXp()`: Ajustar ranking del jugador
- `validateFormation()`: Verificar validez de formación

### PvPArena → BattleEngine

- `executeBattle()`: Ejecutar simulación de combate
- Retorna `BattleResult` con info del ganador

### PvPArena → ProtocolGuardians NFT

- `ownerOf(tokenId)`: Validar propiedad
- Llamado en creación y aceptación de desafío

## Consideraciones de Gas

### Costos de Gas Típicos (estimados)

- Registro de Jugador: ~120k gas
- Configurar Formación: ~60k gas
- Crear Desafío: ~150k gas
- Aceptar Desafío (1v1): ~300k gas
- Aceptar Desafío (3v3): ~500k gas
- Aceptar Desafío (5v5): ~800k gas

### Técnicas de Optimización

1. **Almacenamiento**: Usar arrays de `uint256` en lugar de structs donde sea posible
2. **Eventos**: Usar campos indexados para filtrado eficiente
3. **Computación**: Mover cálculos pesados a BattleEngine
4. **Empaquetado**: Operaciones por lotes cuando sea posible

## Integración con Frontend

### Acciones Requeridas

1. **Parseo de Metadata**: Obtener metadata de NFT desde IPFS
2. **Extracción de Stats**: Parsear stats desde metadata
3. **Generación de Firmas**: Enviar stats al backend para firmar
4. **Interacción con Contrato**: Llamar funciones de PvPArena con stats firmadas
5. **Escucha de Eventos**: Escuchar eventos BattleCompleted

### Requisitos del Backend

- Servicio de firmado con clave privada
- Validación de stats antes de firmar
- Rate limiting por dirección
- Expiración de firma (1 hora)
