// src/app/employee/page.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { useEffect, useState } from 'react';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';
import { decodeEventLog } from 'viem';
import { useToast } from '@/hooks/useToast'; // THÊM TOAST

interface HistoryItem {
    date: string;
    hours: number; // phút
    amount: string;
}

export default function EmployeePage() {
    const {
        address,
        checkIn,
        checkOut,
        withdraw,
        isPending,
        currency,
    } = usePayrollContract();

    const publicClient = usePublicClient();
    const toast = useToast(); // DÙNG TOAST

    const [accrued, setAccrued] = useState('0');
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [workedToday, setWorkedToday] = useState(0);
    const [name, setName] = useState('Nhân viên');
    const [rate, setRate] = useState(0);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEmployee, setIsEmployee] = useState(false);

    useEffect(() => {
        if (!address || !publicClient) return;

        const fetchAll = async () => {
            setLoading(true);
            try {
                // 1. LẤY THÔNG TIN NHÂN VIÊN
                const empInfo: any = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'employees',
                    args: [address],
                });

                let exists = false;
                let empName = 'Nhân viên';
                let empRate = 0n;

                if (empInfo) {
                    if ('exists' in empInfo) {
                        exists = !!empInfo.exists;
                        empName = empInfo.name || empName;
                        empRate = empInfo.hourlyRate || 0n;
                    } else if (Array.isArray(empInfo) && empInfo.length >= 4) {
                        exists = !!empInfo[3];
                        empName = empInfo[0] || empName;
                        empRate = empInfo[1] || 0n;
                    }
                }

                if (!exists) {
                    setIsEmployee(false);
                    setLoading(false);
                    return;
                }

                setIsEmployee(true);
                setName(empName);
                setRate(Number(formatEther(empRate)));

                const accruedRaw = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'accruedOf',
                    args: [address],
                }) as bigint;
                setAccrued(formatEther(accruedRaw));

                // 2. LẤY CHECK-IN HIỆN TẠI
                const checkInLogs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    fromBlock: BigInt(0),
                    toBlock: 'latest',
                    event: { name: 'CheckedIn', type: 'event', inputs: [{ name: 'who', type: 'address', indexed: true }, { name: 'ts', type: 'uint256' }] },
                });

                let latestCheckIn: Date | null = null;
                for (const log of checkInLogs) {
                    const decoded = decodeEventLog({ abi: CONTRACT_ABI, data: log.data, topics: log.topics });
                    if (decoded.eventName === 'CheckedIn' && (decoded.args as any).who?.toLowerCase() === address.toLowerCase()) {
                        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                        const time = new Date(Number(block.timestamp) * 1000);
                        if (!latestCheckIn || time > latestCheckIn) latestCheckIn = time;
                    }
                }

                // 3. KIỂM TRA CHECK-OUT MỚI NHẤT
                const checkOutLogs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    fromBlock: BigInt(0),
                    toBlock: 'latest',
                    event: { name: 'CheckedOut', type: 'event', inputs: [{ name: 'who', type: 'address', indexed: true }, { name: 'ts', type: 'uint256' }, { name: 'workedHours', type: 'uint256' }] },
                });

                let hasCheckedOut = false;
                for (const log of checkOutLogs) {
                    const decoded = decodeEventLog({ abi: CONTRACT_ABI, data: log.data, topics: log.topics });
                    if (decoded.eventName === 'CheckedOut' && (decoded.args as any).who?.toLowerCase() === address.toLowerCase()) {
                        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                        const time = new Date(Number(block.timestamp) * 1000);
                        if (latestCheckIn && time > latestCheckIn) hasCheckedOut = true;
                    }
                }

                setCheckInTime(hasCheckedOut ? null : latestCheckIn);

                // 4. LỊCH SỬ CHẤM CÔNG (10 phiên gần nhất)
                const sessions: HistoryItem[] = [];
                for (const log of checkOutLogs) {
                    const decoded = decodeEventLog({ abi: CONTRACT_ABI, data: log.data, topics: log.topics });
                    if (decoded.eventName !== 'CheckedOut') continue;
                    const args = decoded.args as any;
                    if (args.who?.toLowerCase() !== address.toLowerCase()) continue;

                    const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                    const time = new Date(Number(block.timestamp) * 1000);
                    const minutes = Number(args.workedHours);
                    const amount = (minutes * Number(formatEther(empRate))) / 60;

                    sessions.push({
                        date: format(time, 'dd/MM/yyyy'),
                        hours: minutes,
                        amount: amount.toFixed(8),
                    });
                }
                setHistory(sessions.reverse().slice(0, 10));

            } catch (error) {
                console.error('Lỗi tải dữ liệu:', error);
                toast.error('Lỗi tải dữ liệu nhân viên!');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 10000);
        return () => clearInterval(interval);
    }, [address, publicClient, toast]);

    // ĐẾM GIỜ ĐANG LÀM VIỆC
    useEffect(() => {
        if (!checkInTime) return;
        const timer = setInterval(() => {
            setWorkedToday((Date.now() - checkInTime.getTime()) / 1000 / 3600);
        }, 1000);
        return () => clearInterval(timer);
    }, [checkInTime]);

    const handleCheckIn = async () => {
        toast.loading('Đang check-in...');
        try {
            await checkIn();
            toast.success('Check-in thành công!');
            setCheckInTime(new Date());
        } catch (e: any) {
            toast.error(e.message || 'Check-in thất bại!');
        }
    };

    const handleCheckOut = async () => {
        toast.loading('Đang check-out...');
        try {
            await checkOut();
            toast.success('Check-out thành công!');
            setCheckInTime(null);
            setWorkedToday(0);
        } catch (e: any) {
            toast.error(e.message || 'Check-out thất bại!');
        }
    };

    const handleWithdraw = async () => {
        if (Number(accrued) === 0) {
            toast.error('Chưa có lương để rút!');
            return;
        }
        toast.loading('Đang rút lương...');
        try {
            await withdraw();
            toast.success('Rút lương thành công!');
            setAccrued('0');
        } catch (e: any) {
            toast.error(e.message || 'Rút lương thất bại!');
        }
    };

    if (!address) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"><p className="text-xl text-red-600 font-bold">Kết nối ví MetaMask!</p></div>;
    // if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"><p className="text-xl font-semibold text-indigo-700">Đang tải...</p></div>;
    if (!isEmployee) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"><p className="text-xl text-red-600 font-bold">Bạn chưa là nhân viên!</p></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-6">

                <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                    <h1 className="text-3xl font-bold text-indigo-900">Xin chào, {name}!</h1>
                    <p className="text-sm text-gray-600 mt-1">Ví: {address.slice(0, 8)}...{address.slice(-6)}</p>
                    <p className="text-xs text-green-600 mt-2">Lương/giờ: {rate.toFixed(6)} {currency}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Chấm công hôm nay</h2>
                    {checkInTime ? (
                        <div className="text-center space-y-3">
                            <p className="text-green-600 font-bold text-lg">Đang làm việc</p>
                            <p className="text-sm text-gray-600">Check-in: {format(checkInTime, 'HH:mm, dd/MM/yyyy')}</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {Math.floor(workedToday)} giờ {Math.floor((workedToday * 60) % 60)} phút
                            </p>
                            <button onClick={handleCheckOut} disabled={isPending} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50">
                                {isPending ? 'Đang check-out...' : 'Check-out'}
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleCheckIn} disabled={isPending} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50">
                            {isPending ? 'Đang check-in...' : 'Check-in'}
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Lương tích lũy</h2>
                    <p className="text-4xl font-extrabold text-green-600">{Number(accrued).toFixed(6)} {currency}</p>
                    <button onClick={handleWithdraw} disabled={isPending || Number(accrued) === 0} className="mt-5 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50">
                        {Number(accrued) === 0 ? 'Chưa có lương' : 'Rút lương ngay'}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch sử chấm công (10 phiên)</h2>
                    {history.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">Chưa có dữ liệu</p>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {history.map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.date}</p>
                                        <p className="text-sm text-gray-600">
                                            {Math.floor(item.hours / 60)} giờ {item.hours % 60} phút
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">{item.amount} {currency}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}