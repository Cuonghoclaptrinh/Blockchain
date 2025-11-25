    'use client';
    import { usePublicClient } from 'wagmi';
    import { useEffect, useState } from 'react';
    import { format } from 'date-fns';
    import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';
    import { decodeEventLog } from 'viem';
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
                try {
                    const logs = await publicClient.getLogs({
                        address: CONTRACT_ADDRESS,
                        fromBlock: 0n,
                        toBlock: 'latest',
                    });

                    const allPayments: Payment[] = [];

                    for (const log of logs) {
                        try {
                            const decoded = decodeEventLog({ abi: CONTRACT_ABI, data: log.data, topics: log.topics });

                            if (decoded.eventName === 'Withdrawn' || decoded.eventName === 'SalaryPaid') {
                                const args = decoded.args as any;
                                const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                                const date = new Date(Number(block.timestamp) * 1000);

                                const isWithdraw = decoded.eventName === 'Withdrawn';
                                allPayments.push({
                                    date: format(date, 'dd/MM/yyyy HH:mm:ss'),
                                    employee: args.who || args.to,
                                    shortAddress: `${(args.who || args.to).slice(0, 8)}...${(args.who || args.to).slice(-6)}`,
                                    amount: Number(formatEther(args.amount)).toFixed(6),
                                    type: isWithdraw ? 'withdraw' : 'admin-pay',
                                    txType: isWithdraw ? 'Nhân viên tự rút' : 'Admin trả lương',
                                });
                            }
                        } catch (e) {
                            // Bỏ qua log không decode được
                        }
                    }

                    // Sắp xếp mới nhất lên đầu
                    setPayments(allPayments.sort((a, b) => b.date.localeCompare(a.date)));
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
                                <p className="text-xl text-gray-600">Đang tải lịch sử trả lương...</p>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-xl">
                                <p className="text-2xl text-gray-500">Chưa có giao dịch trả lương nào</p>
                                <p className="text-sm text-gray-400 mt-2">Khi có nhân viên rút lương hoặc admin trả lương, sẽ hiện ở đây</p>
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
                                                <p className={`font-bold text-lg ${p.type === 'withdraw' ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {p.txType}
                                                </p>
                                                <p className="text-sm text-gray-500">{p.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-10">
                        <p className="text-sm text-gray-500">
                            Dữ liệu được lấy trực tiếp từ blockchain • Minh bạch • Không thể sửa đổi
                        </p>
                    </div>
                </div>
            </div>
        );
    }