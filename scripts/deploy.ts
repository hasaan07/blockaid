import { network } from "hardhat";

async function main() {
  const { ethers, networkName } = await network.connect();

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.info("============================================");
  console.info("Deploying CampaignFactory");
  console.info("============================================");
  console.info("Network:         ", networkName);
  console.info("Deployer:        ", deployer.address);
  console.info("Deployer balance:", ethers.formatEther(balance), "POL");
  console.info("--------------------------------------------");

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 POL. Get test POL from https://faucet.polygon.technology"
    );
  }

  const factory = await ethers.deployContract("CampaignFactory");
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  const txHash = factory.deploymentTransaction()?.hash;

  console.info("\u2714 CampaignFactory deployed");
  console.info("  Address:    ", address);
  console.info("  Tx hash:    ", txHash);
  console.info("  Explorer:   ", `https://amoy.polygonscan.com/address/${address}`);
  console.info("============================================");
  console.info("\nNext step: paste this address into .env.local as");
  console.info(`NEXT_PUBLIC_FACTORY_ADDRESS=${address}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
