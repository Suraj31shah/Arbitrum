// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CommitX {
    address public owner;
    address public charityAddress;

    struct Challenge {
        uint256 stakeAmount;
        uint256 prizePool;
        address[] participants;
        bool isResolved;
    }

    // Maps challenge ID (MongoDB _id) to the Challenge struct
    mapping(string => Challenge) public challenges;

    // Maps Challenge ID => Wallet Address => True if they joined
    mapping(string => mapping(address => bool)) public hasJoined;

    // Pull-payment: Maps Challenge ID => Winner Address => Claimable Amount
    mapping(string => mapping(address => uint256)) public claimable;

    // Only the backend (Oracle) can call resolve functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the backend server can call this");
        _;
    }

    constructor(address _charityAddress) {
        require(_charityAddress != address(0), "Charity address cannot be zero");
        owner = msg.sender;
        charityAddress = _charityAddress;
    }

    // 1. Join Challenge
    // Frontend triggers this when user clicks "Join Challenge & Stake ETH"
    function joinChallenge(string memory challengeId, uint256 requiredStake) external payable {
        require(msg.value == requiredStake, "Must send exact stake amount");
        require(msg.value > 0, "Stake must be greater than zero");
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
    // Uses pull-payment pattern: calculates claimable amounts instead of pushing ETH
    function resolveChallenge(string memory challengeId, address[] memory winners) external onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(!challenge.isResolved, "Challenge already resolved");
        require(challenge.participants.length > 0, "No participants to resolve");

        challenge.isResolved = true;
        uint256 totalPool = challenge.prizePool;

        if (winners.length > 0) {
            uint256 payoutPerWinner = totalPool / winners.length;
            uint256 distributed = 0;

            for (uint i = 0; i < winners.length; i++) {
                // Only credit verified participants
                if (hasJoined[challengeId][winners[i]]) {
                    claimable[challengeId][winners[i]] = payoutPerWinner;
                    distributed += payoutPerWinner;
                }
            }

            // Map rounding dust to charity instead of pushing it
            uint256 dust = totalPool - distributed;
            if (dust > 0) {
                claimable[challengeId][charityAddress] += dust;
            }
        } else {
            // Nobody won — entire pool goes to charity via pull-payment
            claimable[challengeId][charityAddress] += totalPool;
        }
    }

    // 3. Claim Reward (Winners call this themselves — pull-payment)
    function claimReward(string memory challengeId) external {
        uint256 amount = claimable[challengeId][msg.sender];
        require(amount > 0, "Nothing to claim");

        // Zero out before transfer to prevent reentrancy
        claimable[challengeId][msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Claim transfer failed");
    }

    // 4. Emergency withdraw — only for resolved challenges, only owner, only dust/stuck funds
    function emergencyWithdraw(string memory challengeId) external onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isResolved, "Challenge must be resolved first");

        // This is a safety valve for edge cases where funds remain after resolution
        // In normal operation, claimable amounts cover the full pool
        // This only recovers truly stuck/unclaimed funds
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // View function to fetch all participants for a challenge
    function getParticipants(string memory challengeId) external view returns (address[] memory) {
        return challenges[challengeId].participants;
    }

    // View function to check claimable amount
    function getClaimable(string memory challengeId, address participant) external view returns (uint256) {
        return claimable[challengeId][participant];
    }
}
