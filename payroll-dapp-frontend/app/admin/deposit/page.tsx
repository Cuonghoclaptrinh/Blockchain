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

        const id = toast.loading(`Đang nạp ${Number(amount).toFixed(6)} ${currency}...`);

        try {
            await deposit(amount);
            toast.dismiss(id);
            toast.success(`Nạp ${Number(amount).toFixed(6)} ${currency} thành công!`);
            setAmount('');
        } catch (error: any) {
            toast.dismiss(id);
            toast.error(error.message || 'Nạp tiền thất bại!');
        }
    };

    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center p-12 bg-white rounded-3xl shadow-2xl">
                    <p className="text-4xl font-bold text-red-600 mb-6">Chỉ Admin mới được nạp tiền!</p>
                    <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 text-xl font-semibold underline">
                        ← Quay lại Admin Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-16 px-4">
            <div className="max-w-4xl mx-auto">

                {/* HEADER */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700 mb-4">
                        Nạp tiền quỹ lương
                    </h1>
                    <p className="text-xl text-gray-600">Quản lý tài chính hợp đồng một cách an toàn & minh bạch</p>
                </div>

                {/* CARD CHÍNH - RỘNG HƠN + ĐẸP HƠN */}
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-white/50">

                    {/* SỐ DƯ HIỆN TẠI */}
                    <div className="text-center mb-12">
                        <p className="text-2xl text-gray-600 mb-4">Số dư hiện tại của quỹ lương</p>
                        <p className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                            {Number(balance).toFixed(2)} <span className="text-5xl">{currency}</span>
                        </p>
                    </div>

                    {/* INPUT + BUTTON */}
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div>
                            <label className="block text-2xl font-semibold text-gray-700 mb-4 text-center">
                                Nhập số tiền cần nạp
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder={`Ví dụ: 10.50 ${currency}`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-8 text-4xl font-mono text-center border-4 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all duration-300 shadow-inner bg-gray-50"
                                disabled={isPending}
                            />
                            {amount && Number(amount) > 0 && (
                                <p className="text-center mt-4 text-3xl font-bold text-indigo-600">
                                    = {Number(amount).toFixed(2)} {currency}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleDeposit}
                            disabled={isPending || !amount || Number(amount) <= 0}
                            className="w-full py-8 rounded-2xl font-extrabold text-3xl text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-2xl"
                        >
                            {isPending ? 'ĐANG NẠP TIỀN...' : 'NẠP NGAY'}
                        </button>
                    </div>

                    {/* FOOTER */}
                    <div className="text-center mt-12">
                        <p className="text-gray-600 text-lg">
                            Giao dịch được ghi trực tiếp lên blockchain • Minh bạch • Không thể thay đổi
                        </p>
                        <Link href="/admin" className="inline-block mt-6 text-indigo-600 hover:text-indigo-800 font-bold text-xl underline">
                            ← Quay lại Admin Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}