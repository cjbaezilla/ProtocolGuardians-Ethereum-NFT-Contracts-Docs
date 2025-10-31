# Battle Formulas Reference

## Overview

This document provides detailed formulas and calculations used in Protocol Guardians PvP battles.

## Damage Calculation

### Base Damage Formula

```
damage = attacker.power - (defender.defense / 2)
```

**Minimum Damage**: Always at least 1 point of damage

**Example**:
- Attacker Power: 500
- Defender Defense: 200
- Damage: 500 - (200 / 2) = 400 damage

### Type Advantage Modifier

```
advantage_modifier = 1.15  (for type advantage)
disadvantage_modifier = 0.85  (for type disadvantage)
neutral_modifier = 1.0  (no advantage)
```

**Final Damage with Type**:
```
final_damage = base_damage * type_modifier
```

**Example**:
- Base Damage: 400
- Type Advantage: 400 * 1.15 = 460 damage
- Type Disadvantage: 400 * 0.85 = 340 damage

## Critical Hit Calculation

### Critical Hit Chance

The critical hit chance is calculated using a base 1000 system:
```
critical_chance = attacker.critical / 1000  (percentage as decimal)
critical_chance_percentage = (attacker.critical / 1000) * 100
```

**Example**:
- Critical Stat: 250
- Critical Chance: 250 / 1000 = 0.25 = 25%

### Critical Hit Damage

```
critical_damage = base_damage * 2
```

**Example**:
- Base Damage: 400
- Critical Damage: 400 * 2 = 800 damage

## Dodge/Evasion Calculation

### Dodge Chance

```
dodge_chance = defender.luck / 100  (percentage)
```

**Example**:
- Luck Stat: 150
- Dodge Chance: 150 / 100 = 1.5%

### Dodge Result

If dodge successful: Damage = 0
If dodge fails: Normal damage applies

## Turn Order

### Speed Sorting

Cards sorted by Speed stat (highest first)

**Same Speed**: Random order

## Complete Damage Flow

### Step-by-Step Calculation

1. **Check Dodge**
   ```
   random_value = random(0, 1000)
   if random_value < defender.luck:
       damage = 0  (attack misses)
       end
   ```

2. **Calculate Base Damage**
   ```
   base_damage = max(attacker.power - (defender.defense / 2), 1)
   ```

3. **Check Critical Hit**
   ```
   random_value = random(0, 1000)
   if random_value < attacker.critical:
       base_damage = base_damage * 2
   ```
   
   **Note**: The random value ranges from 0-1000, and the critical stat is compared directly against this range. For example, a critical stat of 250 means a 25% chance (250 out of 1000 possible values).

4. **Apply Type Advantage**
   ```
   if has_type_advantage:
       base_damage = base_damage * 1.15
   elif has_type_disadvantage:
       base_damage = base_damage * 0.85
   ```

5. **Apply Damage to Defender**
   ```
   defender.hp = defender.hp - base_damage
   ```

## Health Points (HP)

### Initial HP

HP is a card's stat from metadata, immutable per NFT.

### HP Reduction

```
current_hp = current_hp - final_damage
```

### Death Condition

```
if current_hp <= 0:
    card is defeated
```

## Type System

### Type Wheel (Circular Advantage System)

Protocol Guardians features 8 distinct types arranged in a circular advantage system, where each type is strong against one other type and weak against another:

- **Galactic ⭐** beats **Cosmic 🌌** (weak to **Chaos 💀**)
- **Cosmic 🌌** beats **Celestial ☄️** (weak to **Galactic ⭐**)
- **Celestial ☄️** beats **Mechanical 🤖** (weak to **Cosmic 🌌**)
- **Mechanical 🤖** beats **Dragon 🐉** (weak to **Celestial ☄️**)
- **Dragon 🐉** beats **Beast 🦁** (weak to **Mechanical 🤖**)
- **Beast 🦁** beats **Elemental 🔥** (weak to **Dragon 🐉**)
- **Elemental 🔥** beats **Chaos 💀** (weak to **Beast 🦁**)
- **Chaos 💀** beats **Galactic ⭐** (weak to **Elemental 🔥**)

### Type Effectiveness

