'use client';
import { usePublicClient } from 'wagmi';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CONTRACT_ADDRESS } from '@/constants/contract';
import { formatEther } from 'viem';

interface Payment {
    date: string;
    employee: string;
    shortAddress: string;
    amount: string;
    type: 'withdraw' | 'admin-pay';
    txType: string;
}

export default function HistoryPage() {
    const publicClient = usePublicClient();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!publicClient) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                // 🔹 Lấy block hiện tại
                const latestBlock = await publicClient.getBlockNumber();
                const RANGE = 9n; // free plan: tối đa 10 block / eth_getLogs
                const fromBlock =
                    latestBlock > RANGE ? latestBlock - RANGE : 0n;

                // 🔹 Lấy log cho 2 event trong phạm vi 10 block gần nhất
                const [withdrawLogs, salaryLogs] = await Promise.all([
                    publicClient.getLogs({
                        address: CONTRACT_ADDRESS,
                        fromBlock,
                        toBlock: latestBlock,
                        event: {
                            name: 'Withdrawn',
                            type: 'event',
                            inputs: [
                                { name: 'who', type: 'address', indexed: true },
                                { name: 'amount', type: 'uint256' },
                            ],
                        },
                    }),
                    publicClient.getLogs({
                        address: CONTRACT_ADDRESS,
                        fromBlock,
                        toBlock: latestBlock,
                        event: {
                            name: 'SalaryPaid',
                            type: 'event',
                            inputs: [
                                { name: 'to', type: 'address', indexed: true },
                                { name: 'amount', type: 'uint256' },
                            ],
                        },
                    }),
                ]);

                const allPayments: Payment[] = [];

                // 🔹 Xử lý Withdrawn
                for (const log of withdrawLogs) {
                    const args: any = log.args;
                    const block = await publicClient.getBlock({
                        blockNumber: log.blockNumber!,
                    });
                    const date = new Date(Number(block.timestamp) * 1000);

                    const addr = args.who as string;
                    const amountWei = args.amount as bigint;

                    allPayments.push({
                        date: format(date, 'dd/MM/yyyy HH:mm:ss'),
                        employee: addr,
                        shortAddress: `${addr.slice(0, 8)}...${addr.slice(-6)}`,
                        amount: Number(formatEther(amountWei)).toFixed(6),
                        type: 'withdraw',
                        txType: 'Nhân viên tự rút',
                    });
                }

                // 🔹 Xử lý SalaryPaid
                for (const log of salaryLogs) {
                    const args: any = log.args;
                    const block = await publicClient.getBlock({
                        blockNumber: log.blockNumber!,
                    });
                    const date = new Date(Number(block.timestamp) * 1000);

                    const addr = args.to as string;
                    const amountWei = args.amount as bigint;

                    allPayments.push({
                        date: format(date, 'dd/MM/yyyy HH:mm:ss'),
                        employee: addr,
                        shortAddress: `${addr.slice(0, 8)}...${addr.slice(-6)}`,
                        amount: Number(formatEther(amountWei)).toFixed(6),
                        type: 'admin-pay',
                        txType: 'Admin trả lương',
                    });
                }

                // 🔹 Sắp xếp mới nhất lên trên
                allPayments.sort((a, b) => b.date.localeCompare(a.date));
                setPayments(allPayments);
            } catch (error) {
                console.error('Lỗi tải lịch sử:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 15000);
        return () => clearInterval(interval);
    }, [publicClient]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-4xl font-bold text-indigo-900 text-center mb-8">
                        Lịch sử trả lương
                    </h1>

                    {loading ? (
                        <div className="text-center py-20">
                            <p className="text-xl text-gray-600">
                                Đang tải lịch sử trả lương...
                            </p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl">
                            <p className="text-2xl text-gray-500">
                                Chưa có giao dịch trả lương nào
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                Khi có nhân viên rút lương hoặc admin trả lương,
                                sẽ hiện ở đây
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((p, i) => (
                                <div
                                    key={i}
                                    className={`p-6 rounded-xl border-2 transition-all ${p.type === 'withdraw'
                                            ? 'bg-green-50 border-green-300 hover:bg-green-100'
                                            : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-800">
                                                {p.amount} ETH
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {p.shortAddress} • {p.employee}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={`font-bold text-lg ${p.type === 'withdraw'
                                                        ? 'text-green-600'
                                                        : 'text-blue-600'
                                                    }`}
                                            >
                                                {p.txType}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {p.date}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="text-center mt-10">
                    <p className="text-sm text-gray-500">
                        Dữ liệu được lấy trực tiếp từ blockchain • Minh bạch •
                        Không thể sửa đổi
                    </p>
                </div>
            </div>
        </div>
    );
}
