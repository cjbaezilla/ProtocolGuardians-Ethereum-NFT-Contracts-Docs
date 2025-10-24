# Documentación del Sistema de Expediciones

## Resumen

Las expediciones son misiones on-chain donde los Guardians ganan recompensas basadas en sus stats, habilidades y composición estratégica del partido. El sistema cuenta con 5 niveles de dificultad, cálculos complejos de tasa de éxito y escalado exponencial de recompensas.

## Flujo de Expedición

```mermaid
flowchart TD
    A[Seleccionar Partido] --> B[Elegir Misión]
    B --> C[Calcular Tasa de Éxito]
    C --> D[Ejecutar Misión]
    D --> E[Calcular Recompensas]
    E --> F[Aplicar Cooldowns]
    F --> G[Actualizar Stats]
    
    C --> H[Éxito Base: 50%]
    C --> I[Bonus de Stats: min(45%, (party_stats - required) / required * 100)]
    C --> J[Ventaja de Tipo: +15% si ventajoso]
    C --> K[Bonus de Suerte: sum(party_luck) * 0.01%]
    C --> L[Sinergia de Partido: (same_type / total) * 5%]
    
    H --> M[Éxito Final = min(95%, Base + Stats + Tipo + Suerte + Sinergia)]
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N{¿Éxito?}
    N -->|Sí| O[Calcular Recompensas]
    N -->|No| P[Sin Recompensas]
    
    O --> Q[Recompensa Base * Multiplicador de Rareza * Escalado de Dificultad]
    Q --> R[Aplicar Bonificaciones]
    R --> S[Distribuir Recompensas]
    
    P --> T[Aplicar Cooldowns]
    S --> T
    T --> U[Actualizar Estados de Guardian]
```

## Niveles de Dificultad

### 1. Beginner (30 minutos)
- **Stats Requeridos**: 5,000
- **Recompensa Base**: 50 tokens
- **Tasa de Éxito**: 60-80%
- **Cooldown**: 30 minutos
- **Partido Recomendado**: 1-2 Guardians Common/Uncommon

### 2. Novice (2 horas)
- **Stats Requeridos**: 10,000
- **Recompensa Base**: 150 tokens
- **Tasa de Éxito**: 50-70%
- **Cooldown**: 2 horas
- **Partido Recomendado**: 2-3 Guardians Uncommon/Rare

### 3. Adept (6 horas)
- **Stats Requeridos**: 15,000
- **Recompensa Base**: 400 tokens
- **Tasa de Éxito**: 40-60%
- **Cooldown**: 6 horas
- **Partido Recomendado**: 3-4 Guardians Rare/Epic

### 4. Expert (12 horas)
- **Stats Requeridos**: 20,000
- **Recompensa Base**: 1,000 tokens
- **Tasa de Éxito**: 30-50%
- **Cooldown**: 12 horas
- **Partido Recomendado**: 4-5 Guardians Epic/Legendary

### 5. Master (24 horas)
- **Stats Requeridos**: 25,000
- **Recompensa Base**: 3,000 tokens
- **Tasa de Éxito**: 20-40%
- **Cooldown**: 24 horas
- **Partido Recomendado**: 5 Guardians Legendary/Mythic

## Cálculo de Tasa de Éxito

### Fórmula Base
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

### Desglose de Componentes

#### 1. Éxito Base (50%)
Cada expedición comienza con una tasa de éxito base del 50%, asegurando alguna posibilidad de éxito incluso con stats mínimos.

#### 2. Bonus de Stats (0-45%)
```javascript
const statsBonus = Math.min(45, (party.totalStats - mission.requiredStats) / mission.requiredStats * 100);
```
- **0% bonus**: Los stats del partido coinciden exactamente con los requerimientos
- **45% bonus**: Los stats del partido están 45% por encima de los requerimientos (limitado)
- **Escalado lineal**: Cada 1% por encima de los requerimientos = 1% de bonus

#### 3. Ventaja de Tipo (0-15%)
```javascript
const typeAdvantage = hasTypeAdvantage(party, mission) ? 15 : 0;
```
- **15% bonus**: Si el partido contiene un tipo con ventaja sobre el tipo de misión
- **0% bonus**: Si no hay ventaja de tipo presente
- **Rueda de tipos**: Galactic > Cosmic > Celestial > Mechanical > Dragon > Beast > Elemental > Chaos > Galactic

