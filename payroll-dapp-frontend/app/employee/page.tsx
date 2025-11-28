
'use client';

import { usePayrollContract } from '@/hooks/usePayrollContract';
import { usePublicClient } from 'wagmi';
import { formatEther, decodeEventLog } from 'viem';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';
import { useToast } from '@/hooks/useToast';

interface HistoryItem {
    date: string;
    hours: number; // phút
    amount: string;
}

export default function EmployeePage() {
    const { address, checkIn, checkOut, withdraw, isPending, currency } =
        usePayrollContract();

    const publicClient = usePublicClient();
    const toast = useToast();

    const [accrued, setAccrued] = useState('0');
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [workedToday, setWorkedToday] = useState(0);
    const [name, setName] = useState('Nhân viên');
    const [rate, setRate] = useState(0);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEmployee, setIsEmployee] = useState(false);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);



    useEffect(() => {
        if (!address || !publicClient) return;

        const fetchAll = async () => {
            setLoading(true);
            try {
                // 1. Lấy thông tin nhân viên
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

                const accruedRaw = (await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'accruedOf',
                    args: [address],
                })) as bigint;
                setAccrued(formatEther(accruedRaw));

                // 2. Lấy check-in hiện tại
                const checkInLogs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    fromBlock: BigInt(0),
                    toBlock: 'latest',
                    event: {
                        name: 'CheckedIn',
                        type: 'event',
                        inputs: [
                            { name: 'who', type: 'address', indexed: true },
                            { name: 'ts', type: 'uint256' },
                        ],
                    },
                });

                let latestCheckIn: Date | null = null;
                for (const log of checkInLogs) {
                    const decoded = decodeEventLog({
                        abi: CONTRACT_ABI,
                        data: log.data,
                        topics: log.topics,
                    });
                    if (
                        decoded.eventName === 'CheckedIn' &&
                        (decoded.args as any).who?.toLowerCase() === address.toLowerCase()
                    ) {
                        const block = await publicClient.getBlock({
                            blockNumber: log.blockNumber,
                        });
                        const time = new Date(Number(block.timestamp) * 1000);
                        if (!latestCheckIn || time > latestCheckIn) latestCheckIn = time;
                    }
                }

                // 3. Kiểm tra check-out mới nhất
                const checkOutLogs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    fromBlock: BigInt(0),
                    toBlock: 'latest',
                    event: {
                        name: 'CheckedOut',
                        type: 'event',
                        inputs: [
                            { name: 'who', type: 'address', indexed: true },
                            { name: 'ts', type: 'uint256' },
                            { name: 'workedHours', type: 'uint256' },
                        ],
                    },
                });

                let hasCheckedOut = false;
                for (const log of checkOutLogs) {
                    const decoded = decodeEventLog({
                        abi: CONTRACT_ABI,
                        data: log.data,
                        topics: log.topics,
                    });
                    if (
                        decoded.eventName === 'CheckedOut' &&
                        (decoded.args as any).who?.toLowerCase() === address.toLowerCase()
                    ) {
                        const block = await publicClient.getBlock({
                            blockNumber: log.blockNumber,
                        });
                        const time = new Date(Number(block.timestamp) * 1000);
                        if (latestCheckIn && time > latestCheckIn) hasCheckedOut = true;
                    }
                }

                setCheckInTime(hasCheckedOut ? null : latestCheckIn);

                // 4. Lịch sử chấm công (10 phiên gần nhất)
                const sessions: HistoryItem[] = [];
                for (const log of checkOutLogs) {
                    const decoded = decodeEventLog({
                        abi: CONTRACT_ABI,
                        data: log.data,
                        topics: log.topics,
                    });
                    if (decoded.eventName !== 'CheckedOut') continue;
                    const args = decoded.args as any;
                    if (args.who?.toLowerCase() !== address.toLowerCase()) continue;

                    const block = await publicClient.getBlock({
                        blockNumber: log.blockNumber,
                    });
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
    }, [address, publicClient]);

    // Đếm giờ đang làm việc
    useEffect(() => {
        if (!checkInTime) return;
        const timer = setInterval(() => {
            setWorkedToday((Date.now() - checkInTime.getTime()) / 1000 / 3600);
        }, 1000);
        return () => clearInterval(timer);
    }, [checkInTime]);

    const handleCheckIn = async () => {
        const id = toast.loading('Đang check-in...');
        try {
            await checkIn();
            toast.dismiss(id);
            toast.success('Check-in thành công!');
            setCheckInTime(new Date());
        } catch (e: any) {
            toast.dismiss(id);
            toast.error(e?.message || 'Check-in thất bại!');
        }
    };

    const handleCheckOut = async () => {
        const id = toast.loading('Đang check-out...');
        try {
            await checkOut();
            toast.dismiss(id);
            toast.success('Check-out thành công!');
            setCheckInTime(null);
            setWorkedToday(0);
        } catch (e: any) {
            toast.dismiss(id);
            toast.error(e?.message || 'Check-out thất bại!');
        }
    };

    const handleWithdraw = async () => {
        if (Number(accrued) === 0) {
            toast.error('Chưa có lương để rút!');
            return;
        }
        const id = toast.loading('Đang rút lương...');
        try {
            await withdraw();
            toast.dismiss(id);
            toast.success('Rút lương thành công!');
            setAccrued('0');
        } catch (e: any) {
            toast.dismiss(id);
            toast.error(e?.message || 'Rút lương thất bại!');
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-xs text-slate-400">Đang khởi tạo...</p>
            </div>
        );
    }

    // Các trạng thái đặc biệt
    if (!address) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md rounded-2xl border border-amber-100 bg-white px-6 py-8 text-center shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
                        Chưa kết nối ví
                    </p>
                    <p className="mt-3 text-lg font-bold text-slate-900">
                        Vui lòng kết nối ví (MetaMask, Rainbow...) để chấm công và xem lương.
                    </p>
                </div>
            </div>
        );
    }

    // if (loading === true) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-slate-50">
    //             <div className="flex flex-col items-center">
    //                 <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    //                 <p className="mt-3 text-sm font-medium text-slate-600">Đang tải dữ liệu…</p>
    //             </div>
    //         </div>
    //     );
    // }

    if (!isEmployee) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                        Không có quyền
                    </p>
                    <p className="mt-3 text-lg font-bold text-slate-900">
                        Ví hiện tại chưa được đăng ký là nhân viên.
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Vui lòng liên hệ Admin để được thêm vào danh sách nhân viên.
                    </p>
                </div>
            </div>
        );
    }

    // UI chính
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
                {/* HEADER / PROFILE */}
                <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-600 p-[1px] shadow-lg">
                    <div className="rounded-3xl bg-slate-950/5 px-6 py-6 text-white backdrop-blur">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-100">
                                    Employee
                                </p>
                                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                    Xin chào, {name}!
                                </h1>
                                <p className="mt-1 text-xs text-indigo-100/90">
                                    Ví:{' '}
                                    <span className="font-mono">
                                        {address.slice(0, 8)}...{address.slice(-6)}
                                    </span>
                                </p>
                            </div>
                            <div className="rounded-2xl bg-black/20 px-4 py-3 text-right text-xs">
                                <p className="text-indigo-100/80">Lương / giờ</p>
                                <p className="mt-1 text-lg font-semibold">
                                    {rate.toFixed(6)} {currency}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CHẤM CÔNG HÔM NAY */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                        Chấm công hôm nay
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Bấm <span className="font-semibold text-emerald-600">Check-in</span> khi
                        bắt đầu và <span className="font-semibold text-rose-600">Check-out</span>{' '}
                        khi kết thúc ca làm.
                    </p>

                    {checkInTime ? (
                        <div className="mt-5 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                            <p className="text-center text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                Đang làm việc
                            </p>
                            <p className="text-center text-xs text-slate-600">
                                Check-in lúc{' '}
                                <span className="font-medium text-slate-800">
                                    {format(checkInTime, 'HH:mm, dd/MM/yyyy')}
                                </span>
                            </p>
                            <p className="text-center text-2xl font-semibold text-emerald-700">
                                {Math.floor(workedToday)} giờ{' '}
                                {Math.floor((workedToday * 60) % 60)} phút
                            </p>
                            <button
                                onClick={handleCheckOut}
                                disabled={isPending}
                                className="mt-2 w-full rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isPending ? 'Đang check-out…' : 'Check-out'}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                            <p className="text-sm font-medium text-slate-700">
                                Bạn chưa check-in hôm nay.
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Hãy check-in ngay khi bắt đầu ca làm để hệ thống tính lương chính xác.
                            </p>
                            <button
                                onClick={handleCheckIn}
                                disabled={isPending}
                                className="mt-4 w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isPending ? 'Đang check-in…' : 'Check-in'}
                            </button>
                        </div>
                    )}
                </section>

                {/* LƯƠNG TÍCH LŨY */}
                <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">Lương tích lũy</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Số tiền bạn có thể rút ngay bây giờ từ hợp đồng.
                    </p>
                    <p className="mt-4 text-3xl font-extrabold text-emerald-600">
                        {Number(accrued).toFixed(6)} {currency}
                    </p>
                    <button
                        onClick={handleWithdraw}
                        disabled={isPending || Number(accrued) === 0}
                        className="mt-4 w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {Number(accrued) === 0
                            ? 'Chưa có lương để rút'
                            : isPending
                                ? 'Đang rút lương…'
                                : 'Rút lương ngay'}
                    </button>
                </section>

                {/* LỊCH SỬ CHẤM CÔNG */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                        Lịch sử chấm công (10 phiên gần nhất)
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Dữ liệu được lấy từ các sự kiện check-out on-chain.
                    </p>

                    {history.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            Chưa có dữ liệu chấm công nào được ghi nhận.
                        </div>
                    ) : (
                        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
                            {history.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm shadow-sm"
                                >
                                    <div>
                                        <p className="font-medium text-slate-800">{item.date}</p>
                                        <p className="text-xs text-slate-500">
                                            {Math.floor(item.hours / 60)} giờ {item.hours % 60} phút
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-emerald-600">
                                            {item.amount} {currency}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}