// src/app/admin/deposit/page.tsx
'use client';

import { usePayrollContract } from '@/hooks/usePayrollContract';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export default function DepositPage() {
  const { deposit, isOwner, balance, currency, isPending } = usePayrollContract();
  const [amount, setAmount] = useState('');
  const toast = useToast();

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ!');
      return;
    }

    const parsed = Number(amount);
    const id = toast.loading(`Đang nạp ${parsed.toFixed(6)} ${currency}...`);

    try {
      await deposit(amount);
      toast.dismiss(id);
      toast.success(`Nạp ${parsed.toFixed(6)} ${currency} thành công!`);
      setAmount('');
    } catch (error: any) {
      toast.dismiss(id);
      toast.error(error?.message || 'Nạp tiền thất bại!');
    }
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
            Truy cập bị từ chối
          </p>
          <p className="mt-3 text-lg font-bold text-slate-900">
            Chỉ Admin mới được nạp tiền vào quỹ lương!
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-indigo-600 font-medium hover:underline"
          >
            ← Quay lại Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* HEADER */}
        <header className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
            Admin
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Nạp tiền vào quỹ lương
          </h1>
          <p className="text-sm text-slate-500">
            Thêm vốn cho hợp đồng trả lương để đảm bảo đủ tiền thanh toán cho nhân viên.
          </p>
        </header>

        {/* CARD CHÍNH */}
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          {/* Số dư hiện tại */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] shadow-sm">
            <div className="rounded-2xl bg-slate-950/5 px-5 py-4 text-white backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-100">
                Số dư hiện tại của quỹ lương
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {Number(balance).toFixed(6)}{' '}
                <span className="text-lg opacity-90">{currency}</span>
              </p>
            </div>
          </div>

          {/* Form nhập tiền */}
          <div className="mt-6 max-w-xl mx-auto space-y-4">
            <div className="space-y-2 text-center">
              <label className="block text-sm font-semibold text-slate-800">
                Nhập số tiền cần nạp
              </label>
              <input
                type="number"
                step="0.000001"
                min="0"
                placeholder={`Ví dụ: 0.5 ${currency}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-mono outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              {amount && Number(amount) > 0 && (
                <p className="text-xs text-slate-500">
                  Sẽ nạp{' '}
                  <span className="font-semibold text-indigo-600">
                    {Number(amount).toFixed(6)} {currency}
                  </span>{' '}
                  vào hợp đồng.
                </p>
              )}
            </div>

            <button
              onClick={handleDeposit}
              disabled={isPending || !amount || Number(amount) <= 0}
              className="mt-2 w-full rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? 'Đang nạp tiền...'
                : amount && Number(amount) > 0
                ? `Nạp ${Number(amount).toFixed(6)} ${currency}`
                : 'Nhập số tiền để nạp'}
            </button>
          </div>

          {/* Footer nhỏ */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Giao dịch sẽ được ghi trực tiếp lên blockchain • Minh bạch • Không thể sửa đổi
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/admin"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              ← Quay lại Admin Dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
