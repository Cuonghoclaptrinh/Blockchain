// scripts/deposit-any-amount.ts
import { ethers } from "hardhat";
import * as readline from "readline";

// Tạo interface để nhập từ terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function main() {
    const [admin] = await ethers.getSigners();
    console.log("Admin ví:", admin.address);

    // Nhập địa chỉ contract (thay bằng địa chỉ thật của bạn)
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    const payroll = await ethers.getContractAt("Payroll", contractAddress);

    // Hỏi người dùng muốn nạp bao nhiêu ETH
    rl.question("Nhập số ETH bạn muốn nạp (ví dụ: 100, 500, 1000): ", async (input) => {
        const amount = parseFloat(input);

        if (isNaN(amount) || amount <= 0) {
            console.log("Số ETH không hợp lệ!");
            rl.close();
            return;
        }

        try {
            console.log(`Đang nạp ${amount} ETH vào contract...`);

            const tx = await payroll.deposit({
                value: ethers.parseEther(amount.toString()),
            });

            console.log("Giao dịch đang xử lý...");
            await tx.wait();

            const balance = await payroll.contractBalance();
            console.log("HOÀN TẤT!");
            console.log(`Số dư quỹ hiện tại: ${ethers.formatEther(balance)} ETH`);
        } catch (error: any) {
            console.error("Lỗi nạp ETH:", error.shortMessage || error.message);
        } finally {
            rl.close();
        }
    });
}

main().catch((error) => {
    console.error("Lỗi script:", error);
    process.exit(1);
});