// scripts/payAll.ts
import { ethers } from "hardhat";
import { Payroll__factory } from "../typechain-types/factories/contracts/Payroll__factory";

async function main() {
    const payrollAddress = "PASTE_CONTRACT_ADDRESS_HERE";

    const [owner] = await ethers.getSigners();
    const payroll = Payroll__factory.connect(payrollAddress, owner);

    const tx = await payroll.payAll(0, 50); // start = 0, limit = 50
    await tx.wait();

    console.log("Paid first 50 employees");

    // Nếu có >50 nhân viên, gọi tiếp:
    // await payroll.payAll(50, 50);
}

main().catch(console.error);