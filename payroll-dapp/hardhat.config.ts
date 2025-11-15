import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
require("dotenv").config({ path: ".env.local" });

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    localhost: {
      url: process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