#### 4. Bonus de Suerte (0-5%)
```javascript
const luckBonus = party.totalLuck * 0.01;
```
- **0.01% por punto de Luck**: Cada punto de stat Luck añade 0.01% de tasa de éxito
- **Máximo 5%**: Limitado a 500 Luck total del partido
- **Escalado lineal**: Correlación directa entre Luck y éxito

#### 5. Sinergia de Partido (0-5%)
```javascript
const partySynergy = (party.sameTypeGuardians / party.totalGuardians) * 5;
```
- **5% bonus**: Si todos los miembros del partido son del mismo tipo
- **Escalado lineal**: Cada 20% del mismo tipo = 1% de bonus
- **Fomenta**: Composición de partido enfocada en tipo

### Tasa de Éxito Final
```javascript
const finalSuccess = Math.min(95, baseSuccess + statsBonus + typeAdvantage + luckBonus + partySynergy);
```
- **Máximo 95%**: Ninguna expedición está garantizada para tener éxito
- **Mínimo 50%**: La tasa de éxito base asegura alguna posibilidad
- **Bonificaciones limitadas**: Previene ventajas abrumadoras

## Cálculo de Recompensas

### Fórmula Base
```javascript
function calculateRewards(party, mission) {
  const baseReward = mission.baseReward;
  const rarityMultiplier = party.averageRarityMultiplier;
  const difficultyScaling = baseReward * Math.pow(1.5, mission.difficultyLevel);
  
  return baseReward * rarityMultiplier * difficultyScaling;
}
```

### Desglose de Componentes

#### 1. Recompensa Base
Cada nivel de dificultad tiene una cantidad de recompensa base:
- **Beginner**: 50 tokens
- **Novice**: 150 tokens
- **Adept**: 400 tokens
- **Expert**: 1,000 tokens
- **Master**: 3,000 tokens

#### 2. Multiplicador de Rareza
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

#### 3. Escalado de Dificultad
```javascript
const difficultyScaling = baseReward * Math.pow(1.5, mission.difficultyLevel);
```
- **Escalado exponencial**: Cada nivel de dificultad multiplica las recompensas por 1.5x
- **Beginner**: 1.0x (sin escalado)
- **Novice**: 1.5x
- **Adept**: 2.25x
- **Expert**: 3.375x
- **Master**: 5.0625x

### Ejemplos de Recompensas

#### Ejemplo 1: Misión Beginner
```javascript
// Partido: 2x Common, 1x Uncommon
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

#### Ejemplo 2: Misión Expert
```javascript
// Partido: 3x Legendary, 2x Epic
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

## Estrategias de Composición de Partido

### 1. Enfoque Balanceado
**Composición**: 1 de cada tipo
**Ventajas**: Cobertura de tipos, versatilidad
**Desventajas**: Sin bonificaciones de sinergia de tipo
**Mejor Para**: Principiantes, aprender el sistema

### 2. Enfoque de Sinergia de Tipo
**Composición**: 3-4 del mismo tipo + 1-2 otros
**Ventajas**: Bonificaciones de sinergia de tipo, estrategia enfocada
**Desventajas**: Vulnerable a desventajas de tipo
**Mejor Para**: Jugadores experimentados, estrategias específicas

### 3. Enfoque de Contra-Estrategia
**Composición**: Tipos elegidos para contrarrestar tipos de misión específicos
**Ventajas**: Máxima ventaja de tipo
**Desventajas**: Versatilidad limitada
**Mejor Para**: Jugadores avanzados, optimización específica de misión

### 4. Enfoque de Rareza
**Composición**: Guardians de mayor rareza disponibles
**Ventajas**: Máximos bonus de stats, mejores habilidades
**Desventajas**: Alto costo, disponibilidad limitada
**Mejor Para**: Jugadores con colecciones de alto valor

## Composiciones de Partido Recomendadas

### Por Nivel de Dificultad

#### Misiones Beginner
- **Tamaño de Partido**: 1-2 Guardians
- **Recomendado**: 1x Common + 1x Uncommon
- **Estrategia**: Stats básicos, aprender mecánicas
- **Tasa de Éxito**: 60-80%

