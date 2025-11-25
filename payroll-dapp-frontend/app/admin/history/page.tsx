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

type FilterType = 'all' | 'deposit' | 'withdraw' | 'salary';

export default function HistoryPage() {
  const { isOwner } = usePayrollContract();
  const publicClient = usePublicClient();
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestBlock, setLatestBlock] = useState<bigint>(BigInt(0));
  const [filter, setFilter] = useState<FilterType>('all');

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
    [publicClient],
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
    fromBlock: latestBlock ? ((latestBlock + BigInt(1)) as bigint) : undefined,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
            Truy cập bị từ chối
          </p>
          <p className="mt-3 text-lg font-bold text-slate-900">
            Chỉ Admin mới xem được lịch sử giao dịch!
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng kết nối đúng ví admin để tiếp tục.
          </p>
        </div>
      </div>
    );
  }

  const filteredHistory =
    filter === 'all' ? history : history.filter((e) => e.type === filter);

  const totalDeposits = history.filter((e) => e.type === 'deposit').length;
  const totalWithdraws = history.filter((e) => e.type === 'withdraw').length;
  const totalSalaries = history.filter((e) => e.type === 'salary').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        {/* HEADER */}
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-[1px] shadow-lg">
          <div className="h-full rounded-3xl bg-slate-950/5 px-6 py-7 text-white backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-100">
                  Admin
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Lịch sử hoạt động
                </h1>
                <p className="mt-1 text-sm text-indigo-100/90">
                  Theo dõi toàn bộ giao dịch Nạp – Rút – Trả lương liên quan đến hợp đồng.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs md:text-sm">
                <div className="rounded-2xl bg-black/15 px-3 py-3">
                  <p className="text-indigo-100/80">Tổng sự kiện</p>
                  <p className="mt-1 text-lg font-semibold">{history.length}</p>
                </div>
                <div className="rounded-2xl bg-black/15 px-3 py-3">
                  <p className="text-indigo-100/80">Nạp / Rút</p>
                  <p className="mt-1 text-lg font-semibold">
                    {totalDeposits}/{totalWithdraws}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/15 px-3 py-3">
                  <p className="text-indigo-100/80">Trả lương</p>
                  <p className="mt-1 text-lg font-semibold">{totalSalaries}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* FILTER + TABLE */}
        {loading ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">
                Đang tải toàn bộ lịch sử giao dịch…
              </p>
            </div>
          </section>
        ) : history.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-amber-800">
              Chưa có giao dịch nào được ghi nhận.
            </p>
            <p className="mt-2 text-sm text-amber-800/90">
              Hãy thử nạp tiền, cho nhân viên rút lương hoặc chạy trả lương để xem lịch sử tại
              đây.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {/* Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Đang hiển thị{' '}
                <span className="font-semibold text-slate-700">
                  {filteredHistory.length}
                </span>{' '}
                / {history.length} sự kiện.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilter('deposit')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === 'deposit'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Nạp
                </button>
                <button
                  onClick={() => setFilter('withdraw')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === 'withdraw'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Rút
                </button>
                <button
                  onClick={() => setFilter('salary')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === 'salary'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Trả lương
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wide text-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Loại</th>
                    <th className="px-6 py-3 text-left">Từ</th>
                    <th className="px-6 py-3 text-left">Đến</th>
                    <th className="px-6 py-3 text-right">Số tiền (GO)</th>
                    <th className="px-6 py-3 text-center">Thời gian</th>
                    <th className="px-6 py-3 text-center">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((event) => (
                    <tr
                      key={`${event.txHash}-${event.blockNumber}`}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-3 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                            event.type === 'deposit'
                              ? 'bg-emerald-50 text-emerald-700'
                              : event.type === 'withdraw'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {event.type === 'deposit'
                            ? 'Nạp'
                            : event.type === 'withdraw'
                            ? 'Rút'
                            : 'Trả lương'}
                        </span>
                      </td>

                      <td className="px-6 py-3 font-mono text-[11px] text-slate-600 align-middle">
                        {event.from
                          ? `${event.from.slice(0, 6)}...${event.from.slice(-4)}`
                          : '-'}
                      </td>

                      <td className="px-6 py-3 font-mono text-[11px] text-slate-600 align-middle">
                        {event.to.slice(0, 6)}...{event.to.slice(-4)}
                      </td>

                      <td className="px-6 py-3 text-right align-middle">
                        <span className="font-semibold text-emerald-600">
                          {Number(event.amount).toFixed(6)}
                        </span>
                      </td>

                      <td className="px-6 py-3 text-center text-[11px] text-slate-500 align-middle">
                        {event.timestamp}
                      </td>

                      <td className="px-6 py-3 text-center align-middle">
                        <a
                          href={`http://localhost:8545/tx/${event.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-mono font-semibold text-indigo-600 hover:bg-slate-200"
                        >
                          {event.txHash.slice(0, 8)}…
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500">
              Lưu ý: Link Tx đang trỏ về node local (
              <span className="font-mono">localhost:8545</span>). Khi deploy thật, hãy thay
              bằng URL của block explorer tương ứng (Etherscan, Blockscout, v.v.).
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
