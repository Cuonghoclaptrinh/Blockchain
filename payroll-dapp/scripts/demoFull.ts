// scripts/demoFull.ts
import { ethers } from "hardhat";

async function main() {
    const [owner, emp1, emp2] = await ethers.getSigners();
    console.log("Owner:", owner.address);
    console.log("Alice:", emp1.address);
    console.log("Bob:  ", emp2.address);

    // 1. Deploy
    console.log("\nDeploying Payroll...");
    const Payroll = await ethers.getContractFactory("Payroll");
    const payroll = await Payroll.deploy();
    await payroll.waitForDeployment();
    const address = await payroll.getAddress();
    console.log("Deployed to:", address);

    // 2. Add employees
    console.log("\nAdding employees...");
    const rate1 = ethers.parseEther("0.001"); // 0.001 ETH/giờ
    const rate2 = ethers.parseEther("0.002");
    await (await payroll.addEmployee(emp1.address, "Alice", rate1)).wait();
    await (await payroll.addEmployee(emp2.address, "Bob", rate2)).wait();
    console.log("Added Alice (0.001 ETH/h) & Bob (0.002 ETH/h)");

    // 3. Deposit 1 ETH
    console.log("\nDepositing 1 ETH...");
    await (await owner.sendTransaction({ to: address, value: ethers.parseEther("1") })).wait();
    console.log("Deposited 1 ETH");

    // 4. Record work: Alice làm 8h
    console.log("\nAlice records 8 hours...");
    const payrollAsEmp1 = payroll.connect(emp1);
    await (await payrollAsEmp1.recordWork(8)).wait();
    const expected = 8 * 0.001; // 0.008 ETH
    console.log(`Alice earned: ${expected} ETH`);

    // 5. Pay all
    console.log("\nPaying all employees...");
    await (await payroll.payAll(0, 50)).wait();
    console.log("Paid all!");

    // 6. Final check
    const accrued = await payroll.accruedOf(emp1.address);
    const balance = await payroll.contractBalance();
    console.log("\nFINAL CHECK:");
    console.log("  Alice accrued:", ethers.formatEther(accrued), "ETH (should be 0)");
    console.log("  Contract balance:", ethers.formatEther(balance), "ETH (should be ~0.992)");
}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});