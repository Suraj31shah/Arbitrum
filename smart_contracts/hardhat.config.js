import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const config = {
  solidity: "0.8.20",
  networks: {} // Left empty to avoid Hardhat 3 HHE15 network config bugs during compile
};

export default config;
