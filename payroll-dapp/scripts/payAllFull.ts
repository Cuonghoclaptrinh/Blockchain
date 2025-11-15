// scripts/payAllFull.ts
import { ethers } from "hardhat";
import { Payroll__factory } from "../typechain-types/factories/contracts/Payroll__factory";

async function main() {
    const payrollAddress = "PASTE_CONTRACT_ADDRESS";
    const [owner] = await ethers.getSigners();
    const payroll = Payroll__factory.connect(payrollAddress, owner);

    const count = await payroll.getEmployeeCount();
    console.log("Total employees:", count.toString());

    const BATCH_SIZE = 50;
    for (let start = 0; start < count; start += BATCH_SIZE) {
        const tx = await payroll.payAll(start, BATCH_SIZE);
        await tx.wait();
        console.log(`Paid batch: ${start} -> ${start + BATCH_SIZE}`);
    }

    console.log("All employees paid!");
}

main().catch(console.error);