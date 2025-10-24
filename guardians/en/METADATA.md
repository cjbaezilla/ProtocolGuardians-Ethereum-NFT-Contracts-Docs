# Metadata Standards Documentation

## Overview

The Protocol Guardians collection follows OpenSea metadata standards to ensure full compatibility with marketplaces and dApps. This document explains all metadata fields, attribute types, and provides code snippets for parsing and integration.

## Core Metadata Fields

### Required Fields

#### `name`
**Type**: String
**Description**: The name of the Guardian with edition number
**Example**: `"GALACTIC GUARDIAN #007"`
**OpenSea Display**: Primary title

#### `description`
**Type**: String
**Description**: 300-500 word backstory with crypto lingo and Ethereum lore
**Example**: `"Born from the primordial depths of Ethereum's genesis block..."`
**OpenSea Display**: Description section

#### `image`
**Type**: String (URL)
**Description**: IPFS URL to the Guardian image
**Example**: `"ipfs://QmTy8w65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStJb"`
**OpenSea Display**: Main image

#### `external_url`
**Type**: String (URL)
**Description**: Link to dApp or collection website
**Example**: `"https://dapp.com/guardian/7"`
**OpenSea Display**: External link button

#### `background_color`
**Type**: String (Hex)
**Description**: Background color based on rarity (no # prefix)
**Example**: `"FFD700"` (Gold for Legendary)
**OpenSea Display**: Background color

### Optional Fields

#### `animation_url`
**Type**: String (URL)
**Description**: URL to animated content (videos, 3D models, etc.)
**Example**: `"ipfs://QmAnimatedContentHash"`
**OpenSea Display**: Animated content

#### `attributes`
**Type**: Array of Objects
**Description**: Array of trait objects with OpenSea-compatible structure
**OpenSea Display**: Traits section

## Attribute Structure

### Standard Attributes

#### Stats (Numeric with Display Type)
```json
{
  "trait_type": "Power",
  "value": 1575,
  "display_type": "number",
  "max_value": 3000
}
```

#### Type and Family (String)
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

#### Rarity and Edition (String)
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

### Ability Attributes (Dual Format)

#### Human-Readable Format
```json
{
  "trait_type": "Ability: DIMENSION HOP",
  "value": "Reduces expedition duration by 25% for 6 hours"
}
```

#### Machine-Readable Format
```json
{
  "trait_type": "Ability: DIMENSION HOP",
  "value": "Reduces expedition duration by 25% for 6 hours",
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

### Hidden Attributes
```json
{
  "trait_type": "Mint Date",
  "value": 1700000000,
  "display_type": "hidden"
},
{
  "trait_type": "Generation",
  "value": "Genesis",
  "display_type": "hidden"
}
```

## Display Types

### `number`
**Description**: Numeric value with progress bar
**Usage**: Stats (Power, Defense, Speed, etc.)
**Example**:
```json
{
  "trait_type": "Power",
  "value": 1575,
  "display_type": "number",
  "max_value": 3000
}
```

### `boost_number`
**Description**: Boost value with + prefix
**Usage**: Ability effects, bonuses
**Example**:
```json
{
  "trait_type": "Speed Boost",
  "value": 25,
  "display_type": "boost_number"
}
```

### `boost_percentage`
**Description**: Percentage boost with % suffix
**Usage**: Percentage bonuses
**Example**:
```json
{
  "trait_type": "Critical Boost",
  "value": 15,
  "display_type": "boost_percentage"
}
```

### `date`
**Description**: Unix timestamp as date
**Usage**: Mint dates, timestamps
**Example**:
```json
{
  "trait_type": "Mint Date",
  "value": 1700000000,
  "display_type": "date"
}
```

### `hidden`
**Description**: Hidden from OpenSea display
**Usage**: Internal data, metadata
**Example**:
```json
{
  "trait_type": "Generation",
  "value": "Genesis",
  "display_type": "hidden"
}
```

## Complete Metadata Example

```json
{
  "name": "GALACTIC GUARDIAN #007",
  "description": "Born from the primordial depths of Ethereum's genesis block, where the first smart contracts were forged in digital fire, emerges the CELESTIAL DRAGON ASCENSION - a guardian whose very existence defies the boundaries between proof-of-work and proof-of-stake, a true OG who witnessed the most legendary event in crypto history. This Epic Ancient entity didn't just survive The Merge (September 2022); it transcended reality itself during that fateful moment when block 15537393 changed everything forever. WAGMI, ser.\n\nIn the exact nanosecond when Ethereum transitioned from STATIC to DYNAMIC, when the old ways of mining gave way to the new era of staking, this guardian experienced the ultimate ascension. Its skin, once mortal flesh, transformed into celestial azure blue, shimmering with the infinite wisdom of protocols that span eons. Its wings, forged from the very essence of Ethereum's revolutionary architecture, now beat with the rhythm of decentralized possibility. But perhaps most importantly, this Guardian carries the wisdom of OG Ethereum builders who shaped the very foundation of our digital future.",
  "image": "ipfs://QmTy8w65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStJb",
  "external_url": "https://dapp.com/guardian/7",
  "background_color": "FFD700",
  "attributes": [
    {
      "trait_type": "Power",
      "value": 1575,
      "display_type": "number",
      "max_value": 3000
    },
    {
      "trait_type": "Defense",
      "value": 1050,
      "display_type": "number",
      "max_value": 3000
    },
    {
      "trait_type": "Speed",
      "value": 2625,
      "display_type": "number",
      "max_value": 3000
    },
    {
      "trait_type": "HP",
      "value": 840,
      "display_type": "number",
      "max_value": 3000
    },
    {
      "trait_type": "Luck",
      "value": 525,
      "display_type": "number",
      "max_value": 3000
    },
    {
      "trait_type": "Mana",
      "value": 2100,
      "display_type": "number",
      "max_value": 3000
    },
    {
      "trait_type": "Stamina",
      "value": 210,
      "display_type": "number",
      "max_value": 3000
    },
    {
      "trait_type": "Critical",
      "value": 1575,
      "display_type": "number",
      "max_value": 3000
    },
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
      "trait_type": "Edition",
      "value": "007/100"
    },
    {
      "trait_type": "Ability: DIMENSION HOP",
      "value": "Reduces expedition duration by 25% for 6 hours",
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
    },
    {
      "trait_type": "Ability: GUARDIAN'S WARD",
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
      "trait_type": "Ability: COSMIC AWARENESS",
      "value": "Reveals hidden expedition bonuses for 24 hours",
      "ability_data": {
        "effect": "utility",
        "target": "party",
        "stat_affected": "bonus_revelation",
        "value": 100,
        "duration": 86400,
        "cooldown": 604800,
        "min_rarity": "epic",
        "family": "universal"
      }
    },
    {
      "trait_type": "Mission Duration",
      "value": 7200,
      "display_type": "number"
    },
    {
      "trait_type": "Mint Date",
      "value": 1700000000,
      "display_type": "hidden"
    },
    {
      "trait_type": "Generation",
      "value": "Genesis",
      "display_type": "hidden"
    }
  ]
}
```

## Code Snippets

### JavaScript: Parse Metadata

```javascript
// Parse Guardian metadata from tokenURI
async function parseGuardianMetadata(tokenURI) {
  try {
    const response = await fetch(tokenURI);
    const metadata = await response.json();
    
    return {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      external_url: metadata.external_url,
      background_color: metadata.background_color,
      attributes: metadata.attributes,
      stats: extractStats(metadata.attributes),
      abilities: extractAbilities(metadata.attributes),
      rarity: extractRarity(metadata.attributes),
      type: extractType(metadata.attributes),
      family: extractFamily(metadata.attributes)
    };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return null;
  }
}

