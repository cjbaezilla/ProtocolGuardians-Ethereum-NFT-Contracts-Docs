// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract ProtocolTimelock is TimelockController {

    event TimelockInitialized(
        address[] proposers,
        address[] executors,
        address admin
    );

    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        emit TimelockInitialized(proposers, executors, admin);
    }

    function getMinDelay() public view override returns (uint256) {
        return super.getMinDelay();
    }

    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    function getExecutionTimestamp(bytes32 id) external view returns (uint256) {
        return getTimestamp(id);
    }

    function isProposalReady(bytes32 id) external view returns (bool) {
        return isOperationReady(id);
    }

    function getOperationDelay(bytes32 /* id */) external view returns (uint256) {
        return getMinDelay();
    }

    function getProposalStatus(bytes32 id) external view returns (uint8) {
        if (isOperationDone(id)) {
            return 3;
        } else if (isOperationReady(id)) {
            return 2;
        } else if (isOperationPending(id)) {
            return 1;
        } else {
            return 0;
        }
    }

    function getProposalInfo(bytes32 id) 
        external 
        view 
        returns (
            address target,
            uint256 value,
            bytes memory data,
            bytes32 predecessor,
            bytes32 salt
        ) 
    {
        return (address(0), 0, "", bytes32(0), bytes32(0));
    }
}
