// src/app/admin/history/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useWatchContractEvent, usePublicClient } from 'wagmi';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { formatEther, decodeEventLog, getEventSelector } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';

// === EVENT SELECTORS ===
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

export default function HistoryPage() {
    const { isOwner } = usePayrollContract();
    const publicClient = usePublicClient();
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [latestBlock, setLatestBlock] = useState<bigint>(BigInt(0));

    // ======================================================
    // === HÀM DÙNG CHUNG ĐỂ XỬ LÝ LOG MỚI ================
    // ======================================================
    const parseLog = useCallback(
        async (log: any): Promise<HistoryEvent | null> => {
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
        },
        [publicClient]
    );

    // ======================================================
    // === FETCH TOÀN BỘ LỊCH SỬ BAN ĐẦU ===================
    // ======================================================
    useEffect(() => {
        if (!publicClient || !isOwner) return;

        const fetchHistory = async () => {
            setLoading(true);

            try {
                const logs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    fromBlock: BigInt(0),
                    toBlock: 'latest',
                });

                const events: HistoryEvent[] = [];
                let maxBlock = BigInt(0);

                for (const log of logs) {
                    const parsed = await parseLog(log);
                    if (parsed) {
                        events.push(parsed);
                        if (log.blockNumber > maxBlock) maxBlock = log.blockNumber;
                    }
                }

                setHistory(events.sort((a, b) => b.blockNumber - a.blockNumber));
                setLatestBlock(maxBlock);
            } catch (err) {
                console.error('Lỗi khi lấy lịch sử:', err);
            }

            setLoading(false);
        };

        fetchHistory();
    }, [publicClient, isOwner, parseLog]);

    // ======================================================
    // === WATCH EVENTS (THEO DÕI KHÔNG LẶP) ===============
    // ======================================================

    const watchConfig = {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        fromBlock: latestBlock ? (latestBlock + BigInt(1)) as bigint : undefined,
        onLogs: async (logs: any[]) => {
            for (const log of logs) {
                const parsed = await parseLog(log);
                if (parsed) {
                    setHistory((prev) => [parsed, ...prev]);
                }
            }
        },
    };

    // 3 watch riêng (wagmi không hỗ trợ mảng eventName)
    useWatchContractEvent({ ...watchConfig, eventName: 'Deposited' });
    useWatchContractEvent({ ...watchConfig, eventName: 'Withdrawn' });
    useWatchContractEvent({ ...watchConfig, eventName: 'SalaryPaid' });

    // ======================================================
    // === UI ==============================================
    // ======================================================
    if (!isOwner) {
        return (
            <p className="text-center text-red-600 mt-20 text-xl font-bold">
                Chỉ Admin mới xem được lịch sử!
            </p>
        );
    }

    return (
        <div className="max-w-6xl mx-auto mt-10 p-6">
            <h1 className="text-3xl font-bold text-indigo-900 mb-8 text-center">
                Lịch Sử Hoạt Động (Nạp - Rút - Trả Lương)
            </h1>

            {loading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Đang tải toàn bộ lịch sử...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <p className="text-yellow-800 text-lg">Chưa có giao dịch nào</p>
                    <p className="text-sm mt-2 text-gray-600">
                        Hãy thử: Nạp tiền → Nhân viên rút lương → Trả lương
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-indigo-600 text-white">
                            <tr>
                                <th className="px-6 py-4 text-left">Loại</th>
                                <th className="px-6 py-4 text-left">Từ</th>
                                <th className="px-6 py-4 text-left">Đến</th>
                                <th className="px-6 py-4 text-right">Số tiền (GO)</th>
                                <th className="px-6 py-4 text-center">Thời gian</th>
                                <th className="px-6 py-4 text-center">Tx</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((event) => (
                                <tr key={`${event.txHash}-${event.blockNumber}`} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${event.type === 'deposit'
                                                ? 'bg-green-100 text-green-800'
                                                : event.type === 'withdraw'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}
                                        >
                                            {event.type === 'deposit'
                                                ? 'NẠP'
                                                : event.type === 'withdraw'
                                                    ? 'RÚT'
                                                    : 'TRẢ LƯƠNG'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 font-mono text-sm">
                                        {event.from ? `${event.from.slice(0, 6)}...${event.from.slice(-4)}` : '-'}
                                    </td>

                                    <td className="px-6 py-4 font-mono text-sm">
                                        {event.to.slice(0, 6)}...{event.to.slice(-4)}
                                    </td>

                                    <td className="px-6 py-4 text-right font-bold text-green-600">
                                        {Number(event.amount).toFixed(6)}
                                    </td>

                                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                                        {event.timestamp}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <a
                                            href={`http://localhost:8545/tx/${event.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline text-xs font-mono"
                                        >
                                            {event.txHash.slice(0, 8)}...
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
