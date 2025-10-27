# Ejemplos de Metadata de Protocol Guardians

## Resumen

Esta carpeta contiene ejemplos representativos de metadata para la colección Protocol Guardians, mostrando la diversidad de tipos, rarezas y familias disponibles. Cada ejemplo incluye lore único, stats balanceados y habilidades apropiadas para su rareza.

## Ejemplos Incluidos

### 1. Common Galactic #001
- **Tipo**: Galactic ⭐
- **Familia**: Guardians
- **Rareza**: Common
- **Enfoque**: Speed y Mana altos, habilidades básicas
- **Lore**: Entidad joven con potencial cósmico

### 2. Uncommon Beast #008
- **Tipo**: Beast 🦁
- **Familia**: Beasts
- **Rareza**: Uncommon
- **Enfoque**: Speed, Power y Stamina balanceados
- **Lore**: Cazador salvaje con instintos naturales

### 3. Rare Elemental #015
- **Tipo**: Elemental 🔥
- **Familia**: Elementals
- **Rareza**: Rare
- **Enfoque**: Mana, Power y Critical altos
- **Lore**: Maestro de elementos digitales

### 4. Epic Mechanical #023
- **Tipo**: Mechanical 🤖
- **Familia**: Mechanicals
- **Rareza**: Epic
- **Enfoque**: Defense y Stamina altos
- **Lore**: Entidad de precisión tecnológica

### 5. Epic Celestial #034
- **Tipo**: Celestial ☄️
- **Familia**: Guardians
- **Rareza**: Epic
- **Enfoque**: Power, Mana y Defense balanceados
- **Lore**: Guardián divino de principios descentralizados

### 6. Legendary Dragon #042
- **Tipo**: Dragon 🐉
- **Familia**: Dragons
- **Rareza**: Legendary
- **Enfoque**: Power y HP máximos
- **Lore**: Señor dragón con sabiduría ancestral

### 7. Legendary Void #066
- **Tipo**: Void 🌌
- **Familia**: Void
- **Rareza**: Legendary
- **Enfoque**: Critical y Luck altos
- **Lore**: Maestro del vacío que manipula la realidad

### 8. Mythic Ancient #099
- **Tipo**: Ancient 🏛️
- **Familia**: Ancients
- **Rareza**: Mythic
- **Enfoque**: Power, Mana y Defense altos
- **Lore**: Guardián de la sabiduría crypto original

### 9. Transcendent Chaos #007
- **Tipo**: Chaos 💀
- **Familia**: Chaos
- **Rareza**: Transcendent
- **Enfoque**: Critical y Luck máximos
- **Lore**: Entidad trascendente del caos digital

## Características de los Ejemplos

### Lore Único
Cada ejemplo incluye una descripción de 300-500 palabras que:
- Integra terminología crypto auténtica (gm, ser, wagmi, degen, etc.)
- Referencia Ethereum y blockchain heritage
- Mantiene consistencia con el tipo y familia
- Usa lenguaje natural y conversacional

### Stats Balanceados
Los stats siguen las distribuciones por tipo:
- **Galactic**: Speed (25%), Mana (20%), Critical (15%)
- **Beast**: Speed (25%), Power (20%), Stamina (20%)
- **Elemental**: Mana (25%), Power (20%), Critical (15%)
- **Mechanical**: Defense (25%), Stamina (20%), Power (15%)
- **Celestial**: Power (25%), Mana (20%), Defense (15%)
- **Dragon**: Power (30%), HP (25%), Defense (15%)
- **Void**: Critical (30%), Luck (20%), Power (15%)
- **Ancient**: Power (25%), Mana (20%), Defense (15%)
- **Chaos**: Critical (30%), Luck (20%), Power (15%)

### Habilidades Apropiadas
Cada Guardian tiene 3 habilidades que:
- Siguen las puertas de rareza apropiadas
- Incluyen habilidades universales y signature de familia
- Tienen cooldowns y efectos balanceados
- Incluyen metadata estructurada para parsing

### Compatibilidad OpenSea
Todos los ejemplos son completamente compatibles con OpenSea:
- Campos requeridos: name, description, image, external_url, background_color
- Atributos con display_type apropiados
- Estructura de metadata estándar
- URLs IPFS válidas (placeholders)

## Uso de los Ejemplos

### Para Desarrolladores
```javascript
// Cargar metadata de ejemplo
const metadata = await fetch('./common_galactic_001.json').then(r => r.json());

// Parsear stats
const stats = extractStats(metadata.attributes);

// Parsear habilidades
const abilities = extractAbilities(metadata.attributes);
```

### Para Artistas
- Usar los colores de fondo por rareza
- Integrar el lore en el arte visual
- Considerar las características del tipo en el diseño

### Para Coleccionistas
- Entender las diferencias entre rarezas
- Apreciar la diversidad de tipos y familias
- Valorar el lore único de cada Guardian

## Estructura de Archivos

```
metadata-examples/
├── README.md
├── common_galactic_001.json
├── uncommon_beast_008.json
├── rare_elemental_015.json
├── epic_mechanical_023.json
├── epic_celestial_034.json
├── legendary_dragon_042.json
├── legendary_void_066.json
├── mythic_ancient_099.json
└── transcendent_chaos_007.json
```

## Consideraciones Técnicas

### URLs IPFS
Los ejemplos usan placeholders para URLs IPFS:
- `QmGalacticCommon001Hash` - Reemplazar con hash real
- `QmDragonLegendary042Hash` - Reemplazar con hash real
- etc.

### Validación
Todos los ejemplos pasan validación JSON y cumplen con:
- Estándares de metadata de OpenSea
- Estructura de atributos correcta
- Tipos de display apropiados
- Coherencia de stats y habilidades

### Extensibilidad
Los ejemplos pueden ser extendidos para:
- Crear más combinaciones de tipo/rareza
- Añadir nuevas familias
- Implementar nuevas habilidades
- Integrar con sistemas de gameplay

---

Estos ejemplos proporcionan una base sólida para entender la diversidad y complejidad del sistema Protocol Guardians, mostrando cómo cada Guardian es único mientras mantiene coherencia con el ecosistema general.
