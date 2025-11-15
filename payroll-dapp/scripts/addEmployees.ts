import { ethers } from "hardhat";

async function main() {
    const payrollAddress = "PASTE_CONTRACT_ADDRESS";
    const [owner, emp1, emp2] = await ethers.getSigners();

    const payroll = await ethers.getContractAt("Payroll", payrollAddress);

    // Example hourly rates: 0.001 ETH/hour -> in wei
    const rate1 = ethers.parseEther("0.001");
    const rate2 = ethers.parseEther("0.002");

    const tx1 = await payroll.addEmployee(emp1.address, "Alice", rate1);
    await tx1.wait();
    console.log("Added", emp1.address);

    const tx2 = await payroll.addEmployee(emp2.address, "Bob", rate2);
    await tx2.wait();
    console.log("Added", emp2.address);
}

main().catch(console.error);
