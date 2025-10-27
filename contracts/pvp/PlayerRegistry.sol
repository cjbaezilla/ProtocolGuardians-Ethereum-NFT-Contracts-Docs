// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IProtocolGuardians.sol";

/// @title PlayerRegistry
/// @notice Registry for player profiles, formations, and matchmaking
/// @dev Manages player data, formations, ELO, XP, and matchmaking pool
contract PlayerRegistry is Ownable, ReentrancyGuard {
    /// @notice Player profile structure
    struct Player {
        string username;
        string avatarUrl;
        uint256 elo;            // Starting ELO: 1000
        uint256 xp;             // Experience points
        uint256 level;          // Current level
        uint256 wins;           // Total wins
        uint256 losses;         // Total losses
        uint256 registeredAt;   // Registration timestamp
        bool isRegistered;      // Registration status
    }

    /// @notice Player formation structure (1v1, 3v3, or 5v5)
    struct Formation {
        uint256[] tokenIds;     // NFT token IDs in the formation
        uint256 createdAt;      // When formation was created
        bool isActive;          // Whether formation is active
    }

    /// @notice Battle type enum
    enum BattleType { OneVsOne, ThreeVsThree, FiveVsFive } // 0, 1, 2

    /// @notice Matching size per battle type
    uint8 public constant FORMATION_SIZE_1V1 = 1;
    uint8 public constant FORMATION_SIZE_3V3 = 3;
    uint8 public constant FORMATION_SIZE_5V5 = 5;

    /// @notice Constants
    uint256 public constant INITIAL_ELO = 1000;
    uint256 public constant MAX_USERNAME_LENGTH = 32;
    uint256 public constant MAX_AVATAR_LENGTH = 500;
    uint256 public constant XP_PER_LEVEL = 100; // Linear: level N = N * 100 XP
    uint256 public constant MAX_OPPONENTS_RETURNED = 10;

    /// @dev ProtocolGuardians NFT contract interface
    IProtocolGuardians public immutable nftContract;

    /// @dev Mapping from player address to Player struct
    mapping(address => Player) public players;

    /// @dev Mapping from player address to formations by battle type
    mapping(address => mapping(BattleType => Formation)) public formations;

    /// @dev Mapping of usernames to addresses (for uniqueness check)
    mapping(string => address) public usernameToAddress;

    /// @dev Matchmaking pool: address => battle type => is in pool
    mapping(address => mapping(BattleType => bool)) public matchmakingPool;

    /// @dev Array of addresses in matchmaking pool for each battle type
    mapping(BattleType => address[]) public poolAddresses;

    /// @dev Track if formation is being used in a pending challenge
    mapping(address => mapping(BattleType => bool)) public formationInUse;

    /// @notice Event emitted when a player registers
    /// @param player Address of the registered player
    /// @param username Username chosen by the player
    event PlayerRegistered(address indexed player, string username);

    /// @notice Event emitted when a player updates their profile
    /// @param player Address of the player
    /// @param username New username
    /// @param avatarUrl New avatar URL
    event ProfileUpdated(address indexed player, string username, string avatarUrl);

    /// @notice Event emitted when a formation is created or updated
    /// @param player Address of the player
    /// @param battleType Type of battle formation
    /// @param tokenIds Token IDs in the formation
    event FormationSet(address indexed player, BattleType battleType, uint256[] tokenIds);

    /// @notice Event emitted when a player joins or leaves the matchmaking pool
    /// @param player Address of the player
    /// @param battleType Type of battle
    /// @param isInPool Whether player is in pool or leaving
    event MatchmakingStatusUpdated(address indexed player, BattleType battleType, bool isInPool);

    /// @notice Event emitted when formation in-use status changes
    /// @param player Address of the player
    /// @param battleType Type of battle
    /// @param inUse Whether formation is in use
    event FormationInUseUpdated(address indexed player, BattleType battleType, bool inUse);

    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "PlayerRegistry: Invalid NFT contract");
        nftContract = IProtocolGuardians(_nftContract);
    }

    /// @notice Register a new player
    /// @param username Desired username (must be unique, max 32 chars)
    /// @param avatarUrl Avatar URL (max 500 chars)
    function registerPlayer(string calldata username, string calldata avatarUrl) external nonReentrant {
        require(!players[msg.sender].isRegistered, "PlayerRegistry: Already registered");
        require(bytes(username).length > 0 && bytes(username).length <= MAX_USERNAME_LENGTH, 
            "PlayerRegistry: Invalid username length");
        require(bytes(avatarUrl).length <= MAX_AVATAR_LENGTH, "PlayerRegistry: Avatar URL too long");
        require(usernameToAddress[username] == address(0), "PlayerRegistry: Username taken");

        players[msg.sender] = Player({
            username: username,
            avatarUrl: avatarUrl,
            elo: INITIAL_ELO,
            xp: 0,
            level: 1,
            wins: 0,
            losses: 0,
            registeredAt: block.timestamp,
            isRegistered: true
        });

        usernameToAddress[username] = msg.sender;
        emit PlayerRegistered(msg.sender, username);
    }

    /// @notice Update player profile
    /// @param username New username (if changing)
    /// @param avatarUrl New avatar URL
    function updateProfile(string calldata username, string calldata avatarUrl) external nonReentrant {
        require(players[msg.sender].isRegistered, "PlayerRegistry: Not registered");
        
        // If username is changing, check if new username is available
        if (keccak256(bytes(players[msg.sender].username)) != keccak256(bytes(username))) {
            require(bytes(username).length > 0 && bytes(username).length <= MAX_USERNAME_LENGTH,
                "PlayerRegistry: Invalid username length");
            require(usernameToAddress[username] == address(0), "PlayerRegistry: Username taken");
            
            // Free old username
            delete usernameToAddress[players[msg.sender].username];
            usernameToAddress[username] = msg.sender;
        }

        require(bytes(avatarUrl).length <= MAX_AVATAR_LENGTH, "PlayerRegistry: Avatar URL too long");

        players[msg.sender].username = username;
        players[msg.sender].avatarUrl = avatarUrl;

        emit ProfileUpdated(msg.sender, username, avatarUrl);
    }

    /// @notice Set a formation for a specific battle type
    /// @param battleType Type of battle (1v1, 3v3, 5v5)
    /// @param tokenIds Array of NFT token IDs for the formation
    function setFormation(BattleType battleType, uint256[] calldata tokenIds) external nonReentrant {
        require(players[msg.sender].isRegistered, "PlayerRegistry: Not registered");
        require(!formationInUse[msg.sender][battleType], "PlayerRegistry: Formation in use");

        uint256 expectedSize = _getFormationSize(battleType);
        require(tokenIds.length == expectedSize, "PlayerRegistry: Invalid formation size");

        // Validate ownership of all NFTs
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(nftContract.ownerOf(tokenIds[i]) == msg.sender, 
                "PlayerRegistry: Not owner of NFT");
        }

        formations[msg.sender][battleType] = Formation({
            tokenIds: tokenIds,
            createdAt: block.timestamp,
            isActive: true
        });

        emit FormationSet(msg.sender, battleType, tokenIds);
    }

    /// @notice Set matchmaking status (join or leave pool)
    /// @param active Whether to join (true) or leave (false) the pool
    /// @param battleType Type of battle for matchmaking
    function setMatchmakingStatus(bool active, BattleType battleType) external {
        require(players[msg.sender].isRegistered, "PlayerRegistry: Not registered");
        require(formations[msg.sender][battleType].isActive, "PlayerRegistry: No active formation");
        
        bool currentlyInPool = matchmakingPool[msg.sender][battleType];
        
        if (active && !currentlyInPool) {
            // Join pool
            matchmakingPool[msg.sender][battleType] = true;
            poolAddresses[battleType].push(msg.sender);
            emit MatchmakingStatusUpdated(msg.sender, battleType, true);
        } else if (!active && currentlyInPool) {
            // Leave pool
            matchmakingPool[msg.sender][battleType] = false;
            _removeFromPool(battleType, msg.sender);
            emit MatchmakingStatusUpdated(msg.sender, battleType, false);
        }
    }

    /// @notice Get available opponents in ELO range
    /// @param eloMin Minimum ELO of opponents
    /// @param eloMax Maximum ELO of opponents
    /// @param battleType Type of battle
    /// @return opponents Array of opponent addresses (max 10)
    function getAvailableOpponents(
        uint256 eloMin,
        uint256 eloMax,
        BattleType battleType
    ) external view returns (address[] memory opponents) {
        address[] memory candidates = new address[](MAX_OPPONENTS_RETURNED);
        uint256 count = 0;

        address[] memory pool = poolAddresses[battleType];
        for (uint256 i = 0; i < pool.length && count < MAX_OPPONENTS_RETURNED; i++) {
            address candidate = pool[i];
            
            // Skip self
            if (candidate == msg.sender) continue;
            
            // Skip if not in pool
            if (!matchmakingPool[candidate][battleType]) continue;

            Player memory player = players[candidate];
            
            // Check ELO range and if player is registered with active formation
            if (player.isRegistered && 
                player.elo >= eloMin && 
                player.elo <= eloMax &&
                formations[candidate][battleType].isActive) {
                candidates[count] = candidate;
                count++;
            }
        }

        // Resize array to actual count
        opponents = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            opponents[i] = candidates[i];
        }

        return opponents;
    }

    /// @notice Get player profile
    /// @param player Address of the player
    /// @return Player struct
    function getPlayerProfile(address player) external view returns (Player memory) {
        return players[player];
    }

    /// @notice Get player formation for a battle type
    /// @param player Address of the player
    /// @param battleType Type of battle
    /// @return Formation struct
    function getFormation(address player, BattleType battleType) external view returns (Formation memory) {
        return formations[player][battleType];
    }

    /// @notice Get formation size for a battle type
    function getFormationSize(BattleType battleType) external pure returns (uint8) {
        return _getFormationSize(battleType);
    }

    /// @notice Get pending challenges count (external function for consistency)
    /// @param player Address of the player
    /// @return count Number of challenges using player's formations
    function getPendingChallengesCount(address player) external view returns (uint256 count) {
        count = 0;
        for (uint8 i = 0; i < 3; i++) {
            if (formationInUse[player][BattleType(i)]) {
                count++;
            }
        }
        return count;
    }

    /// @notice Update ELO after a battle (only callable by authorized contract)
    /// @param player Address of the player
    /// @param eloChange Change in ELO (can be negative)
    function updateELO(address player, int256 eloChange) external {
        require(player != address(0), "PlayerRegistry: Invalid player");
        require(players[player].isRegistered, "PlayerRegistry: Player not registered");
        
        // This will be called by PvPArena contract only
        // In production, add access control: require(msg.sender == pvpArenaAddress, "Not authorized");
        
        uint256 currentELO = players[player].elo;
        if (eloChange > 0) {
            players[player].elo = currentELO + uint256(eloChange);
            players[player].wins++;
        } else if (eloChange < 0) {
            uint256 change = uint256(-eloChange);
            players[player].elo = currentELO > change ? currentELO - change : 0;
            players[player].losses++;
        }
    }

    /// @notice Update XP after a battle (only callable by authorized contract)
    /// @param player Address of the player
    /// @param xpGained XP gained (50 for win, 20 for loss)
    function updateXP(address player, uint256 xpGained) external {
        require(player != address(0), "PlayerRegistry: Invalid player");
        require(players[player].isRegistered, "PlayerRegistry: Player not registered");
        
        // This will be called by PvPArena contract only
        // In production, add access control: require(msg.sender == pvpArenaAddress, "Not authorized");
        
        players[player].xp += xpGained;
        
        // Calculate new level (level N = N * 100 XP)
        uint256 newLevel = (players[player].xp / XP_PER_LEVEL) + 1;
        if (newLevel > players[player].level) {
            players[player].level = newLevel;
        }
    }

    /// @notice Set formation in-use status (only callable by PvPArena)
    /// @param player Address of the player
    /// @param battleType Type of battle
    /// @param inUse Whether formation is in use
    function setFormationInUse(address player, BattleType battleType, bool inUse) external {
        // This will be called by PvPArena contract only
        // In production, add access control: require(msg.sender == pvpArenaAddress, "Not authorized");
        
        formationInUse[player][battleType] = inUse;
        emit FormationInUseUpdated(player, battleType, inUse);
    }

    /// @notice Get formation size for a battle type
    function _getFormationSize(BattleType battleType) private pure returns (uint8) {
        if (battleType == BattleType.OneVsOne) return FORMATION_SIZE_1V1;
        if (battleType == BattleType.ThreeVsThree) return FORMATION_SIZE_3V3;
        if (battleType == BattleType.FiveVsFive) return FORMATION_SIZE_5V5;
        return 0;
    }

    /// @notice Remove address from matchmaking pool
    function _removeFromPool(BattleType battleType, address player) private {
        address[] storage pool = poolAddresses[battleType];
        for (uint256 i = 0; i < pool.length; i++) {
            if (pool[i] == player) {
                pool[i] = pool[pool.length - 1];
                pool.pop();
                break;
            }
        }
    }
}
