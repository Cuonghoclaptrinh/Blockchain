
import { ethers } from "hardhat";

const TEST_EMPLOYEES = [
  { addr: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", name: "Alice", rate: "0.001" },
  { addr: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", name: "Bob", rate: "0.0012" },
  { addr: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", name: "Charlie", rate: "0.0009" },
  { addr: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", name: "Diana", rate: "0.0015" },
  { addr: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", name: "Eve", rate: "0.0011" },
  { addr: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", name: "Frank", rate: "0.0013" },
  { addr: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", name: "Grace", rate: "0.001" },
  { addr: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", name: "Hank", rate: "0.0014" },
  { addr: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", name: "Ivy", rate: "0.0008" },
  { addr: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", name: "Jack", rate: "0.0016" },
  { addr: "0xBcd4042DE499D14e55001CcbB24a551F3b954096", name: "Kate", rate: "0.001" },
  { addr: "0x71bE63f3384f5fb98995898A86B02Fb2426c5788", name: "Leo", rate: "0.0012" },
  { addr: "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a", name: "Mona", rate: "0.0011" },
  { addr: "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec", name: "Nina", rate: "0.0013" },
  { addr: "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097", name: "Oscar", rate: "0.001" },
  { addr: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71", name: "Paul", rate: "0.0014" },
  { addr: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30", name: "Quinn", rate: "0.0009" },
  { addr: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", name: "Rita", rate: "0.0015" },
  { addr: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", name: "Sam", rate: "0.0011" },
  { addr: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", name: "Tina", rate: "0.0012" },
];

async function main() {
  const [admin] = await ethers.getSigners();
  console.log("Admin:", admin.address);

  const payroll = await ethers.getContractAt(
    "Payroll",
    "0xBb554f506597890c6dF9Edf97b1C47310b584acA"
  );

  console.log("Đang thêm 20 nhân viên vào contract...");

  for (const emp of TEST_EMPLOYEES) {
    try {
      const tx = await payroll.addEmployee(
        emp.addr,
        emp.name,
        ethers.parseEther(emp.rate)
      );
      await tx.wait();
      console.log(`Đã thêm: ${emp.name} - ${emp.addr.slice(0, 8)}...`);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log(`Bỏ qua: ${emp.name} (đã tồn tại)`);
      } else {
        console.error(`Lỗi thêm ${emp.name}:`, error.shortMessage || error.message);
      }
    }
  }

  console.log("HOÀN TẤT! 20 nhân viên đã được thêm vào contract!");
  console.log("Bây giờ bạn có thể dùng MetaMask import private key để test!");
}

main().catch((error) => {
  console.error("Lỗi script:", error);
  process.exit(1);
});