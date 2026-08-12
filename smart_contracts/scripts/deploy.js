import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

async function main() {
  console.log("Deploying CommitX contract to Arbitrum Sepolia...");

  let privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ ERROR: No BACKEND_WALLET_PRIVATE_KEY found in backend/.env!");
    process.exit(1);
  }
  
  // Ensure private key has 0x prefix for ethers
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }

  const charityAddress = process.env.CHARITY_WALLET_ADDRESS;
  if (!charityAddress) {
    console.error("❌ ERROR: No CHARITY_WALLET_ADDRESS found in backend/.env!");
    process.exit(1);
  }

  const rpcUrl = process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
  
  // Read compiled artifact
  const abiPath = path.join(__dirname, "../artifacts/contracts_CommitX_sol_CommitX.abi");
  const binPath = path.join(__dirname, "../artifacts/contracts_CommitX_sol_CommitX.bin");
  if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
    console.error("❌ ERROR: Contract not compiled. Please run 'npx solcjs' first.");
    process.exit(1);
  }
  
  const abi = fs.readFileSync(abiPath, "utf8");
  const bytecode = fs.readFileSync(binPath, "utf8");
  
  // Connect to network
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Deploying from account: ${wallet.address}`);
  console.log(`Charity/Demo Fund address: ${charityAddress}`);
  
  // Deploy with charity address as constructor argument
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(charityAddress);
  
  console.log("Transaction sent! Waiting for confirmation...");
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();

  console.log(`\n🎉 CommitX successfully deployed!`);
  console.log(`Contract Address: ${address}`);
  console.log(`Charity Address:  ${charityAddress}`);
  console.log(`\nNext Steps:`);
  console.log(`1. Add CONTRACT_ADDRESS=${address} to your backend/.env`);
  console.log(`2. Update the frontend contract address in ConfirmChallengePage and ChallengeDetailPage`);
  console.log(`3. Restart the backend and frontend dev servers`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