#### Misiones Novice
- **Tamaño de Partido**: 2-3 Guardians
- **Recomendado**: 2x Uncommon + 1x Rare
- **Estrategia**: Stats balanceados, cobertura de tipos
- **Tasa de Éxito**: 50-70%

#### Misiones Adept
- **Tamaño de Partido**: 3-4 Guardians
- **Recomendado**: 2x Rare + 2x Epic
- **Estrategia**: Sinergia de tipos, combinaciones de habilidades
- **Tasa de Éxito**: 40-60%

#### Misiones Expert
- **Tamaño de Partido**: 4-5 Guardians
- **Recomendado**: 3x Epic + 2x Legendary
- **Estrategia**: Stats altos, habilidades estratégicas
- **Tasa de Éxito**: 30-50%

#### Misiones Master
- **Tamaño de Partido**: 5 Guardians
- **Recomendado**: 3x Legendary + 2x Mythic
- **Estrategia**: Stats máximos, habilidades definitivas
- **Tasa de Éxito**: 20-40%

### Por Tipo de Misión

#### Misiones de Velocidad-Crítica
- **Recomendado**: 3x Galactic + 2x Cosmic
- **Razonamiento**: Alta Speed + Mana para completado rápido
- **Habilidades**: Buffs de velocidad, reducción de duración

#### Misiones de Enfoque de Poder
- **Recomendado**: 2x Dragon + 2x Beast + 1x Elemental
- **Razonamiento**: Salida máxima de Power
- **Habilidades**: Buffs de poder, amplificación de daño

#### Misiones Balanceadas
- **Recomendado**: 1x de cada tipo
- **Razonamiento**: Cobertura de ventaja de tipo
- **Habilidades**: Cobertura versátil de habilidades

#### Misiones Defensivas
- **Recomendado**: 3x Mechanical + 2x Celestial
- **Razonamiento**: Alta Defense + Mana
- **Habilidades**: Buffs de defensa, mitigación de daño

#### Misiones Basadas en Suerte
- **Recomendado**: 2x Chaos + 2x Cosmic + 1x Galactic
- **Razonamiento**: Máxima Luck + Mana
- **Habilidades**: Buffs de suerte, manipulación de probabilidad

## Sistema de Cooldown

### Duración de Cooldown
```javascript
const cooldownDuration = mission.duration;
```
- **Ratio 1:1**: Cooldown igual a la duración de la misión
- **Beginner**: 30 minutos de cooldown
- **Novice**: 2 horas de cooldown
- **Adept**: 6 horas de cooldown
- **Expert**: 12 horas de cooldown
- **Master**: 24 horas de cooldown

### Gestión de Cooldowns
```javascript
function canStartExpedition(guardian) {
  const lastExpedition = guardian.lastExpeditionTime;
  const cooldownDuration = guardian.cooldownDuration;
  const currentTime = Date.now() / 1000;
  
  return (currentTime - lastExpedition) >= cooldownDuration;
}
```

### Reducción de Cooldowns
Ciertas habilidades pueden reducir la duración del cooldown:
- **TIME DILATION**: Reduce todos los cooldowns en 50% por 8 horas
- **TEMPORAL MASTERY**: Reduce todos los cooldowns en 75% por 12 horas
- **TIME MASTERY**: Reduce las duraciones de expedición en 50% por 12 horas

## Tipos de Misiones

### 1. Misiones de Velocidad
**Enfoque**: Stats de Speed y Mana
**Ventaja de Tipo**: Galactic > Cosmic
**Recomendado**: Guardians con alta Speed/Mana
**Habilidades**: Buffs de velocidad, reducción de duración

### 2. Misiones de Poder
**Enfoque**: Stats de Power y HP
**Ventaja de Tipo**: Dragon > Beast
**Recomendado**: Guardians con alta Power/HP
**Habilidades**: Buffs de poder, amplificación de daño

### 3. Misiones de Defensa
**Enfoque**: Stats de Defense y Stamina
**Ventaja de Tipo**: Mechanical > Dragon
**Recomendado**: Guardians con alta Defense/Stamina
**Habilidades**: Buffs de defensa, mitigación de daño

### 4. Misiones Mágicas
**Enfoque**: Stats de Mana y Critical
**Ventaja de Tipo**: Elemental > Chaos
**Recomendado**: Guardians con alta Mana/Critical
**Habilidades**: Buffs de mana, amplificación crítica

