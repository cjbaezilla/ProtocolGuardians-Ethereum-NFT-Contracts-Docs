// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BattleEngine
/// @notice Core battle resolution engine for PvP combat
/// @dev Implements deterministic battle simulation based on stats and type advantages
contract BattleEngine {
    /// @notice Battle result structure
    struct BattleResult {
        uint8 winner; // 0 = team1, 1 = team2, 2 = draw (impossible but defined for completeness)
        uint256 turnsPlayed;
        uint256 team1RemainingHP;
        uint256 team2RemainingHP;
    }

    /// @notice Card stats structure for battle
    struct CardStats {
        uint256 power;
        uint256 defense;
        uint256 speed;
        uint256 hp;
        uint256 luck;
        uint256 critical;
        uint8 cardType; // 0-7: Galactic, Cosmic, Celestial, Mechanical, Dragon, Beast, Elemental, Chaos
    }

    /// @notice Card structure with current HP during battle
    struct BattleCard {
        CardStats stats;
        uint256 currentHP;
        uint256 index;
        bool isAlive;
    }

    /// @notice Maximum number of turns before force conclusion
    uint256 public constant MAX_TURNS = 50;

    /// @notice Type advantage multipliers (in basis points, 10000 = 100%)
    uint256 private constant TYPE_ADVANTAGE = 11500; // 115%
    uint256 private constant TYPE_DISADVANTAGE = 8500; // 85%
    uint256 private constant TYPE_NEUTRAL = 10000; // 100%

    /// @notice Critical hit damage multiplier (2x)
    uint256 private constant CRITICAL_MULTIPLIER = 20000; // 200% in basis points

    /// @notice Event emitted when a battle is executed
    /// @param winner Winner of the battle (0 or 1)
    /// @param turns Turns played
    /// @param team1HP Team 1 remaining HP
    /// @param team2HP Team 2 remaining HP
    event BattleExecuted(uint8 winner, uint256 turns, uint256 team1HP, uint256 team2HP);

    /// @notice Simulates a battle without executing it (view function)
    /// @param team1Cards Array of cards for team 1
    /// @param team2Cards Array of cards for team 2
    /// @param seed Random seed for critical hits and dodges
    /// @return result Battle result structure
    function simulateBattle(
        CardStats[] memory team1Cards,
        CardStats[] memory team2Cards,
        uint256 seed
    ) external pure returns (BattleResult memory result) {
        return _executeBattle(team1Cards, team2Cards, seed);
    }

    /// @notice Executes a battle and returns the result
    /// @param team1Cards Array of cards for team 1
    /// @param team2Cards Array of cards for team 2
    /// @param seed Random seed for critical hits and dodges
    /// @return result Battle result structure
    function executeBattle(
        CardStats[] memory team1Cards,
        CardStats[] memory team2Cards,
        uint256 seed
    ) external returns (BattleResult memory result) {
        result = _executeBattle(team1Cards, team2Cards, seed);
        emit BattleExecuted(result.winner, result.turnsPlayed, result.team1RemainingHP, result.team2RemainingHP);
    }

    /// @notice Internal battle execution logic
    /// @param team1Cards Array of cards for team 1
    /// @param team2Cards Array of cards for team 2
    /// @param seed Random seed for critical hits and dodges
    /// @return result Battle result structure
    function _executeBattle(
        CardStats[] memory team1Cards,
        CardStats[] memory team2Cards,
        uint256 seed
    ) internal pure returns (BattleResult memory result) {
        require(team1Cards.length > 0 && team2Cards.length > 0, "BattleEngine: Teams cannot be empty");
        require(team1Cards.length == team2Cards.length, "BattleEngine: Teams must have same size");

        // Initialize battle cards with HP
        BattleCard[] memory team1 = _initializeCards(team1Cards);
        BattleCard[] memory team2 = _initializeCards(team2Cards);

        // Sort all cards by speed (initiative)
        BattleCard[] memory allCards = _mergeAndSortBySpeed(team1, team2);
        uint256 team1Size = team1.length;

        uint256 nonce = 0;
        result.turnsPlayed = 0;

        while (result.turnsPlayed < MAX_TURNS) {
            result.turnsPlayed++;

            // Each card acts in speed order
            for (uint256 i = 0; i < allCards.length; i++) {
                if (!allCards[i].isAlive) continue;

                BattleCard memory attacker = allCards[i];
                bool isTeam1Attacker = attacker.index < team1Size;

                // Select target (lowest HP alive enemy)
                BattleCard memory target = isTeam1Attacker 
                    ? _getLowestHPAlive(team2) 
                    : _getLowestHPAlive(team1);

                // No valid target found, team eliminated
                if (!target.isAlive) {
                    break;
                }

                // Calculate and apply damage
                nonce++;
                uint256 random = uint256(keccak256(abi.encodePacked(seed, nonce)));
                uint256 damage = _calculateDamage(attacker.stats, target.stats, random);
                _applyDamage(allCards, target, damage);

                // Check for team elimination
                if (!_hasAliveCards(team1)) {
                    result.winner = 1;
                    result.team1RemainingHP = 0;
                    result.team2RemainingHP = _getTotalHP(team2);
                    return result;
                }
                if (!_hasAliveCards(team2)) {
                    result.winner = 0;
                    result.team1RemainingHP = _getTotalHP(team1);
                    result.team2RemainingHP = 0;
                    return result;
                }

                // Update references
                _updateTeamReferences(allCards, team1, team2, i, team1Size);
            }
        }

        // Max turns reached - winner is team with most HP
        uint256 team1HP = _getTotalHP(team1);
        uint256 team2HP = _getTotalHP(team2);

        if (team1HP > team2HP) {
            result.winner = 0;
        } else if (team2HP > team1HP) {
            result.winner = 1;
        } else {
            // Draw (extremely rare with current damage formulas)
            result.winner = 2;
        }

        result.team1RemainingHP = team1HP;
        result.team2RemainingHP = team2HP;
        return result;
    }

    /// @notice Initialize battle cards with HP
    function _initializeCards(CardStats[] memory stats) internal pure returns (BattleCard[] memory cards) {
        cards = new BattleCard[](stats.length);
        for (uint256 i = 0; i < stats.length; i++) {
            cards[i] = BattleCard({
                stats: stats[i],
                currentHP: stats[i].hp,
                index: i,
                isAlive: true
            });
        }
        return cards;
    }

    /// @notice Merge both teams and sort by speed
    function _mergeAndSortBySpeed(
        BattleCard[] memory team1,
        BattleCard[] memory team2
    ) internal pure returns (BattleCard[] memory allCards) {
        uint256 total = team1.length + team2.length;
        allCards = new BattleCard[](total);

        // Copy team1
        for (uint256 i = 0; i < team1.length; i++) {
            allCards[i] = team1[i];
        }

        // Copy team2 with adjusted index
        for (uint256 i = 0; i < team2.length; i++) {
            allCards[team1.length + i] = team2[i];
            allCards[team1.length + i].index = team1.length + i;
        }

        // Sort by speed (bubble sort for simplicity)
        for (uint256 i = 0; i < total - 1; i++) {
            for (uint256 j = 0; j < total - i - 1; j++) {
                if (allCards[j].stats.speed < allCards[j + 1].stats.speed) {
                    BattleCard memory temp = allCards[j];
                    allCards[j] = allCards[j + 1];
                    allCards[j + 1] = temp;
                }
            }
        }

        return allCards;
    }

    /// @notice Get lowest HP alive card from team
    function _getLowestHPAlive(BattleCard[] memory team) internal pure returns (BattleCard memory) {
        BattleCard memory lowest = BattleCard({
            stats: CardStats({
                power: 0,
                defense: 0,
                speed: 0,
                hp: 0,
                luck: 0,
                critical: 0,
                cardType: 0
            }),
            currentHP: 0,
            index: 0,
            isAlive: false
        });
        bool found = false;

        for (uint256 i = 0; i < team.length; i++) {
            if (team[i].isAlive && (!found || team[i].currentHP < lowest.currentHP)) {
                lowest = team[i];
                found = true;
            }
        }

        return lowest;
    }

    /// @notice Calculate damage dealt from attacker to defender
    /// @param attacker Attacking card stats
    /// @param defender Defending card stats
    /// @param random Random number for critical/dodge checks
    /// @return damage Calculated damage
    function _calculateDamage(
        CardStats memory attacker,
        CardStats memory defender,
        uint256 random
    ) internal pure returns (uint256 damage) {
        // Check for dodge (Luck / 100 = % chance)
        uint256 dodgeChance = defender.luck / 100;
        if ((random % 10000) < dodgeChance) {
            return 0; // Dodged!
        }

        // Calculate base damage
        uint256 baseDamage = attacker.power;

        // Apply type advantage multiplier
        uint256 typeMultiplier = _getTypeMultiplier(attacker.cardType, defender.cardType);
        baseDamage = (baseDamage * typeMultiplier) / 10000;

        // Check for critical (Critical / 100 = % chance)
        uint256 critChance = attacker.critical / 100;
        uint256 damageMultiplier = 10000; // 1.0x base

        if ((random % 10000) < critChance) {
            damageMultiplier = CRITICAL_MULTIPLIER; // 2.0x critical
        }

        baseDamage = (baseDamage * damageMultiplier) / 10000;

        // Apply defense reduction (Defense / 2)
        uint256 defenseReduction = defender.defense / 2;
        
        if (baseDamage > defenseReduction) {
            damage = baseDamage - defenseReduction;
        } else {
            damage = 1; // Minimum damage
        }

        return damage;
    }

    /// @notice Get type advantage multiplier
    /// @param attackerType Type of attacking card (0-7)
    /// @param defenderType Type of defending card (0-7)
    /// @return multiplier Type advantage multiplier in basis points
    function _getTypeMultiplier(uint8 attackerType, uint8 defenderType) internal pure returns (uint256 multiplier) {
        // Type advantage matrix: Galactic > Cosmic > Celestial > Mechanical > Dragon > Beast > Elemental > Chaos > Galactic (circular)
        // Returns 115% (advantage), 85% (disadvantage), or 100% (neutral)

        if (attackerType == defenderType) {
            return TYPE_NEUTRAL;
        }

        // Galactic beats Cosmic
        if (attackerType == 0 && defenderType == 1) return TYPE_ADVANTAGE;
        if (attackerType == 1 && defenderType == 0) return TYPE_DISADVANTAGE;

        // Cosmic beats Celestial
        if (attackerType == 1 && defenderType == 2) return TYPE_ADVANTAGE;
        if (attackerType == 2 && defenderType == 1) return TYPE_DISADVANTAGE;

        // Celestial beats Mechanical
        if (attackerType == 2 && defenderType == 3) return TYPE_ADVANTAGE;
        if (attackerType == 3 && defenderType == 2) return TYPE_DISADVANTAGE;

        // Mechanical beats Dragon
        if (attackerType == 3 && defenderType == 4) return TYPE_ADVANTAGE;
        if (attackerType == 4 && defenderType == 3) return TYPE_DISADVANTAGE;

        // Dragon beats Beast
        if (attackerType == 4 && defenderType == 5) return TYPE_ADVANTAGE;
        if (attackerType == 5 && defenderType == 4) return TYPE_DISADVANTAGE;

        // Beast beats Elemental
        if (attackerType == 5 && defenderType == 6) return TYPE_ADVANTAGE;
        if (attackerType == 6 && defenderType == 5) return TYPE_DISADVANTAGE;

        // Elemental beats Chaos
        if (attackerType == 6 && defenderType == 7) return TYPE_ADVANTAGE;
        if (attackerType == 7 && defenderType == 6) return TYPE_DISADVANTAGE;

        // Chaos beats Galactic (circular)
        if (attackerType == 7 && defenderType == 0) return TYPE_ADVANTAGE;
        if (attackerType == 0 && defenderType == 7) return TYPE_DISADVANTAGE;

        return TYPE_NEUTRAL;
    }

    /// @notice Apply damage to a target card
    function _applyDamage(BattleCard[] memory allCards, BattleCard memory target, uint256 damage) internal pure {
        for (uint256 i = 0; i < allCards.length; i++) {
            if (allCards[i].index == target.index) {
                if (damage >= allCards[i].currentHP) {
                    allCards[i].currentHP = 0;
                    allCards[i].isAlive = false;
                } else {
                    allCards[i].currentHP -= damage;
                }
                break;
            }
        }
    }

    /// @notice Update team references after damage
    function _updateTeamReferences(
        BattleCard[] memory allCards,
        BattleCard[] memory team1,
        BattleCard[] memory team2,
        uint256 cardIndex,
        uint256 team1Size
    ) internal pure {
        BattleCard memory updatedCard = allCards[cardIndex];
        
        if (updatedCard.index < team1Size) {
            team1[updatedCard.index] = updatedCard;
        } else {
            team2[updatedCard.index - team1Size] = updatedCard;
        }
    }

    /// @notice Check if team has alive cards
    function _hasAliveCards(BattleCard[] memory team) internal pure returns (bool) {
        for (uint256 i = 0; i < team.length; i++) {
            if (team[i].isAlive) {
                return true;
            }
        }
        return false;
    }

    /// @notice Get total HP of alive cards in team
    function _getTotalHP(BattleCard[] memory team) internal pure returns (uint256 total) {
        for (uint256 i = 0; i < team.length; i++) {
            if (team[i].isAlive) {
                total += team[i].currentHP;
            }
        }
        return total;
    }
}
