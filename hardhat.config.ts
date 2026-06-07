import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

dotenv.config({ path: ".env.local" });

const AMOY_RPC = process.env.NEXT_PUBLIC_AMOY_RPC || "https://rpc-amoy.polygon.technology";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    amoy: {
      type: "http",
      chainType: "l1",
      url: AMOY_RPC,
      chainId: 80002,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  typechain: {
    outDir: "typechain-types",
  },
  verify: {
    etherscan: {
      apiKey: process.env.POLYGONSCAN_API_KEY || "UJT71KGZ5M4QUF5TZQ4NHURESJA18SX27K",
    },
  },
});
