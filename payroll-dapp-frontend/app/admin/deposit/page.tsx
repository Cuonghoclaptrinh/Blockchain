// src/app/admin/deposit/page.tsx
'use client';

import { usePayrollContract } from '@/hooks/usePayrollContract';
import { useState } from 'react';

export default function DepositPage() {
  const { deposit, isOwner, balance, currency } = usePayrollContract();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
            Truy cập bị từ chối
          </p>
          <p className="mt-3 text-lg font-bold text-slate-900">
            Chỉ Admin mới truy cập được trang này
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng kết nối đúng ví admin để tiếp tục.
          </p>
        </div>
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!amount) return;
    try {
      setLoading(true);
      await deposit(amount);
      setAmount('');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi nạp tiền');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-12">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Nạp tiền vào hợp đồng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Thực hiện nạp ETH để đảm bảo đủ tiền cho việc chi trả lương.
          </p>
        </header>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          {/* Balance */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] shadow-sm">
            <div className="rounded-xl bg-slate-900/10 px-4 py-4 text-white backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-100">
                Số dư hợp đồng
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {Number(balance).toFixed(6)} {currency}
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Số ETH muốn nạp
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleDeposit}
            disabled={!amount || loading}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Đang xử lý…' : `Nạp ${amount || 0} ${currency}`}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            ⚠️ Sau khi nạp, số dư sẽ hiển thị lại sau vài giây.
          </p>
        </div>
      </div>
    </div>
  );
}
