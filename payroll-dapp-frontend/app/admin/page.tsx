// src/app/admin/page.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import Link from 'next/link';

export default function AdminDashboard() {
    const { balance, isOwner, currency, } = usePayrollContract();

    if (!isOwner) {
        return (
            <div className="text-center mt-20">
                <p className="text-xl text-red-600 font-bold">Chỉ Admin mới truy cập được!</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-10 space-y-6">
            <h1 className="text-3xl font-bold text-indigo-900">Admin Dashboard</h1>

            <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-lg">Số dư hợp đồng:</p>
                <p className="text-3xl font-bold text-green-400 mb-4">
                    {balance} {currency}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <Link href="/admin/employees" className="bg-indigo-600 text-white p-6 rounded-xl text-center font-semibold hover:bg-indigo-700 transition">
                    Quản lý nhân viên
                </Link>
                <Link href="/admin/deposit" className="bg-green-600 text-white p-6 rounded-xl text-center font-semibold hover:bg-green-700 transition">
                    Nạp tiền
                </Link>
                <Link href="/admin/payroll" className="bg-red-600 text-white p-6 rounded-xl text-center font-semibold hover:bg-red-700 transition">
                    Trả lương
                </Link>
                <Link href="/admin/history" className="bg-gray-600 text-white p-6 rounded-xl text-center font-semibold hover:bg-gray-700 transition">
                    Lịch sử
                </Link>
            </div>
        </div>
    );
}