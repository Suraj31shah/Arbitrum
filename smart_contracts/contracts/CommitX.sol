// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CommitX {
    address public owner;

    struct Challenge {
        uint256 stakeAmount;
        uint256 prizePool;
        address[] participants;
        bool isResolved;
    }

    // Maps MongoDB challenge ID to the Challenge struct
    mapping(string => Challenge) public challenges;
    
    // Maps Challenge ID => Wallet Address => True if they joined
    mapping(string => mapping(address => bool)) public hasJoined;
    
    // Only the backend (Oracle) can call resolve functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the backend server can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // 1. Join Challenge
    // Frontend triggers this when user clicks "Join Challenge & Stake ETH"
    function joinChallenge(string memory challengeId, uint256 requiredStake) external payable {
        require(msg.value == requiredStake, "Must send exact stake amount");
        require(!hasJoined[challengeId][msg.sender], "You have already joined this challenge");

        Challenge storage challenge = challenges[challengeId];
        
        // If this is the first participant, lock in the stake amount requirement
        if (challenge.participants.length == 0) {
            challenge.stakeAmount = requiredStake;
        } else {
            require(requiredStake == challenge.stakeAmount, "Stake amount mismatch with pool");
        }

        require(!challenge.isResolved, "Challenge already resolved");

        // Add user to the pool
        challenge.participants.push(msg.sender);
        challenge.prizePool += msg.value;
        hasJoined[challengeId][msg.sender] = true;
    }

    // 2. Resolve Challenge (Backend calls this)
    // Distributes the total prize pool equally among the verified winners
    function resolveChallenge(string memory challengeId, address[] memory winners) external onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(!challenge.isResolved, "Challenge already resolved");
        require(challenge.participants.length > 0, "No participants to resolve");

        challenge.isResolved = true;
        uint256 totalPool = challenge.prizePool;
        
        if (winners.length > 0) {
            // Split the entire pool equally among all winners (winning back stake + slashing losers)
            uint256 payoutPerWinner = totalPool / winners.length;
            
            for (uint i = 0; i < winners.length; i++) {
                // Double check they were actually in the challenge
                if (hasJoined[challengeId][winners[i]]) {
                    (bool success, ) = winners[i].call{value: payoutPerWinner}("");
                    require(success, "Payout transfer failed");
                }
            }
        } else {
            // If nobody won, the protocol treasury (owner) absorbs the slashed tokens
            (bool success, ) = owner.call{value: totalPool}("");
            require(success, "Treasury transfer failed");
        }
    }

    // View function to fetch all participants for a challenge
    function getParticipants(string memory challengeId) external view returns (address[] memory) {
        return challenges[challengeId].participants;
    }
}
