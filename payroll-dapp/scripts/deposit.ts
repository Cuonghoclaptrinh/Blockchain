import { ethers } from "hardhat";

async function main() {
    const payrollAddress = "PASTE_CONTRACT_ADDRESS";
    const payroll = await ethers.getContractAt("Payroll", payrollAddress);
    const [owner] = await ethers.getSigners();

    const tx = await owner.sendTransaction({ to: payrollAddress, value: ethers.parseEther("1.0") });
    await tx.wait();
    console.log("Deposited 1 ETH to contract");
}

main().catch(console.error);
