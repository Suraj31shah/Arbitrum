/**
 * resolveService.js
 * 
 * Calls resolveChallenge() on the CommitX smart contract
 * when a challenge finishes (all participants completed or failed).
 * 
 * Requires in .env:
 *   BACKEND_WALLET_PRIVATE_KEY — the deployer/owner wallet private key
 *   CONTRACT_ADDRESS — the deployed CommitX contract address
 *   ARBITRUM_RPC_URL — (optional, defaults to Arbitrum Sepolia public RPC)
 */

const { ethers } = require('ethers');

const CONTRACT_ABI = [
  "function resolveChallenge(string memory challengeId, address[] memory winners) external"
];

let provider = null;
let wallet = null;
let contract = null;

function getContract() {
  if (contract) return contract;

  const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

  if (!privateKey || !contractAddress) {
    console.warn('[resolveService] Missing BACKEND_WALLET_PRIVATE_KEY or CONTRACT_ADDRESS in .env — on-chain resolution disabled.');
    return null;
  }

  try {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    const key = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
    wallet = new ethers.Wallet(key, provider);
    contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
    console.log(`[resolveService] Initialized. Owner: ${wallet.address}, Contract: ${contractAddress}`);
    return contract;
  } catch (e) {
    console.error('[resolveService] Failed to initialize:', e.message);
    return null;
  }
}

/**
 * Resolve a challenge on-chain.
 * @param {string} challengeId - The MongoDB _id of the challenge (used as on-chain ID)
 * @param {string[]} winnersAddresses - Array of winner wallet addresses
 * @returns {string|null} Transaction hash if successful, null otherwise
 */
async function resolveOnChain(challengeId, winnersAddresses) {
  const c = getContract();
  if (!c) {
    console.warn(`[resolveService] Skipping on-chain resolution for ${challengeId} — service not configured.`);
    return null;
  }

  try {
    console.log(`[resolveService] Resolving challenge ${challengeId} with ${winnersAddresses.length} winners...`);
    
    const feeData = await provider.getFeeData();
    const tx = await c.resolveChallenge(challengeId, winnersAddresses, {
      maxFeePerGas: feeData.maxFeePerGas ? (feeData.maxFeePerGas * 15n) / 10n : undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 15n) / 10n : undefined
    });
    
    console.log(`[resolveService] Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[resolveService] Challenge ${challengeId} resolved on-chain. Block: ${receipt.blockNumber}`);
    return tx.hash;
  } catch (e) {
    console.error(`[resolveService] Failed to resolve ${challengeId}:`, e.message);
    return null;
  }
}

module.exports = { resolveOnChain };
