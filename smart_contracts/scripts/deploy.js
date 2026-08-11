import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

async function main() {
  console.log("Deploying CommitX contract to Arbitrum Sepolia...");

  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ ERROR: No PRIVATE_KEY found in backend/.env!");
    process.exit(1);
  }
  
  // Ensure private key has 0x prefix for ethers
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }

  const rpcUrl = process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
  
  // Read compiled artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/CommitX.sol/CommitX.json");
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ ERROR: Contract not compiled. Please run 'npx hardhat compile' first.");
    process.exit(1);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Connect to network
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Deploying from account: ${wallet.address}`);
  
  // Deploy
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  
  console.log("Transaction sent! Waiting for confirmation...");
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();

  console.log(`\n🎉 CommitX successfully deployed!`);
  console.log(`Contract Address: ${address}`);
  console.log(`\nNext Steps:`);
  console.log(`1. Copy this address into your frontend code (ConfirmChallengePage & ChallengeDetailPage)`);
  console.log(`2. Update the backend to use this address for resolving challenges!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
