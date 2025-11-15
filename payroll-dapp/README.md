# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

## Yêu cầu

- Node.js >=18
- MetaMask + Sepolia ETH
- [Alchemy](https://alchemy.com) hoặc [Infura](https://infura.io)
- [Etherscan API Key](https://etherscan.io/myapikey)

---

## Cài đặt

```bash
cd D:\Blockchain\payroll-dapp
npm install

#Tạo file .env (cùng cấp package.json):
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xabc123...your_wallet_private_key
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY

#Compile + Copy ABI tự động vào frontend
npm run update-frontend

#Deploy lên Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
#3. Nạp tiền vào quỹ lương (1 ETH)
npx hardhat verify --network sepolia 0x8d7256C5A1F00eC5F36B71AFf3f1B118F874Ce2F

#chạy mạng local
npx hardhat node
#Deploy lên local
npx hardhat run scripts/deploy.ts --network localhost

npx hardhat compile