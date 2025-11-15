// scripts/deploy.js
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    const Payroll = await ethers.getContractFactory("Payroll");
    console.log("Deploying Payroll...");

    const payroll = await Payroll.deploy();
    await payroll.waitForDeployment();

    console.log("Payroll deployed to:", payroll.target);
    console.log("Admin address:", deployer.address);
    console.log("");
    console.log("CẬP NHẬT CONTRACT_ADDRESS TRONG FE:");
    console.log(`export const CONTRACT_ADDRESS = "${payroll.target}" as const;`);
}

main().catch((error) => {
    console.error("Deploy failed:", error);
    process.exit(1);
});