// Extract stats from attributes
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

// Extract abilities from attributes
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

// Extract rarity from attributes
function extractRarity(attributes) {
  const rarityAttr = attributes.find(attr => attr.trait_type === 'Rarity');
  return rarityAttr ? rarityAttr.value : 'Unknown';
}

// Extract type from attributes
function extractType(attributes) {
  const typeAttr = attributes.find(attr => attr.trait_type === 'Type');
  return typeAttr ? typeAttr.value : 'Unknown';
}

// Extract family from attributes
function extractFamily(attributes) {
  const familyAttr = attributes.find(attr => attr.trait_type === 'Family');
  return familyAttr ? familyAttr.value : 'Unknown';
}
```

### JavaScript: Calculate Total Stats

```javascript
// Calculate total stats for a Guardian
function calculateTotalStats(metadata) {
  const stats = extractStats(metadata.attributes);
  const statNames = ['power', 'defense', 'speed', 'hp', 'luck', 'mana', 'stamina', 'critical'];
  
  let total = 0;
  statNames.forEach(stat => {
    if (stats[stat]) {
      total += parseInt(stats[stat]);
    }
  });
  
  return total;
}

// Calculate rarity multiplier
function calculateRarityMultiplier(rarity) {
  const multipliers = {
    'Common': 1.0,
    'Uncommon': 1.5,
    'Rare': 2.0,
    'Epic': 2.5,
    'Legendary': 3.0,
    'Mythic': 3.5,
    'Transcendent': 4.0
  };
  
  return multipliers[rarity] || 1.0;
}
```

### JavaScript: Validate Metadata

```javascript
// Validate metadata structure
function validateMetadata(metadata) {
  const requiredFields = ['name', 'description', 'image', 'attributes'];
  const errors = [];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!metadata[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Check attributes structure
  if (metadata.attributes && Array.isArray(metadata.attributes)) {
    metadata.attributes.forEach((attr, index) => {
      if (!attr.trait_type || !attr.value) {
        errors.push(`Invalid attribute at index ${index}: missing trait_type or value`);
      }
    });
  } else {
    errors.push('Attributes must be an array');
  }
  
  // Check image URL format
  if (metadata.image && !metadata.image.startsWith('ipfs://')) {
    errors.push('Image URL must be IPFS format (ipfs://)');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}
```

### Solidity: On-Chain Metadata

```solidity
// Example: On-chain metadata generation
contract GuardiansMetadata {
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        Guardian memory guardian = guardians[tokenId];
        
        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name":"', guardian.name, '",',
                    '"description":"', guardian.description, '",',
                    '"image":"', guardian.image, '",',
                    '"external_url":"', guardian.externalUrl, '",',
                    '"background_color":"', guardian.backgroundColor, '",',
                    '"attributes":[',
                    generateAttributes(guardian),
                    ']}'
                )
            )
        );
        
        return string.concat("data:application/json;base64,", json);
    }
    
    function generateAttributes(Guardian memory guardian) internal pure returns (string memory) {
        return string.concat(
            '{"trait_type":"Power","value":', guardian.power, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"Defense","value":', guardian.defense, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"Speed","value":', guardian.speed, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"HP","value":', guardian.hp, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"Luck","value":', guardian.luck, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"Mana","value":', guardian.mana, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"Stamina","value":', guardian.stamina, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"Critical","value":', guardian.critical, ',"display_type":"number","max_value":3000},',
            '{"trait_type":"Type","value":"', guardian.type, '"},',
            '{"trait_type":"Family","value":"', guardian.family, '"},',
            '{"trait_type":"Rarity","value":"', guardian.rarity, '"},',
            '{"trait_type":"Edition","value":"', guardian.edition, '"}'
        );
    }
}
```

### Python: Metadata Analysis

```python
import json
import requests
from typing import Dict, List, Optional

