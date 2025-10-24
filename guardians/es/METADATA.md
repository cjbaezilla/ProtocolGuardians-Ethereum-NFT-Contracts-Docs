# Documentación de Estándares de Metadata

## Resumen

La colección Protocol Guardians sigue los estándares de metadata de OpenSea para asegurar compatibilidad completa con marketplaces y dApps. Este documento explica todos los campos de metadata, tipos de atributos y proporciona snippets de código para parsing e integración.

## Campos de Metadata Centrales

### Campos Requeridos

#### `name`
**Tipo**: String
**Descripción**: El nombre del Guardian con número de edición
**Ejemplo**: `"GALACTIC GUARDIAN #007"`
**Display en OpenSea**: Título principal

#### `description`
**Tipo**: String
**Descripción**: Historia de fondo de 300-500 palabras con jerga crypto y lore de Ethereum
**Ejemplo**: `"Nacida de las profundidades primordiales de Ethereum..."`
**Display en OpenSea**: Sección de descripción

#### `image`
**Tipo**: String (URL)
**Descripción**: URL IPFS a la imagen del Guardian
**Ejemplo**: `"ipfs://QmTy8w65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStJb"`
**Display en OpenSea**: Imagen principal

#### `external_url`
**Tipo**: String (URL)
**Descripción**: Enlace a dApp o sitio web de la colección
**Ejemplo**: `"https://protocolguardians.com/guardian/7"`
**Display en OpenSea**: Botón de enlace externo