| Attacker | Galactic | Cosmic | Celestial | Mechanical | Dragon | Beast | Elemental | Chaos |
|----------|----------|--------|-----------|------------|--------|-------|-----------|-------|
| **Galactic ⭐** | 100% | 115% | 85% | 100% | 100% | 100% | 100% | 100% |
| **Cosmic 🌌** | 85% | 100% | 115% | 100% | 100% | 100% | 100% | 100% |
| **Celestial ☄️** | 100% | 85% | 100% | 115% | 100% | 100% | 100% | 100% |
| **Mechanical 🤖** | 100% | 100% | 85% | 100% | 115% | 100% | 100% | 100% |
| **Dragon 🐉** | 100% | 100% | 100% | 85% | 100% | 115% | 100% | 100% |
| **Beast 🦁** | 100% | 100% | 100% | 100% | 85% | 100% | 115% | 100% |
| **Elemental 🔥** | 100% | 100% | 100% | 100% | 100% | 85% | 100% | 115% |
| **Chaos 💀** | 115% | 100% | 100% | 100% | 100% | 100% | 85% | 100% |

### Checking Type Advantage

```python
def has_type_advantage(attacker_type, defender_type):
    # Circular advantage system mapping
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
    return type_advantages.get(attacker_type) == defender_type

def has_type_disadvantage(attacker_type, defender_type):
    # Reverse lookup for disadvantage
    return has_type_advantage(defender_type, attacker_type)
```

## Randomness Generation

### Seed Generation

```
seed = keccak256(block.timestamp || block.prevrandao || challenge_id)
```

### Random Number Generation

```
random_value = (seed + card_index + turn_number) % 1000
```

## Win Conditions

### Victory Condition

```
all_opponent_cards.hp <= 0
```

### Turn Limit

```
if turns > 50:
    winner = team_with_most_total_hp()
```

### Total HP Calculation

```
team_total_hp = sum(all_cards.hp)
```

## Example Battle Calculations

### Example 1: 1v1 Battle

### Setup
- Card A: Power=500, Defense=200, HP=1000, Speed=100, Critical=250, Luck=150, Type=Galactic ⭐
- Card B: Power=450, Defense=250, HP=1200, Speed=90, Critical=200, Luck=100, Type=Cosmic 🌌

### Turn 1: Card A (Galactic) attacks Card B (Cosmic)

1. **Speed Check**: Card A (100) > Card B (90), Card A attacks first
2. **Dodge Check**: random(0,1000) = 300, Card B luck=100, no dodge (300 >= 100)
3. **Base Damage**: 500 - (250/2) = 375
4. **Critical Check**: random(0,1000) = 150, Card A critical=250, critical hit! (150 < 250 = 25% chance)
5. **Critical Damage**: 375 * 2 = 750
6. **Type Check**: Galactic ⭐ vs Cosmic 🌌, Galactic has advantage (Galactic > Cosmic)
7. **Final Damage**: 750 * 1.15 = 862.5 → 862
8. **HP Update**: Card B HP = 1200 - 862 = 338

### Turn 2: Card B (Cosmic) attacks Card A (Galactic)

1. **Dodge Check**: random(0,1000) = 200, Card A luck=150, no dodge
2. **Base Damage**: 450 - (200/2) = 350
3. **Critical Check**: random(0,1000) = 300, Card B critical=200, no critical
4. **Type Check**: Cosmic 🌌 vs Galactic ⭐, Cosmic has disadvantage (Cosmic is weak to Galactic)
5. **Final Damage**: 350 * 0.85 = 297.5 → 297
6. **HP Update**: Card A HP = 1000 - 297 = 703

### Example 2: 3v3 Battle

**Setup:**
- **Team A**: 
  - Card A1: Power=600, Defense=250, HP=1200, Speed=150, Critical=300, Luck=200, Type=Galactic ⭐
  - Card A2: Power=550, Defense=300, HP=1400, Speed=120, Critical=250, Luck=150, Type=Mechanical 🤖
  - Card A3: Power=500, Defense=200, HP=1000, Speed=100, Critical=200, Luck=100, Type=Dragon 🐉
- **Team B**:
  - Card B1: Power=580, Defense=280, HP=1300, Speed=140, Critical=280, Luck=180, Type=Cosmic 🌌
  - Card B2: Power=520, Defense=320, HP=1500, Speed=110, Critical=220, Luck=120, Type=Celestial ☄️
  - Card B3: Power=480, Defense=250, HP=1100, Speed=90, Critical=180, Luck=80, Type=Beast 🦁

**Turn 1: Card A1 (Galactic, Speed=150) attacks Card B1 (Cosmic, Speed=140)**
1. Speed Check: A1 (150) > B1 (140), A1 attacks first
2. Dodge Check: random(0,1000) = 250, B1 luck=180, no dodge (250 >= 180)
3. Base Damage: 600 - (280/2) = 600 - 140 = 460
4. Critical Check: random(0,1000) = 200, A1 critical=300, critical hit! (200 < 300 = 30% chance)
5. Critical Damage: 460 * 2 = 920
6. Type Check: Galactic ⭐ vs Cosmic 🌌, Galactic has advantage (Galactic > Cosmic)
7. Final Damage: 920 * 1.15 = 1058
8. HP Update: Card B1 HP = 1300 - 1058 = 242

