// scripts/recordWork.ts
import { ethers } from "hardhat";
import { Payroll__factory } from "../typechain-types/factories/contracts/Payroll__factory";

async function main() {
    const payrollAddress = "PASTE_CONTRACT_ADDRESS_HERE";

    const [owner, emp1, emp2] = await ethers.getSigners();
    const payrollAsEmp1 = Payroll__factory.connect(payrollAddress, emp1);

    const tx = await payrollAsEmp1.recordWork(8);
    await tx.wait();

    console.log("Recorded 8 hours for Alice (emp1):", emp1.address);
}

main().catch(console.error);