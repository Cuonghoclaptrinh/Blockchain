// src/app/admin/deposit/page.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { useState } from 'react';

export default function DepositPage() {
    const { deposit, isOwner, balance, currency } = usePayrollContract(); // ← DÙNG deposit()
    const [amount, setAmount] = useState('');

    if (!isOwner) {
        return <p className="text-center text-red-600 mt-20">Chỉ Admin mới truy cập được!</p>;
    }

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-indigo-900 mb-6">Nạp tiền vào hợp đồng</h1>
                <p className="mb-4 text-lg">
                    Số dư hiện tại: <strong className="text-green-600">
                        {Number(balance).toFixed(6)} {currency}
                    </strong>
                </p>
                <input
                    type="number"
                    step="0.0001"
                    placeholder="Số ETH muốn nạp"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    onClick={() => deposit(amount)}
                    disabled={!amount}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                    Nạp {amount || 0} ETH
                </button>
            </div>
        </div>
    );
}