class GuardiansMetadataParser:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def fetch_metadata(self, token_id: int) -> Optional[Dict]:
        """Fetch metadata for a specific token ID"""
        try:
            url = f"{self.base_url}/token/{token_id}"
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching metadata for token {token_id}: {e}")
            return None
    
    def parse_stats(self, attributes: List[Dict]) -> Dict[str, int]:
        """Extract stats from attributes"""
        stats = {}
        stat_names = ['Power', 'Defense', 'Speed', 'HP', 'Luck', 'Mana', 'Stamina', 'Critical']
        
        for attr in attributes:
            if attr['trait_type'] in stat_names:
                stats[attr['trait_type'].lower()] = int(attr['value'])
        
        return stats
    
    def calculate_total_stats(self, stats: Dict[str, int]) -> int:
        """Calculate total stats for a Guardian"""
        return sum(stats.values())
    
    def get_rarity_multiplier(self, rarity: str) -> float:
        """Get rarity multiplier for a given rarity"""
        multipliers = {
            'Common': 1.0,
            'Uncommon': 1.5,
            'Rare': 2.0,
            'Epic': 2.5,
            'Legendary': 3.0,
            'Mythic': 3.5,
            'Transcendent': 4.0
        }
        return multipliers.get(rarity, 1.0)
    
    def analyze_guardian(self, token_id: int) -> Dict:
        """Complete analysis of a Guardian"""
        metadata = self.fetch_metadata(token_id)
        if not metadata:
            return None
        
        attributes = metadata.get('attributes', [])
        stats = self.parse_stats(attributes)
        total_stats = self.calculate_total_stats(stats)
        
        # Extract other attributes
        rarity = next((attr['value'] for attr in attributes if attr['trait_type'] == 'Rarity'), 'Unknown')
        guardian_type = next((attr['value'] for attr in attributes if attr['trait_type'] == 'Type'), 'Unknown')
        family = next((attr['value'] for attr in attributes if attr['trait_type'] == 'Family'), 'Unknown')
        
        return {
            'token_id': token_id,
            'name': metadata.get('name'),
            'rarity': rarity,
            'type': guardian_type,
            'family': family,
            'stats': stats,
            'total_stats': total_stats,
            'rarity_multiplier': self.get_rarity_multiplier(rarity)
        }