### 5. Misiones de Suerte
**Enfoque**: Stats de Luck y Critical
**Ventaja de Tipo**: Chaos > Galactic
**Recomendado**: Guardians con alta Luck/Critical
**Habilidades**: Buffs de suerte, manipulación de probabilidad

## Ejemplos de Implementación

### Ejemplo 1: Cálculo de Tasa de Éxito
```javascript
// Partido: 3x Legendary Galactic, 2x Epic Cosmic
// Misión: Expert (20,000 stats requeridos)

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

// Cálculo:
const baseSuccess = 50;
const statsBonus = Math.min(45, (25000 - 20000) / 20000 * 100); // 25%
const typeAdvantage = 15; // Galactic > Cosmic
const luckBonus = 500 * 0.01; // 5%
const partySynergy = (3 / 5) * 5; // 3%

const finalSuccess = Math.min(95, 50 + 25 + 15 + 5 + 3); // 98% -> 95% (limitado)
```

### Ejemplo 2: Cálculo de Recompensas
```javascript
// Mismo partido y misión
const baseReward = 1000; // Recompensa base Expert
const rarityMultiplier = (3 * 3.0 + 2 * 2.5) / 5; // 2.8x promedio
const difficultyScaling = 1000 * Math.pow(1.5, 4); // 5,062.5

const finalReward = 1000 * 2.8 * 5.0625; // 14,175 tokens
```

### Ejemplo 3: Optimización de Partido
```javascript
// Misión: Tipo Dragon, requiere alta Power y HP
// Partido recomendado: 2x Dragon + 2x Beast + 1x Elemental

const recommendedParty = [
  { type: 'Dragon', stats: { power: 3000, hp: 2500 } },
  { type: 'Dragon', stats: { power: 2800, hp: 2400 } },
  { type: 'Beast', stats: { power: 2000, speed: 2500 } },
  { type: 'Beast', stats: { power: 1900, speed: 2300 } },
  { type: 'Elemental', stats: { power: 1800, mana: 2000 } }
];

// Este partido proporciona:
// - Alta Power (ventaja Dragon)
// - Ventaja de tipo (Beast > Dragon)
// - Stats balanceados para requerimientos de misión
// - Bonificaciones de sinergia para tipos iguales
```

## Consideraciones de Balance

### Balance de Tasa de Éxito
- **Base 50%**: Asegura alguna posibilidad de éxito
- **Máximo 95%**: Previene éxito garantizado
- **Escalado lineal**: Bonificaciones de stats predecibles
- **Ventajas de tipo**: Significativas pero no abrumadoras

### Balance de Recompensas
- **Escalado exponencial**: Mayor dificultad = recompensas significativamente mejores
- **Multiplicadores de rareza**: Mayor rareza = mejores recompensas
- **Escalado de dificultad**: Fomenta misiones desafiantes
- **Costo vs. beneficio**: Ratio riesgo/recompensa balanceado

### Profundidad Estratégica
- **La composición del partido importa**: Diferentes estrategias para diferentes misiones
- **Ventajas de tipo**: Decisiones significativas para selección de partido
- **Gestión de cooldowns**: Consideraciones de tiempo estratégico
- **Combinaciones de habilidades**: Interacciones complejas entre habilidades

## Consideraciones Futuras

### Características Planificadas
- **Variantes de Misiones**: Diferentes tipos de misiones dentro de cada dificultad
- **Eventos Estacionales**: Misiones de tiempo limitado con recompensas especiales
- **Misiones de Guild**: Misiones colaborativas para múltiples jugadores
- **Dificultad Dinámica**: Misiones que se adaptan a la fuerza del partido

### Actualizaciones de Balance
- **Tasas de éxito**: Pueden ajustarse basadas en datos de gameplay
- **Escalado de recompensas**: Ajuste fino basado en datos económicos
- **Duraciones de cooldown**: Optimización basada en comportamiento del jugador
- **Nuevos tipos de misiones**: Adición de nuevas categorías de misiones

---

El sistema de expediciones proporciona gameplay estratégico profundo con decisiones significativas para composición de partido, selección de misión y uso de habilidades. El cálculo complejo de tasa de éxito y escalado de recompensas crea un sistema balanceado de riesgo/recompensa que fomenta tanto el pensamiento estratégico como la progresión a largo plazo.
