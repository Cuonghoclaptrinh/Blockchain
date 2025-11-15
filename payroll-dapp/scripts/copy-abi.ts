// payroll-dapp/scripts/copy-abi.ts
import fs from 'fs';
import path from 'path';

const sourcePath = path.join(__dirname, '../artifacts/contracts/Payroll.sol/Payroll.json');
const destPath = path.join(__dirname, '../../payroll-dapp-frontend/public/Payroll.json');

fs.copyFile(sourcePath, destPath, (err) => {
    if (err) {
        console.error('Lỗi copy ABI:', err);
        process.exit(1);
    }
    console.log('ABI đã được copy thành công vào frontend!');
    console.log(`Từ: ${sourcePath}`);
    console.log(`Đến: ${destPath}`);
});