**Turn 2: Card B1 (Cosmic, Speed=140) attacks Card A1 (Galactic, Speed=150)**
1. Dodge Check: random(0,1000) = 150, A1 luck=200, dodge! (150 < 200 = 20% chance)
2. Damage: 0 (attack misses)

**Turn 3: Card A2 (Mechanical, Speed=120) attacks Card B2 (Celestial, Speed=110)**
1. Speed Check: A2 (120) > B2 (110), A2 attacks first
2. Dodge Check: random(0,1000) = 300, B2 luck=120, no dodge (300 >= 120)
3. Base Damage: 550 - (320/2) = 550 - 160 = 390
4. Critical Check: random(0,1000) = 300, A2 critical=250, no critical (300 >= 250)
5. Type Check: Mechanical 🤖 vs Celestial ☄️, Mechanical has disadvantage (Celestial > Mechanical)
6. Final Damage: 390 * 0.85 = 331.5 → 331
7. HP Update: Card B2 HP = 1500 - 331 = 1169

**Battle continues alternating turns until one team is eliminated...**

## ELO Calculation

### ELO Change Formula

```
elo_change = base_change * (1 + (opponent_elo - my_elo) / 400)
```

Where:
- base_change = ±20 (positive for win, negative for loss)
- opponent_elo = Opponent's current ELO rating
- my_elo = Player's current ELO rating
- Larger ELO difference = smaller point changes (prevents farming)

### Detailed ELO Examples

**Example 1: Winning Against Higher ELO**
- My ELO: 1000
- Opponent ELO: 1200
- Result: I win
- Calculation: `20 * (1 + (1200 - 1000) / 400) = 20 * (1 + 0.5) = 20 * 1.5 = 30 points`
- New ELO: 1030 (+30 points)
- **Explanation**: Beating a higher ELO opponent gives more points

**Example 2: Losing Against Lower ELO**
- My ELO: 1200
- Opponent ELO: 1000
- Result: I lose
- Calculation: `-20 * (1 + (1000 - 1200) / 400) = -20 * (1 - 0.5) = -20 * 0.5 = -10 points`
- New ELO: 1190 (-10 points)
- **Explanation**: Losing to a lower ELO opponent costs fewer points

**Example 3: Winning Against Similar ELO**
- My ELO: 1100
- Opponent ELO: 1120
- Result: I win
- Calculation: `20 * (1 + (1120 - 1100) / 400) = 20 * (1 + 0.05) = 20 * 1.05 = 21 points`
- New ELO: 1121 (+21 points)
- **Explanation**: Close matchups give moderate point changes

**Example 4: Losing Against Higher ELO**
- My ELO: 1000
- Opponent ELO: 1300
- Result: I lose
- Calculation: `-20 * (1 + (1300 - 1000) / 400) = -20 * (1 + 0.75) = -20 * 1.75 = -35 points`
- New ELO: 965 (-35 points)
- **Explanation**: Large skill gap means larger point loss when losing

**Example 5: Winning Against Much Lower ELO**
- My ELO: 1500
- Opponent ELO: 1100
- Result: I win
- Calculation: `20 * (1 + (1100 - 1500) / 400) = 20 * (1 - 1.0) = 20 * 0 = 0 points`
- New ELO: 1500 (0 points)
- **Explanation**: Beating much weaker opponents gives minimal/no points (prevents farming)

## XP Calculation

### XP Rewards

```
winner_xp = 50
loser_xp = 20
```

### Level Calculation

```
level = (total_xp / 100) + 1
```

## Statistical Properties

### Expected Damage (Per Turn)

```
expected_damage = base_damage * (1 + type_bonus) * (1 + critical_chance)
```

Where:
- type_bonus = 0.15 if advantage, -0.15 if disadvantage, 0 if neutral
- critical_chance = attacker.critical / 1000 (base 1000 system)

### Expected Survivability

```
expected_turns_to_kill = defender.hp / expected_damage
```

## Notes

- All calculations use integer arithmetic (rounded down)
- Random values are deterministic per block (using block.timestamp, block.prevrandao, and challenge_id as seed)
- Stats are immutable from NFT metadata
- Battle results are deterministic given the same inputs
- **Critical Hit System**: Uses base 1000 where critical stat value directly represents chances out of 1000 (e.g., 250 = 25% chance)
- **Dodge System**: Uses base 1000 where luck stat value directly represents chances out of 1000 (e.g., 150 = 15% chance)
