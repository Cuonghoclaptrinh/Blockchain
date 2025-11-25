// src/app/admin/page.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import Link from 'next/link';

export default function AdminDashboard() {
    const { balance, isOwner, currency } = usePayrollContract();

    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center p-10 bg-white rounded-2xl shadow-2xl">
                    <p className="text-3xl font-bold text-red-600 mb-4">Chỉ Admin mới truy cập được!</p>
                    <Link href="/" className="text-indigo-600 hover:underline">
                        ← Quay lại trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-5xl font-bold text-indigo-900 text-center mb-10 drop-shadow-lg">
                    Admin Dashboard
                </h1>

                {/* SỐ DƯ HỢP ĐỒNG */}
                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl text-center mb-10 border border-white/30">
                    <p className="text-xl text-gray-700 mb-2">Số dư quỹ lương</p>
                    <p className="text-6xl font-extrabold text-green-600">
                        {Number(balance).toFixed(6)} <span className="text-4xl">{currency}</span>
                    </p>
                </div>

                {/* MENU */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { href: '/admin/employees', label: 'Quản lý nhân viên', color: 'from-indigo-500 to-purple-600' },
                        { href: '/admin/deposit', label: 'Nạp tiền', color: 'from-green-500 to-emerald-600' },
                        { href: '/admin/payroll', label: 'Trả lương', color: 'from-red-500 to-pink-600' },
                        { href: '/admin/history', label: 'Lịch sử', color: 'from-gray-500 to-gray-700' },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block p-8 rounded-2xl text-white font-bold text-xl text-center shadow-xl hover:scale-105 transition transform duration-200 bg-gradient-to-br ${item.color}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <p className="text-sm text-gray-600">
                        DApp được xây dựng với Next.js 14 + Wagmi + RainbowKit + Hardhat
                    </p>
                </div>
            </div>
        </div>
    );
}