#### `background_color`
**Tipo**: String (Hex)
**Descripción**: Color de fondo basado en rareza (sin prefijo #)
**Ejemplo**: `"FFD700"` (Dorado para Legendary)
**Display en OpenSea**: Color de fondo

### Campos Opcionales

#### `animation_url`
**Tipo**: String (URL)
**Descripción**: URL a contenido animado (videos, modelos 3D, etc.)
**Ejemplo**: `"ipfs://QmAnimatedContentHash"`
**Display en OpenSea**: Contenido animado

#### `attributes`
**Tipo**: Array de Objetos
**Descripción**: Array de objetos trait con estructura compatible con OpenSea
**Display en OpenSea**: Sección de traits

## Estructura de Atributos

### Atributos Estándar

#### Stats (Numérico con Display Type)
```json
{
  "trait_type": "Power",
  "value": 1575,
  "display_type": "number",
  "max_value": 3000
}
```

#### Tipo y Familia (String)
```json
{
  "trait_type": "Type",
  "value": "Galactic ⭐"
},
{
  "trait_type": "Family",
  "value": "Guardians"
}
```

#### Rareza y Edición (String)
```json
{
  "trait_type": "Rarity",
  "value": "Legendary"
},
{
  "trait_type": "Edition",
  "value": "007/100"
}
```

### Atributos de Habilidades (Formato Dual)

#### Formato Human-Readable
```json
{
  "trait_type": "Ability: DIMENSION HOP",
  "value": "Reduces expedition duration by 25% for 6 hours"
}
```

#### Formato Estructurado
```json
{
  "trait_type": "Ability: DIMENSION HOP",
  "value": "DIMENSION HOP",
  "ability_data": {
    "effect": "utility",
    "target": "party",
    "stat_affected": "duration",
    "value": 25,
    "duration": 21600,
    "cooldown": 259200,
    "min_rarity": "rare",
    "family": "universal"
  }
}
```

## Tipos de Display de OpenSea

### `number`
Para stats numéricos con valores máximos
```json
{
  "trait_type": "Power",
  "value": 1575,
  "display_type": "number",
  "max_value": 3000
}
```

### `boost_number`
Para bonificaciones numéricas
```json
{
  "trait_type": "Speed Bonus",
  "value": 250,
  "display_type": "boost_number"
}
```

### `boost_percentage`
Para bonificaciones porcentuales
```json
{
  "trait_type": "Critical Bonus",
  "value": 15,
  "display_type": "boost_percentage"
}
```

### `date`
Para fechas (timestamps Unix)
```json
{
  "trait_type": "Mint Date",
  "value": 1678886400,
  "display_type": "date"
}
```

### `hidden`
Para atributos que no se muestran en OpenSea
```json
{
  "trait_type": "Internal ID",
  "value": "guardian_007_galactic_guardian",
  "display_type": "hidden"
}
```

## Estructura Completa de Metadata

### Ejemplo de Metadata Completa
```json
{
  "name": "GALACTIC GUARDIAN #007",
  "description": "From the primordial depths of Ethereum's genesis block, where the first smart contracts were forged in digital fire, emerges the CELESTIAL DRAGON ASCENSION - a guardian whose very existence defies the boundaries between proof-of-work and proof-of-stake, a true OG who witnessed the most legendary event in crypto history. This Epic Ancient entity didn't just survive The Merge (September 2022); it transcended reality itself during that fateful moment when block 15537393 changed everything forever. WAGMI, ser.\n\nIn the exact nanosecond when Ethereum transitioned from STATIC to DYNAMIC, when the old ways of mining gave way to the new era of staking, this guardian experienced the ultimate ascension. Its skin, once mortal flesh, transformed into celestial azure blue, shimmering with the infinite wisdom of protocols that span eons. Its wings, forged from the very essence of Ethereum's revolutionary architecture, now beat with the rhythm of decentralized possibility. But perhaps most importantly, this Guardian carries the wisdom of OG Ethereum builders who shaped the very foundation of our digital future.",
  "image": "ipfs://Qme7ss3ARVgaiUZx1W1G2GFMHFyqgtzV6XgWddvymtLd",
  "external_url": "https://protocolguardians.com/guardian/007",
  "animation_url": "ipfs://Qme7ss3ARVgaiUZx1W1G2GFMHFyqgtzV6XgWddvymtLd",
  "background_color": "FFD700",
  "attributes": [
    {
      "trait_type": "Type",
      "value": "Galactic ⭐"
    },
    {
      "trait_type": "Family",
      "value": "Guardians"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Power",
      "value": 90,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "Defense",
      "value": 85,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "Speed",
      "value": 95,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "HP",
      "value": 80,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "Luck",
      "value": 70,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "Mana",
      "value": 100,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "Stamina",
      "value": 75,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "Critical",
      "value": 88,
      "display_type": "number",
      "max_value": 100
    },
    {
      "trait_type": "Ability: COSMIC SURGE",
      "value": "Increases party Speed by 10% for 2 hours",
      "ability_data": {
        "effect": "buff",
        "target": "party",
        "stat_affected": "speed",
        "value": 10,
        "duration": 7200,
        "cooldown": 43200,
        "min_rarity": "common",
        "family": "universal"
      }
    },
    {
      "trait_type": "Ability: PROTOCOL SHIELD",
      "value": "Provides 50% damage reduction for 6 hours",
      "ability_data": {
        "effect": "buff",
        "target": "party",
        "stat_affected": "defense",
        "value": 50,
        "duration": 21600,
        "cooldown": 172800,
        "min_rarity": "uncommon",
        "family": "guardians"
      }
    },
    {
      "trait_type": "Ability: DECENTRALIZED STRIKE",
      "value": "Increases party Power by 18% for 3 hours",
      "ability_data": {
        "effect": "buff",
        "target": "party",
        "stat_affected": "power",
        "value": 18,
        "duration": 10800,
        "cooldown": 86400,
        "min_rarity": "uncommon",
        "family": "universal"
      }
    },
    {
      "trait_type": "Mint Date",
      "value": 1678886400,
      "display_type": "date"
    },
    {
      "trait_type": "Generation",
      "value": 1,
      "display_type": "number"
    }
  ]
}
```

## Snippets de Código

### JavaScript - Parsear Metadata
```javascript
// Parsear metadata de Guardian
async function parseGuardianMetadata(tokenURI) {
  try {
    const response = await fetch(tokenURI);
    const metadata = await response.json();
    
    return {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      stats: extractStats(metadata.attributes),
      abilities: extractAbilities(metadata.attributes),
      type: extractType(metadata.attributes),
      family: extractFamily(metadata.attributes),
      rarity: extractRarity(metadata.attributes)
    };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return null;
  }
}

// Extraer stats de atributos
function extractStats(attributes) {
  const stats = {};
  const statNames = ['Power', 'Defense', 'Speed', 'HP', 'Luck', 'Mana', 'Stamina', 'Critical'];
  
  attributes.forEach(attr => {
    if (statNames.includes(attr.trait_type)) {
      stats[attr.trait_type.toLowerCase()] = attr.value;
    }
  });
  
  return stats;
}

// Extraer habilidades de atributos
function extractAbilities(attributes) {
  const abilities = [];
  
  attributes.forEach(attr => {
    if (attr.trait_type.startsWith('Ability:')) {
      abilities.push({
        name: attr.trait_type.replace('Ability: ', ''),
        description: attr.value,
        data: attr.ability_data || null
      });
    }
  });
  
  return abilities;
}

// Extraer tipo de atributos
function extractType(attributes) {
  const typeAttr = attributes.find(attr => attr.trait_type === 'Type');
  return typeAttr ? typeAttr.value : null;
}

// Extraer familia de atributos
function extractFamily(attributes) {
  const familyAttr = attributes.find(attr => attr.trait_type === 'Family');
  return familyAttr ? familyAttr.value : null;
}

// Extraer rareza de atributos
function extractRarity(attributes) {
  const rarityAttr = attributes.find(attr => attr.trait_type === 'Rarity');
  return rarityAttr ? rarityAttr.value : null;
}
```

### Solidity - Verificar Metadata
```solidity
// Verificar estructura de metadata
function verifyMetadata(string memory tokenURI) public view returns (bool) {
  // Implementar verificación de metadata
  // Verificar campos requeridos
  // Verificar estructura de atributos
  // Verificar tipos de display
  return true;
}

// Obtener stats de Guardian
function getGuardianStats(uint256 tokenId) public view returns (uint256[8] memory) {
  // Implementar obtención de stats
  // Power, Defense, Speed, HP, Luck, Mana, Stamina, Critical
  return [0, 0, 0, 0, 0, 0, 0, 0];
}
```

### Python - Análisis de Metadata
```python
import json
import requests
from typing import Dict, List, Optional

class GuardianMetadataParser:
    def __init__(self, token_uri: str):
        self.token_uri = token_uri
        self.metadata = None
    
    async def load_metadata(self) -> Dict:
        """Cargar metadata desde token URI"""
        try:
            response = requests.get(self.token_uri)
            self.metadata = response.json()
            return self.metadata
        except Exception as e:
            print(f"Error loading metadata: {e}")
            return None
    
    def get_stats(self) -> Dict[str, int]:
        """Extraer stats de la metadata"""
        if not self.metadata:
            return {}
        
        stats = {}
        stat_names = ['Power', 'Defense', 'Speed', 'HP', 'Luck', 'Mana', 'Stamina', 'Critical']
        
        for attr in self.metadata.get('attributes', []):
            if attr['trait_type'] in stat_names:
                stats[attr['trait_type'].lower()] = attr['value']
        
        return stats
    
    def get_abilities(self) -> List[Dict]:
        """Extraer habilidades de la metadata"""
        if not self.metadata:
            return []
        
        abilities = []
        for attr in self.metadata.get('attributes', []):
            if attr['trait_type'].startswith('Ability:'):
                ability = {
                    'name': attr['trait_type'].replace('Ability: ', ''),
                    'description': attr['value'],
                    'data': attr.get('ability_data')
                }
                abilities.append(ability)
        
        return abilities
    
    def get_rarity_multiplier(self) -> float:
        """Obtener multiplicador de rareza"""
        rarity_multipliers = {
            'Common': 1.0,
            'Uncommon': 1.5,
            'Rare': 2.0,
            'Epic': 2.5,
            'Legendary': 3.0,
            'Mythic': 3.5,
            'Transcendent': 4.0
        }
        
        for attr in self.metadata.get('attributes', []):
            if attr['trait_type'] == 'Rarity':
                return rarity_multipliers.get(attr['value'], 1.0)
        
        return 1.0
    
    def calculate_total_stats(self) -> int:
        """Calcular stats totales"""
        stats = self.get_stats()
        return sum(stats.values())
    
    def get_type_advantage(self, target_type: str) -> float:
        """Calcular ventaja de tipo"""
        type_advantages = {
            'Galactic': 'Cosmic',
            'Cosmic': 'Celestial',
            'Celestial': 'Mechanical',
            'Mechanical': 'Dragon',
            'Dragon': 'Beast',
            'Beast': 'Elemental',
            'Elemental': 'Chaos',
            'Chaos': 'Galactic'
        }
        
        for attr in self.metadata.get('attributes', []):
            if attr['trait_type'] == 'Type':
                guardian_type = attr['value'].split(' ')[0]  # Remover emoji
                if type_advantages.get(guardian_type) == target_type:
                    return 1.15  # 15% ventaja
                elif type_advantages.get(target_type) == guardian_type:
                    return 0.85  # 15% desventaja
                else:
                    return 1.0  # Neutral
        
        return 1.0

# Ejemplo de uso
async def main():
    parser = GuardianMetadataParser("https://api.protocolguardians.com/metadata/7")
    metadata = await parser.load_metadata()
    
    if metadata:
        stats = parser.get_stats()
        abilities = parser.get_abilities()
        total_stats = parser.calculate_total_stats()
        rarity_multiplier = parser.get_rarity_multiplier()
        
        print(f"Stats: {stats}")
        print(f"Total Stats: {total_stats}")
        print(f"Rarity Multiplier: {rarity_multiplier}")
        print(f"Abilities: {len(abilities)}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

## Integración con OpenSea

### Configuración de Colección
```json
{
  "name": "Protocol Guardians",
  "description": "Digital entities from Ethereum with unique stats, abilities, and lore",
  "image": "ipfs://QmCollectionImageHash",
  "external_link": "https://protocolguardians.com",
  "seller_fee_basis_points": 250,
  "fee_recipient": "0x..."
}
```

### Verificación de Contrato
```solidity
// Verificar contrato en OpenSea
contract ProtocolGuardians is ERC721, Ownable {
    string public constant name = "Protocol Guardians";
    string public constant symbol = "GUARD";
    string public baseURI;
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }
}
```

## Consideraciones de Implementación

### Optimización de Gas
- **Metadata On-Chain**: Para características críticas
- **Metadata Off-Chain**: Para descripciones y imágenes
- **Híbrido**: Balance entre costo y funcionalidad

### Escalabilidad
- **IPFS**: Para almacenamiento descentralizado
- **Arweave**: Para almacenamiento permanente
- **Ethereum**: Para transacciones optimizadas

### Compatibilidad
- **OpenSea**: Estándares completos
- **Rarible**: Compatibilidad extendida
- **LooksRare**: Optimizaciones específicas
- **dApps**: Integración fácil

## Mejores Prácticas

### Estructura de Metadata
1. **Campos requeridos**: Siempre incluir
2. **Atributos consistentes**: Usar nombres estándar
3. **Tipos de display**: Apropiados para OpenSea
4. **Validación**: Verificar estructura antes de deploy

### Optimización de Rendimiento
1. **Caché**: Implementar caché para metadata
2. **Compresión**: Optimizar imágenes y contenido
3. **CDN**: Usar CDN para entrega rápida
4. **Lazy Loading**: Cargar contenido bajo demanda

### Seguridad
1. **Validación**: Verificar URLs y contenido
2. **Sanitización**: Limpiar entrada de usuario
3. **Autenticación**: Proteger endpoints de metadata
4. **Rate Limiting**: Prevenir abuso de API

---

Esta documentación proporciona todo lo necesario para implementar metadata compatible con OpenSea para la colección Protocol Guardians. Los snippets de código pueden ser adaptados para diferentes lenguajes y frameworks según las necesidades específicas del proyecto.
