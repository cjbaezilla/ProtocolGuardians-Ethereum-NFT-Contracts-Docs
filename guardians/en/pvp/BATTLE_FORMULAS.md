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

```
critical_chance = attacker.critical / 100  (percentage)
```

**Example**:
- Critical Stat: 250
- Critical Chance: 250 / 100 = 2.5%

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

### Type Advantages (10 types)

Each type beats 2 types and is weak to 2 types:

- **Type 0** beats Types 1, 2 (weak to 3, 4)
- **Type 1** beats Types 3, 4 (weak to 5, 6)
- **Type 2** beats Types 5, 6 (weak to 7, 8)
- **Type 3** beats Types 7, 8 (weak to 9, 0)
- **Type 4** beats Types 9, 0 (weak to 1, 2)
- **Type 5** beats Types 1, 2 (weak to 3, 4)
- **Type 6** beats Types 3, 4 (weak to 5, 6)
- **Type 7** beats Types 5, 6 (weak to 7, 8)
- **Type 8** beats Types 7, 8 (weak to 9, 0)
- **Type 9** beats Types 9, 0 (weak to 1, 2)

### Checking Type Advantage

```python
def has_type_advantage(attacker_type, defender_type):
    winning_types = TYPE_ADVANTAGES[attacker_type]
    return defender_type in winning_types
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

## Example Battle Calculation

### Setup
- Card A: Power=500, Defense=200, HP=1000, Speed=100, Critical=250, Luck=150, Type=0
- Card B: Power=450, Defense=250, HP=1200, Speed=90, Critical=200, Luck=100, Type=1

### Turn 1: Card A attacks Card B

1. **Speed Check**: Card A (100) > Card B (90), Card A attacks first
2. **Dodge Check**: random(0,1000) = 300, Card B luck=100, no dodge (300 >= 100)
3. **Base Damage**: 500 - (250/2) = 375
4. **Critical Check**: random(0,1000) = 150, Card A critical=250, critical hit! (150 < 250)
5. **Critical Damage**: 375 * 2 = 750
6. **Type Check**: Type 0 vs Type 1, Type 0 has advantage
7. **Final Damage**: 750 * 1.15 = 862.5 → 862
8. **HP Update**: Card B HP = 1200 - 862 = 338

### Turn 2: Card B attacks Card A

1. **Dodge Check**: random(0,1000) = 200, Card A luck=150, no dodge
2. **Base Damage**: 450 - (200/2) = 350
3. **Critical Check**: random(0,1000) = 300, Card B critical=200, no critical
4. **Type Check**: Type 1 vs Type 0, Type 1 has disadvantage
5. **Final Damage**: 350 * 0.85 = 297.5 → 297
6. **HP Update**: Card A HP = 1000 - 297 = 703

## ELO Calculation

### ELO Change Formula

```
elo_change = base_change * (1 + (opponent_elo - my_elo) / 400)
```

Where:
- base_change = ±20 (depends on win/loss)
- Larger ELO difference = smaller changes

**Example**:
- My ELO: 1200
- Opponent ELO: 1000
- I win: ELO change = 20 * (1 + (1000 - 1200) / 400) = 20 * 0.5 = 10 points gained

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
- critical_chance = attacker.critical / 100

### Expected Survivability

```
expected_turns_to_kill = defender.hp / expected_damage
```

## Notes

- All calculations use integer arithmetic (rounded down)
- Random values are deterministic per block
- Stats are immutable from NFT metadata
- Battle results are deterministic given the same inputs
