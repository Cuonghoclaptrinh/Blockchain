'use client';

import { usePublicClient } from 'wagmi';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';
import { decodeEventLog, formatEther } from 'viem';

interface Payment {
  date: string;
  employee: string;
  shortAddress: string;
  amount: string;
  type: 'withdraw' | 'admin-pay';
  txType: string;
}

type FilterType = 'all' | 'withdraw' | 'admin-pay';

export default function HistoryPage() {
  const publicClient = usePublicClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!publicClient) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: 0n,
          toBlock: 'latest',
        });

        const allPayments: Payment[] = [];

        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: CONTRACT_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === 'Withdrawn' || decoded.eventName === 'SalaryPaid') {
              const args = decoded.args as any;
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              const date = new Date(Number(block.timestamp) * 1000);

              const isWithdraw = decoded.eventName === 'Withdrawn';
              const addr = args.who || args.to;

              allPayments.push({
                date: format(date, 'dd/MM/yyyy HH:mm:ss'),
                employee: addr,
                shortAddress: `${addr.slice(0, 8)}...${addr.slice(-6)}`,
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

  const filteredPayments =
    filter === 'all' ? payments : payments.filter((p) => p.type === filter);

  const totalWithdraw = payments.filter((p) => p.type === 'withdraw').length;
  const totalAdminPay = payments.filter((p) => p.type === 'admin-pay').length;
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* HEADER */}
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-[1px] shadow-lg">
          <div className="rounded-3xl bg-slate-950/5 px-6 py-7 text-white backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-100">
                  Employee
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Lịch sử trả lương
                </h1>
                <p className="mt-1 text-sm text-indigo-100/90">
                  Gồm cả lần nhân viên tự rút lương và lần admin trả lương hàng loạt.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs md:text-sm">
                <div className="rounded-2xl bg-black/20 px-3 py-3">
                  <p className="text-indigo-100/80">Tổng giao dịch</p>
                  <p className="mt-1 text-lg font-semibold">{payments.length}</p>
                </div>
                <div className="rounded-2xl bg-black/20 px-3 py-3">
                  <p className="text-indigo-100/80">Tổng số tiền</p>
                  <p className="mt-1 text-lg font-semibold">
                    {totalAmount.toFixed(4)} ETH
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 px-3 py-3">
                  <p className="text-indigo-100/80">Rút / Trả</p>
                  <p className="mt-1 text-lg font-semibold">
                    {totalWithdraw}/{totalAdminPay}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {/* Filter bar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Đang hiển thị{' '}
              <span className="font-semibold text-slate-700">
                {filteredPayments.length}
              </span>{' '}
              / {payments.length} giao dịch.
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
                onClick={() => setFilter('withdraw')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === 'withdraw'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Nhân viên tự rút
              </button>
              <button
                onClick={() => setFilter('admin-pay')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === 'admin-pay'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Admin trả lương
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">
                Đang tải lịch sử trả lương…
              </p>
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-base font-semibold text-slate-700">
                Chưa có giao dịch trả lương nào.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Khi có nhân viên rút lương hoặc admin trả lương, lịch sử sẽ hiện ở đây.
              </p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-800">
              Không có giao dịch nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((p, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-3 rounded-xl border px-4 py-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:flex-row md:items-center md:justify-between ${
                    p.type === 'withdraw'
                      ? 'border-emerald-100 bg-emerald-50/70'
                      : 'border-indigo-100 bg-indigo-50/70'
                  }`}
                >
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {p.amount} ETH
                    </p>
                    <p className="mt-1 text-xs font-mono text-slate-600">
                      {p.shortAddress}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ví nhận: <span className="font-mono">{p.employee}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        p.type === 'withdraw' ? 'text-emerald-700' : 'text-indigo-700'
                      }`}
                    >
                      {p.txType}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">{p.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-500">
          Dữ liệu được lấy trực tiếp từ blockchain • Minh bạch • Không thể sửa đổi
        </p>
      </div>
    </div>
  );
}
