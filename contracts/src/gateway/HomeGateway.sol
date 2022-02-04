// SPDX-License-Identifier: MIT

/**
 *  @authors: [@shalzz]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

pragma solidity ^0.8.0;

import "../arbitration/IArbitrator.sol";
import "../bridge/interfaces/IFastBridgeSender.sol";

import "./interfaces/IForeignGateway.sol";
import "./interfaces/IHomeGateway.sol";

contract HomeGateway is IHomeGateway {
    mapping(uint256 => bytes32) public disputeIDtoHash;
    mapping(bytes32 => uint256) public disputeHashtoID;

    IArbitrator public arbitrator;
    IFastBridgeSender public fastbridge;
    address public foreignGateway;
    uint256 public chainID;
    uint256 public foreignChainID;

    struct RelayedData {
        uint256 choices;
        uint256 arbitrationCost;
        address forwarder;
        bytes extraData;
    }
    mapping(bytes32 => RelayedData) public disputeHashtoRelayedData;

    constructor(
        IArbitrator _arbitrator,
        IFastBridgeSender _fastbridge,
        address _foreignGateway,
        uint256 _foreignChainID
    ) {
        arbitrator = _arbitrator;
        fastbridge = _fastbridge;
        foreignGateway = _foreignGateway;
        foreignChainID = _foreignChainID;

        uint256 id;
        assembly {
            id := chainid()
        }
        chainID = id;

        emit MetaEvidence(0, "BRIDGE");
    }

    /**
     * @dev Handle the cross-chain call from the foreign gateway.
     *
     * @param _disputeHash disputeHash
     * @param _choices number of ruling choices
     * @param _extraData extraData
     * @param _arbitrationCost We get the actual arbitrationCost paid by the
     *          arbitrable here in case they paid more than the min arbitrationCost
     */
    function handleIncomingDispute(
        bytes32 _disputeHash,
        uint256 _choices,
        bytes calldata _extraData,
        uint256 _arbitrationCost
    ) external {
        // TODO: recreate hash
        RelayedData storage relayedData = disputeHashtoRelayedData[_disputeHash];
        relayedData.choices = _choices;
        relayedData.extraData = _extraData;
        relayedData.arbitrationCost = _arbitrationCost;
    }

    function relayCreateDispute(bytes32 _disputeHash) external payable {
        RelayedData storage relayedData = disputeHashtoRelayedData[_disputeHash];
        require(relayedData.forwarder == address(0), "Dispute already forwarded");

        require(msg.value >= relayedData.arbitrationCost, "Not enough arbitration cost paid");

        uint256 disputeID = arbitrator.createDispute{value: msg.value}(relayedData.choices, relayedData.extraData);
        disputeIDtoHash[disputeID] = _disputeHash;
        disputeHashtoID[_disputeHash] = disputeID;
        relayedData.forwarder = msg.sender;

        emit Dispute(arbitrator, disputeID, 0, 0);
    }

    function rule(uint256 _disputeID, uint256 _ruling) external {
        require(msg.sender == address(arbitrator), "Only Arbitrator");

        bytes32 disputeHash = disputeIDtoHash[_disputeID];
        RelayedData memory relayedData = disputeHashtoRelayedData[disputeHash];

        bytes4 methodSelector = IForeignGateway.relayRule.selector;
        bytes memory data = abi.encodeWithSelector(methodSelector, disputeHash, _ruling, relayedData.forwarder);

        fastbridge.sendFast(foreignGateway, data);
    }

    function disputeHashToHomeID(bytes32 _disputeHash) external view returns (uint256) {
        return disputeHashtoID[_disputeHash];
    }
}