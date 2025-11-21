// frontend/src/app/api/employee/route.ts
import { NextRequest } from 'next/server';
import { ethers } from 'ethers';
import PayrollABI from '@/public/Payroll.json';
import { CONTRACT_ADDRESS } from '@/constants/contract';

const provider = new ethers.JsonRpcProvider(
    `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
);
const contract = new ethers.Contract(CONTRACT_ADDRESS, PayrollABI.abi, provider);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const addr = searchParams.get('addr');
    const type = searchParams.get('type');

    // === VALIDATE ===
    if (!addr || !type || !ethers.isAddress(addr)) {
        return new Response(JSON.stringify({ error: 'Invalid address or type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        let result;

        switch (type) {
            case 'accrued':
                result = await contract.accruedOf(addr);
                return Response.json({ value: result.toString() }); // ← CHUYỂN SANG STRING

            case 'checkin':
                result = await contract.checkInTs(addr);
                return Response.json({ ts: Number(result) });

            case 'name':
                result = await contract.employees(addr);
                return Response.json({ name: result.name || 'Nhân viên' });

            case 'history':
                const count = await contract.getAttendanceCount(addr);
                const items = [];
                const batchSize = 10;
                for (let i = 0; i < Number(count); i += batchSize) {
                    const batch = Math.min(batchSize, Number(count) - i);
                    const batchData = await contract.getAttendance(addr, i, batch);
                    for (const item of batchData) {
                        items.push({
                            timestamp: Number(item.timestamp),
                            workedHours: Number(item.workedHours),
                        });
                    }
                }
                return Response.json(items.reverse());

            default:
                return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
        }
    } catch (error: any) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Contract call failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}