# Usage example
parser = GuardiansMetadataParser("https://api.protocolguardians.com")
guardian_analysis = parser.analyze_guardian(7)
print(json.dumps(guardian_analysis, indent=2))
```

## OpenSea Integration

### Collection-Level Metadata

```json
{
  "name": "Protocol Guardians Collection",
  "description": "Digital entities that transcend blockchain constraints to become living manifestations of Ethereum's onchain energy.",
  "image": "ipfs://QmCollectionImageHash",
  "external_link": "https://protocolguardians.com",
  "seller_fee_basis_points": 250,
  "fee_recipient": "0x..."
}
```

### Contract-Level Metadata

```json
{
  "name": "ProtocolGuardians",
  "description": "Protocol Guardians NFT Collection on Ethereum",
  "image": "ipfs://QmContractImageHash",
  "external_link": "https://protocolguardians.com",
  "seller_fee_basis_points": 250,
  "fee_recipient": "0x..."
}
```

## Best Practices

### 1. Metadata Optimization
- **IPFS Storage**: Use IPFS for decentralized metadata
- **Image Quality**: Minimum 3000x3000 pixels for best display
- **Compression**: Optimize images for faster loading
- **Validation**: Always validate metadata structure

### 2. Attribute Design
- **Consistent Naming**: Use consistent trait_type names
- **Display Types**: Use appropriate display types for better UX
- **Hidden Attributes**: Use hidden display type for internal data
- **Max Values**: Set appropriate max_value for progress bars

### 3. Performance
- **Caching**: Cache metadata for better performance
- **Error Handling**: Implement proper error handling
- **Validation**: Validate metadata before storage
- **Updates**: Handle metadata updates properly

### 4. Compatibility
- **OpenSea Standards**: Follow OpenSea metadata standards
- **Marketplace Support**: Ensure compatibility with all major marketplaces
- **dApp Integration**: Design for easy dApp integration
- **Future-Proofing**: Use extensible attribute structure

## Troubleshooting

### Common Issues

#### 1. Metadata Not Loading
- **Check IPFS**: Ensure IPFS URLs are accessible
- **Validate JSON**: Check for JSON syntax errors
- **CORS Issues**: Ensure proper CORS headers

#### 2. Attributes Not Displaying
- **Check Structure**: Ensure proper attribute structure
- **Display Types**: Verify display_type values
- **OpenSea Cache**: Clear OpenSea cache if needed

#### 3. Images Not Showing
- **IPFS Access**: Ensure IPFS gateway is accessible
- **Image Format**: Use supported image formats
- **Size Limits**: Check image size limits

### Debugging Tools

#### 1. Metadata Validator
```javascript
function validateMetadata(metadata) {
  const errors = [];
  
  // Check required fields
  if (!metadata.name) errors.push('Missing name');
  if (!metadata.description) errors.push('Missing description');
  if (!metadata.image) errors.push('Missing image');
  if (!metadata.attributes) errors.push('Missing attributes');
  
  // Check attributes
  if (metadata.attributes) {
    metadata.attributes.forEach((attr, index) => {
      if (!attr.trait_type) errors.push(`Attribute ${index}: missing trait_type`);
      if (!attr.value) errors.push(`Attribute ${index}: missing value`);
    });
  }
  
  return errors;
}
```

#### 2. IPFS Checker
```javascript
async function checkIPFS(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

#### 3. OpenSea Compatibility Checker
```javascript
function checkOpenSeaCompatibility(metadata) {
  const issues = [];
  
  // Check required fields
  const required = ['name', 'description', 'image', 'attributes'];
  required.forEach(field => {
    if (!metadata[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  });
  
  // Check attributes
  if (metadata.attributes) {
    metadata.attributes.forEach(attr => {
      if (!attr.trait_type || !attr.value) {
        issues.push('Invalid attribute structure');
      }
    });
  }
  
  return issues;
}
```

---

This comprehensive metadata system ensures full compatibility with OpenSea and other marketplaces while providing rich data for dApp integration and gameplay mechanics.
