// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./PlayerRegistry.sol";
import "./BattleEngine.sol";

/// @title PvPArena
/// @notice Main PvP arena contract for challenges, wagers, and battle execution
/// @dev Orchestrates battles, manages wagers, validates stats signatures, and updates ELO/XP
contract PvPArena is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using Address for address payable;

    /// @notice Challenge structure
    struct Challenge {
        address challenger;
        address opponent;
        PlayerRegistry.BattleType battleType;
        uint256[] challengerTokenIds;
        bool isWager;
        address wagerToken;
        uint256 wagerAmount;
        uint256 createdAt;
        ChallengeStatus status;
    }

    /// @notice Signed stats structure
    struct SignedStats {
        uint256 tokenId;
        uint256[8] stats;
        uint256 expiration;
        bytes signature;
    }

    /// @notice Challenge status enum
    enum ChallengeStatus { Pending, Accepted, Cancelled, Completed }

    /// @notice Constants
    uint256 public constant EXPIRATION_DURATION = 1 hours;
    uint256 public constant XP_WIN = 50;
    uint256 public constant XP_LOSS = 20;
    uint256 public constant ELO_K_FACTOR = 30;
    int256 public constant CANCEL_PENALTY_PERCENT = 5;

    /// @notice Configurable parameters
    uint256 public challengeFee;
    uint256 public protocolFeePercent;
    address public signerAddress;
    address public immutable playerRegistryAddress;
    address public immutable battleEngineAddress;

    /// @notice Pause flags
    bool public pauseMatchmaking = false;
    bool public pauseWagers = false;
    bool public pauseRanking = false;

    /// @dev Challenge counter
    uint256 private _challengeCounter = 1;

    /// @dev Mappings
    mapping(uint256 => Challenge) public challenges;
    mapping(address => uint256[]) public playerChallenges;
    mapping(uint256 => mapping(uint256 => SignedStats)) public challengerStats;
    mapping(uint256 => mapping(uint256 => SignedStats)) public opponentStats;

    /// @notice Events
    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed challenger,
        address indexed opponent,
        PlayerRegistry.BattleType battleType,
        bool isWager,
        address wagerToken,
        uint256 wagerAmount
    );

    event ChallengeAccepted(uint256 indexed challengeId, address indexed opponent);
    event ChallengeCancelled(uint256 indexed challengeId, address indexed cancelledBy, bool penaltyApplied);
    event BattleCompleted(uint256 indexed challengeId, address indexed winner, address indexed loser, uint8 battleResult, uint256 turnsPlayed);
    event WagerDistributed(uint256 indexed challengeId, address indexed winner, address indexed wagerToken, uint256 totalAmount, uint256 protocolFee);
    event ChallengeFeeUpdated(uint256 newFee);
    event ProtocolFeeUpdated(uint256 newPercent);
    event SignerAddressUpdated(address newSigner);
    event PauseStatusUpdated(bool matchmaking, bool wagers, bool ranking);

    constructor(
        address _playerRegistryAddress,
        address _battleEngineAddress,
        address _signerAddress,
        uint256 _challengeFee,
        uint256 _protocolFeePercent
    ) Ownable(msg.sender) {
        require(_playerRegistryAddress != address(0), "PvPArena: Invalid player registry");
        require(_battleEngineAddress != address(0), "PvPArena: Invalid battle engine");
        require(_signerAddress != address(0), "PvPArena: Invalid signer");

        playerRegistryAddress = _playerRegistryAddress;
        battleEngineAddress = _battleEngineAddress;
        signerAddress = _signerAddress;
        challengeFee = _challengeFee;
        protocolFeePercent = _protocolFeePercent;
    }

    /// @notice Create a ranking challenge (no wager)
    function createRankingChallenge(
        address opponentAddress,
        PlayerRegistry.BattleType battleType,
        SignedStats[] calldata signedStatsArray
    ) external payable nonReentrant {
        require(!pauseRanking, "PvPArena: Ranking challenges paused");
        require(msg.value >= challengeFee, "PvPArena: Insufficient challenge fee");
        require(opponentAddress != address(0) && opponentAddress != msg.sender, "PvPArena: Invalid opponent");

        PlayerRegistry registry = PlayerRegistry(playerRegistryAddress);
        (,,,,,,,, bool challengerIsRegistered) = registry.players(msg.sender);
        require(challengerIsRegistered, "PvPArena: Challenger not registered");
        (,,,,,,,, bool opponentIsRegistered) = registry.players(opponentAddress);
        require(opponentIsRegistered, "PvPArena: Opponent not registered");

        // Get challenger's formation
        PlayerRegistry.Formation memory formation = registry.getFormation(msg.sender, battleType);
        require(formation.isActive, "PvPArena: No active formation");
        require(!registry.formationInUse(msg.sender, battleType), "PvPArena: Formation in use");

        // Validate formation size matches signed stats
        require(signedStatsArray.length == formation.tokenIds.length, "PvPArena: Stats count mismatch");

        // Validate and store stats
        for (uint256 i = 0; i < signedStatsArray.length; i++) {
            require(
                _verifyStatsSignature(signedStatsArray[i], formation.tokenIds[i], msg.sender),
                "PvPArena: Invalid stats signature"
            );
            challengerStats[_challengeCounter][formation.tokenIds[i]] = signedStatsArray[i];
        }

        // Create challenge
        challenges[_challengeCounter] = Challenge({
            challenger: msg.sender,
            opponent: opponentAddress,
            battleType: battleType,
            challengerTokenIds: formation.tokenIds,
            isWager: false,
            wagerToken: address(0),
            wagerAmount: 0,
            createdAt: block.timestamp,
            status: ChallengeStatus.Pending
        });

        // Update state before external calls (Checks-Effects-Interactions pattern)
        playerChallenges[msg.sender].push(_challengeCounter);
        playerChallenges[opponentAddress].push(_challengeCounter);
        _challengeCounter++;

        // Mark formation as in use (external call after state updates)
        registry.setFormationInUse(msg.sender, battleType, true);

        emit ChallengeCreated(_challengeCounter - 1, msg.sender, opponentAddress, battleType, false, address(0), 0);
    }

    /// @notice Create a wager challenge (with bet)
    function createWagerChallenge(
        address opponentAddress,
        PlayerRegistry.BattleType battleType,
        address wagerToken,
        uint256 wagerAmount,
        SignedStats[] calldata signedStatsArray
    ) external payable nonReentrant {
        require(!pauseWagers, "PvPArena: Wager challenges paused");
        require(msg.value >= challengeFee, "PvPArena: Insufficient challenge fee");
        require(opponentAddress != address(0) && opponentAddress != msg.sender, "PvPArena: Invalid opponent");
        require(wagerAmount > 0, "PvPArena: Invalid wager amount");

        PlayerRegistry registry = PlayerRegistry(playerRegistryAddress);
        (,,,,,,,, bool challengerIsRegistered) = registry.players(msg.sender);
        require(challengerIsRegistered, "PvPArena: Challenger not registered");
        (,,,,,,,, bool opponentIsRegistered) = registry.players(opponentAddress);
        require(opponentIsRegistered, "PvPArena: Opponent not registered");

        // Get challenger's formation
        PlayerRegistry.Formation memory formation = registry.getFormation(msg.sender, battleType);
        require(formation.isActive, "PvPArena: No active formation");
        require(!registry.formationInUse(msg.sender, battleType), "PvPArena: Formation in use");

        // Validate formation size matches signed stats
        require(signedStatsArray.length == formation.tokenIds.length, "PvPArena: Stats count mismatch");

        // Validate and store stats
        for (uint256 i = 0; i < signedStatsArray.length; i++) {
            require(
                _verifyStatsSignature(signedStatsArray[i], formation.tokenIds[i], msg.sender),
                "PvPArena: Invalid stats signature"
            );
            challengerStats[_challengeCounter][formation.tokenIds[i]] = signedStatsArray[i];
        }

        // Create challenge first (state update)
        challenges[_challengeCounter] = Challenge({
            challenger: msg.sender,
            opponent: opponentAddress,
            battleType: battleType,
            challengerTokenIds: formation.tokenIds,
            isWager: true,
            wagerToken: wagerToken,
            wagerAmount: wagerAmount,
            createdAt: block.timestamp,
            status: ChallengeStatus.Pending
        });

        // Update state before external calls (Checks-Effects-Interactions pattern)
        playerChallenges[msg.sender].push(_challengeCounter);
        playerChallenges[opponentAddress].push(_challengeCounter);
        _challengeCounter++;

        // Handle wager deposit (external call after state updates)
        if (wagerToken == address(0)) {
            require(msg.value >= challengeFee + wagerAmount, "PvPArena: Insufficient value");
        } else {
            IERC20 token = IERC20(wagerToken);
            require(token.transferFrom(msg.sender, address(this), wagerAmount), "PvPArena: Transfer failed");
        }

        // Mark formation as in use (external call after state updates)
        registry.setFormationInUse(msg.sender, battleType, true);

        emit ChallengeCreated(_challengeCounter - 1, msg.sender, opponentAddress, battleType, true, wagerToken, wagerAmount);
    }

    /// @notice Accept a challenge and execute battle
    function acceptChallenge(
        uint256 challengeId,
        SignedStats[] calldata signedStatsArray
    ) external payable nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.status == ChallengeStatus.Pending, "PvPArena: Invalid challenge status");
        require(challenge.opponent == msg.sender, "PvPArena: Not the opponent");

        PlayerRegistry registry = PlayerRegistry(playerRegistryAddress);
        (,,,,,,,, bool opponentIsRegistered) = registry.players(msg.sender);
        require(opponentIsRegistered, "PvPArena: Not registered");

        // Get opponent's formation
        PlayerRegistry.Formation memory formation = registry.getFormation(msg.sender, challenge.battleType);
        require(formation.isActive, "PvPArena: No active formation");
        require(!registry.formationInUse(msg.sender, challenge.battleType), "PvPArena: Formation in use");

        // Validate formation size matches signed stats
        require(signedStatsArray.length == formation.tokenIds.length, "PvPArena: Stats count mismatch");

        // Validate and store opponent's stats first (state updates)
        for (uint256 i = 0; i < signedStatsArray.length; i++) {
            require(
                _verifyStatsSignature(signedStatsArray[i], formation.tokenIds[i], msg.sender),
                "PvPArena: Invalid stats signature"
            );
            opponentStats[challengeId][formation.tokenIds[i]] = signedStatsArray[i];
        }

        // Update challenge status (state update)
        challenge.status = ChallengeStatus.Accepted;

        // Handle wager if applicable (external call after state updates)
        if (challenge.isWager) {
            if (challenge.wagerToken == address(0)) {
                require(msg.value >= challenge.wagerAmount, "PvPArena: Insufficient wager");
            } else {
                IERC20 token = IERC20(challenge.wagerToken);
                require(token.transferFrom(msg.sender, address(this), challenge.wagerAmount), "PvPArena: Transfer failed");
            }
        }

        // Mark formations as in use (external call after state updates)
        registry.setFormationInUse(msg.sender, challenge.battleType, true);

        emit ChallengeAccepted(challengeId, msg.sender);

        // Execute battle
        _executeBattle(challengeId);
    }

    /// @notice Cancel a challenge (only by challenger)
    function cancelChallenge(uint256 challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.status == ChallengeStatus.Pending, "PvPArena: Invalid challenge status");
        require(challenge.challenger == msg.sender, "PvPArena: Not the challenger");

        challenge.status = ChallengeStatus.Cancelled;

        PlayerRegistry registry = PlayerRegistry(playerRegistryAddress);
        registry.setFormationInUse(msg.sender, challenge.battleType, false);

        // Handle wager refund with penalty if applicable
        if (challenge.isWager) {
            uint256 penalty = (challenge.wagerAmount * uint256(CANCEL_PENALTY_PERCENT)) / 100;
            uint256 refund = challenge.wagerAmount - penalty;

            if (challenge.wagerToken == address(0)) {
                Address.sendValue(payable(msg.sender), refund);
            } else {
                IERC20(challenge.wagerToken).transfer(msg.sender, refund);
            }

            emit ChallengeCancelled(challengeId, msg.sender, true);
        } else {
            emit ChallengeCancelled(challengeId, msg.sender, false);
        }
    }

    /// @notice Execute battle for an accepted challenge
    function _executeBattle(uint256 challengeId) private {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.status == ChallengeStatus.Accepted, "PvPArena: Challenge not accepted");

        PlayerRegistry registry = PlayerRegistry(playerRegistryAddress);

        // Get formations
        PlayerRegistry.Formation memory challengerFormation = registry.getFormation(challenge.challenger, challenge.battleType);
        PlayerRegistry.Formation memory opponentFormation = registry.getFormation(challenge.opponent, challenge.battleType);

        // Build card stats arrays
        BattleEngine.CardStats[] memory team1Cards = new BattleEngine.CardStats[](challengerFormation.tokenIds.length);
        BattleEngine.CardStats[] memory team2Cards = new BattleEngine.CardStats[](opponentFormation.tokenIds.length);

        for (uint256 i = 0; i < challengerFormation.tokenIds.length; i++) {
            uint256 tokenId = challengerFormation.tokenIds[i];
            SignedStats memory stats = challengerStats[challengeId][tokenId];
            require(block.timestamp < stats.expiration, "PvPArena: Stats expired");
            
            uint256[8] memory statsArray = stats.stats;
            team1Cards[i] = BattleEngine.CardStats({
                power: statsArray[0],
                defense: statsArray[1],
                speed: statsArray[2],
                hp: statsArray[3],
                luck: statsArray[4],
                critical: statsArray[6],
                cardType: uint8(tokenId % 8)
            });
        }

        for (uint256 i = 0; i < opponentFormation.tokenIds.length; i++) {
            uint256 tokenId = opponentFormation.tokenIds[i];
            SignedStats memory stats = opponentStats[challengeId][tokenId];
            require(block.timestamp < stats.expiration, "PvPArena: Stats expired");
            
            uint256[8] memory statsArray = stats.stats;
            team2Cards[i] = BattleEngine.CardStats({
                power: statsArray[0],
                defense: statsArray[1],
                speed: statsArray[2],
                hp: statsArray[3],
                luck: statsArray[4],
                critical: statsArray[6],
                cardType: uint8(tokenId % 8)
            });
        }

        // Execute battle
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, challengeId)));
        BattleEngine battleEngine = BattleEngine(payable(battleEngineAddress));
        BattleEngine.BattleResult memory result = battleEngine.executeBattle(team1Cards, team2Cards, seed);

        // Determine winner and loser
        address winner = result.winner == 0 ? challenge.challenger : challenge.opponent;
        address loser = result.winner == 0 ? challenge.opponent : challenge.challenger;

        // Update challenge status
        challenge.status = ChallengeStatus.Completed;

        // Update formations as not in use
        registry.setFormationInUse(challenge.challenger, challenge.battleType, false);
        registry.setFormationInUse(challenge.opponent, challenge.battleType, false);

        emit BattleCompleted(challengeId, winner, loser, result.winner, result.turnsPlayed);

        // Handle rewards
        if (challenge.isWager) {
            uint256 totalWager = challenge.wagerAmount * 2;
            uint256 protocolFee = (totalWager * protocolFeePercent) / 10000;
            uint256 winnerReward = totalWager - protocolFee;

            if (challenge.wagerToken == address(0)) {
                Address.sendValue(payable(winner), winnerReward);
            } else {
                IERC20(challenge.wagerToken).transfer(winner, winnerReward);
            }

            emit WagerDistributed(challengeId, winner, challenge.wagerToken, totalWager, protocolFee);
        } else {
            _updateRanking(winner, loser);
        }
    }

    /// @notice Update ELO and XP after ranking battle
    function _updateRanking(address winner, address loser) private {
        PlayerRegistry registry = PlayerRegistry(playerRegistryAddress);
        (, , uint256 winnerElo, , , , , , ) = registry.players(winner);
        (, , uint256 loserElo, , , , , , ) = registry.players(loser);

        int256 eloChange = _calculateEloChange(winnerElo, loserElo);
        
        registry.updateELO(winner, eloChange);
        registry.updateXP(winner, XP_WIN);
        
        registry.updateELO(loser, -eloChange);
        registry.updateXP(loser, XP_LOSS);
    }

    /// @notice Calculate ELO change based on ratings
    function _calculateEloChange(uint256 winnerElo, uint256 loserElo) private pure returns (int256) {
        // Simplified ELO calculation: K * (1 - expected_score)
        // expected_score = 1 / (1 + 10^((loser_elo - winner_elo) / 400))
        int256 diff = int256(loserElo) - int256(winnerElo);
        
        // Simplified: use fixed K factor for now
        int256 kFactor = int256(ELO_K_FACTOR);
        
        // Simple linear approximation for elo change
        int256 eloChange = kFactor;
        if (diff < 0) {
            eloChange = kFactor - (kFactor * (-diff) / 400);
        }
        
        return eloChange;
    }

    /// @notice Verify stats signature
    function _verifyStatsSignature(SignedStats memory signedStats, uint256 tokenId, address player) private view returns (bool) {
        require(block.timestamp < signedStats.expiration, "PvPArena: Signature expired");
        require(signedStats.tokenId == tokenId, "PvPArena: Token ID mismatch");

        bytes32 message = keccak256(abi.encodePacked(tokenId, signedStats.stats, signedStats.expiration, player));
        bytes32 ethSignedMessage = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        address recovered = ethSignedMessage.recover(signedStats.signature);

        return recovered == signerAddress;
    }

    /// @notice Get challenge details
    function getChallengeDetails(uint256 challengeId) external view returns (Challenge memory) {
        return challenges[challengeId];
    }

    /// @notice Get player challenges
    function getPlayerChallenges(address player) external view returns (uint256[] memory) {
        return playerChallenges[player];
    }

    /// @notice Get next challenge ID
    function nextChallengeId() external view returns (uint256) {
        return _challengeCounter;
    }

    /// @notice Set challenge fee (owner only)
    function setChallengeFee(uint256 _challengeFee) external onlyOwner {
        challengeFee = _challengeFee;
        emit ChallengeFeeUpdated(_challengeFee);
    }

    /// @notice Set protocol fee (owner only)
    function setProtocolFee(uint256 _protocolFeePercent) external onlyOwner {
        require(_protocolFeePercent <= 1000, "PvPArena: Fee too high");
        protocolFeePercent = _protocolFeePercent;
        emit ProtocolFeeUpdated(_protocolFeePercent);
    }

    /// @notice Set signer address (owner only)
    function setSignerAddress(address _signerAddress) external onlyOwner {
        require(_signerAddress != address(0), "PvPArena: Invalid signer");
        signerAddress = _signerAddress;
        emit SignerAddressUpdated(_signerAddress);
    }

    /// @notice Set pause status (owner only)
    function setPauseStatus(bool _pauseMatchmaking, bool _pauseWagers, bool _pauseRanking) external onlyOwner {
        pauseMatchmaking = _pauseMatchmaking;
        pauseWagers = _pauseWagers;
        pauseRanking = _pauseRanking;
        emit PauseStatusUpdated(_pauseMatchmaking, _pauseWagers, _pauseRanking);
    }

    /// @notice Withdraw protocol fees (owner only)
    function withdrawFees(address token, address to) external onlyOwner nonReentrant {
        require(to != address(0), "PvPArena: Invalid recipient");
        
        if (token == address(0)) {
            Address.sendValue(payable(to), address(this).balance);
        } else {
            IERC20 tokenContract = IERC20(token);
            tokenContract.transfer(to, tokenContract.balanceOf(address(this)));
        }
    }

    /// @notice Emergency function to withdraw ETH
    function emergencyWithdraw() external onlyOwner nonReentrant {
        Address.sendValue(payable(owner()), address(this).balance);
    }

    /// @notice Receive ETH
    receive() external payable {}
}
