const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const balance = await provider.getBalance("0x6d54080Ee9b54150C67b5D74B1A4DBBcD391815c");
  console.log("ETH_BALANCE=" + ethers.formatEther(balance));
}

main().catch(console.error);
