// src/app/admin/history/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useWatchContractEvent, usePublicClient } from 'wagmi';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { formatEther, decodeEventLog, getEventSelector } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';
import Link from 'next/link';

const DEPOSITED_EVENT = 'Deposited(address,uint256)';
const WITHDRAWN_EVENT = 'Withdrawn(address,uint256)';
const SALARYPAID_EVENT = 'SalaryPaid(address,uint256)';

const DEPOSITED_SELECTOR = getEventSelector(DEPOSITED_EVENT);
const WITHDRAWN_SELECTOR = getEventSelector(WITHDRAWN_EVENT);
const SALARYPAID_SELECTOR = getEventSelector(SALARYPAID_EVENT);

interface HistoryEvent {
    type: 'deposit' | 'withdraw' | 'salary';
    from?: `0x${string}`;
    to: `0x${string}`;
    amount: string;
    timestamp: string;
    txHash: `0x${string}`;
    blockNumber: number;
}

const PAGE_SIZE = 10;

export default function HistoryPage() {
    const { isOwner } = usePayrollContract();
    const publicClient = usePublicClient();
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // === TÍNH latestBlock TỪ history (KHÔNG CẦN STATE RIÊNG) ===
    const latestBlock = history.length > 0
        ? Math.max(...history.map(e => e.blockNumber))
        : 0;

    const parseLog = async (log: any): Promise<HistoryEvent | null> => {
        if (!publicClient || !log.topics?.[0] || !log.data) return null;

        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        const timestamp = new Date(Number(block.timestamp) * 1000).toLocaleString('vi-VN');

        try {
            if (log.topics[0] === DEPOSITED_SELECTOR) {
                const decoded = decodeEventLog({
                    abi: CONTRACT_ABI,
                    data: log.data,
                    topics: log.topics,
                    eventName: 'Deposited',
                });
                const args = decoded.args as unknown as { from: `0x${string}`; amount: bigint };
                return {
                    type: 'deposit',
                    from: args.from,
                    to: CONTRACT_ADDRESS,
                    amount: formatEther(args.amount),
                    timestamp,
                    txHash: log.transactionHash,
                    blockNumber: Number(log.blockNumber),
                };
            }

            if (log.topics[0] === WITHDRAWN_SELECTOR) {
                const decoded = decodeEventLog({
                    abi: CONTRACT_ABI,
                    data: log.data,
                    topics: log.topics,
                    eventName: 'Withdrawn',
                });
                const args = decoded.args as unknown as { who: `0x${string}`; amount: bigint };
                return {
                    type: 'withdraw',
                    to: args.who,
                    amount: formatEther(args.amount),
                    timestamp,
                    txHash: log.transactionHash,
                    blockNumber: Number(log.blockNumber),
                };
            }

            if (log.topics[0] === SALARYPAID_SELECTOR) {
                const decoded = decodeEventLog({
                    abi: CONTRACT_ABI,
                    data: log.data,
                    topics: log.topics,
                    eventName: 'SalaryPaid',
                });
                const args = decoded.args as unknown as { to: `0x${string}`; amount: bigint };
                return {
                    type: 'salary',
                    to: args.to,
                    amount: formatEther(args.amount),
                    timestamp,
                    txHash: log.transactionHash,
                    blockNumber: Number(log.blockNumber),
                };
            }
        } catch {
            return null;
        }
        return null;
    };

    // === LẤY TOÀN BỘ LỊCH SỬ ===
    useEffect(() => {
        if (!publicClient || !isOwner) return;

        const fetchHistory = async () => {
            setLoading(true);
            const events: HistoryEvent[] = [];

            try {
                const logs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    fromBlock: BigInt(0),
                    toBlock: 'latest',
                });

                for (const log of logs) {
                    const parsed = await parseLog(log);
                    if (parsed) events.push(parsed);
                }

                setHistory(events.sort((a, b) => b.blockNumber - a.blockNumber));
            } catch (err) {
                console.error('Lỗi khi lấy lịch sử:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [publicClient, isOwner]);

    // === THEO DÕI REALTIME (3 hook riêng) ===
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: 'Deposited',
        fromBlock: latestBlock > 0 ? BigInt(latestBlock + 1) : undefined,
        onLogs: async (logs) => {
            for (const log of logs) {
                const parsed = await parseLog(log);
                if (parsed) setHistory((prev) => [parsed, ...prev]);
            }
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: 'Withdrawn',
        fromBlock: latestBlock > 0 ? BigInt(latestBlock + 1) : undefined,
        onLogs: async (logs) => {
            for (const log of logs) {
                const parsed = await parseLog(log);
                if (parsed) setHistory((prev) => [parsed, ...prev]);
            }
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: 'SalaryPaid',
        fromBlock: latestBlock > 0 ? BigInt(latestBlock + 1) : undefined,
        onLogs: async (logs) => {
            for (const log of logs) {
                const parsed = await parseLog(log);
                if (parsed) setHistory((prev) => [parsed, ...prev]);
            }
        },
    });

    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <p className="text-3xl font-bold text-red-600">Chỉ Admin mới xem được lịch sử!</p>
            </div>
        );
    }

    const totalPages = Math.ceil(history.length / PAGE_SIZE);
    const paginated = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
            <div className="max-w-6xl mx-auto">

                {/* NÚT TRỞ LẠI */}
                <div className="mb-8">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        ← Quay lại Admin Dashboard
                    </Link>
                </div>

                <h1 className="text-5xl font-bold text-indigo-900 text-center mb-10 drop-shadow-lg">
                    Lịch Sử Hoạt Động
                </h1>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-8 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-6 text-xl text-gray-600">Đang tải toàn bộ lịch sử...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 bg-white/80 backdrop-blur rounded-3xl shadow-2xl">
                        <p className="text-3xl text-gray-500 font-bold">Chưa có giao dịch nào</p>
                        <p className="text-lg text-gray-600 mt-4">
                            Khi có nạp tiền, rút lương, trả lương → sẽ hiện ở đây
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                                    <tr>
                                        <th className="px-8 py-5 text-left">Loại</th>
                                        <th className="px-8 py-5 text-left">Từ</th>
                                        <th className="px-8 py-5 text-left">Đến</th>
                                        <th className="px-8 py-5 text-right">Số tiền (GO)</th>
                                        <th className="px-8 py-5 text-center">Thời gian</th>
                                        <th className="px-8 py-5 text-center">Giao dịch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((event, i) => (
                                        <tr key={i} className="border-b hover:bg-gray-50 transition">
                                            <td className="px-8 py-5">
                                                <span
                                                    className={`px-4  py-2 rounded-full text-sm font-bold ${event.type === 'deposit'
                                                            ? 'bg-green-100 text-green-800'
                                                            : event.type === 'withdraw'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                >
                                                    {event.type === 'deposit' ? 'NẠP' : event.type === 'withdraw' ? 'RÚT' : 'TRẢ LƯƠNG'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-sm">
                                                {event.from ? `${event.from.slice(0, 8)}...${event.from.slice(-6)}` : '-'}
                                            </td>
                                            <td className="px-8 py-5 font-mono text-sm">
                                                {event.to.slice(0, 8)}...{event.to.slice(-6)}
                                            </td>
                                            <td className="px-8 py-5 text-right font-bold text-green-600 text-lg">
                                                {Number(event.amount).toFixed(6)}
                                            </td>
                                            <td className="px-8 py-5 text-center text-gray-700">
                                                {event.timestamp}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <a
                                                    href={`http://localhost:8545/tx/${event.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:underline font-mono text-sm"
                                                >
                                                    {event.txHash.slice(0, 10)}...
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PHÂN TRANG */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-4 mt-10">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                    Trước
                                </button>
                                <span className="px-6 py-3 text-xl font-bold text-indigo-900">
                                    Trang {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}