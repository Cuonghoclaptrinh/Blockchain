// src/app/admin/page.tsx
'use client';

import Link from 'next/link';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import {
    HiCurrencyDollar,
    HiUserGroup,
    HiCreditCard,
    HiClipboardList,
} from 'react-icons/hi';

export default function AdminDashboard() {
    const { balance, isOwner, currency } = usePayrollContract();

    // Nếu không phải owner -> chặn truy cập
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
                        Vui lòng kết nối đúng ví admin hoặc quay lại trang chủ.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    // UI chính cho admin
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
                {/* Header */}
                <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
                            Admin
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                            Admin Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Quản lý hợp đồng trả lương, nhân viên, nạp tiền và lịch sử giao dịch.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <HiCurrencyDollar className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Số dư hợp đồng
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                                {Number(balance).toFixed(6)}{' '}
                                <span className="text-sm font-medium text-slate-500">{currency}</span>
                            </p>
                        </div>
                    </div>
                </header>

                {/* Balance + Info */}
                <section className="grid gap-6 md:grid-cols-[2fr,1.2fr]">
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-[1px] shadow-md">
                        <div className="flex h-full flex-col justify-between rounded-2xl bg-slate-950/5 p-6 backdrop-blur">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-indigo-100">Tổng số dư khả dụng</p>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                                        {Number(balance).toFixed(6)} {currency}
                                    </p>
                                </div>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
                                    Hợp đồng đang hoạt động
                                </span>
                            </div>

                            <div className="mt-6 grid gap-4 text-sm text-indigo-100 md:grid-cols-3">
                                <div className="rounded-xl bg-black/10 p-3">
                                    <p className="text-xs uppercase tracking-wide text-indigo-200">
                                        Trạng thái
                                    </p>
                                    <p className="mt-1 font-medium text-white">Admin</p>
                                </div>
                                <div className="rounded-xl bg-black/10 p-3">
                                    <p className="text-xs uppercase tracking-wide text-indigo-200">
                                        Loại tiền tệ
                                    </p>
                                    <p className="mt-1 font-medium text-white">{currency}</p>
                                </div>
                                <div className="rounded-xl bg-black/10 p-3">
                                    <p className="text-xs uppercase tracking-wide text-indigo-200">
                                        Quyền truy cập
                                    </p>
                                    <p className="mt-1 font-medium text-white">Toàn quyền</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Lưu ý bảo mật
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                Hãy chắc chắn bạn đang sử dụng đúng ví admin trước khi thực hiện các thao tác
                                nạp tiền hoặc trả lương cho nhân viên.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-100/60 p-4 text-xs text-slate-500">
                            ❤️ Tip: Bạn nên kiểm tra số dư trước khi chạy trả lương hàng loạt để tránh giao
                            dịch thất bại do thiếu tiền.
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Tác vụ nhanh
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Link
                            href="/admin/employees"
                            className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <HiUserGroup className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Quản lý nhân viên
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Thêm, chỉnh sửa, hoặc xoá nhân viên trong hệ thống.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-indigo-500 group-hover:translate-x-1 transition">
                                    Chi tiết →
                                </span>
                            </div>
                        </Link>

                        <Link
                            href="/admin/deposit"
                            className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <HiCreditCard className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Nạp tiền</p>
                                        <p className="text-xs text-slate-500">
                                            Nạp thêm tiền vào hợp đồng trả lương.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-emerald-500 group-hover:translate-x-1 transition">
                                    Nạp ngay →
                                </span>
                            </div>
                        </Link>

                        <Link
                            href="/admin/payroll"
                            className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                        <HiCurrencyDollar className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Trả lương</p>
                                        <p className="text-xs text-slate-500">
                                            Thực hiện trả lương cho nhân viên theo chu kỳ.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-rose-500 group-hover:translate-x-1 transition">
                                    Bắt đầu →
                                </span>
                            </div>
                        </Link>

                        <Link
                            href="/admin/history"
                            className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                                        <HiClipboardList className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Lịch sử</p>
                                        <p className="text-xs text-slate-500">
                                            Xem log giao dịch và lịch sử trả lương.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-slate-500 group-hover:translate-x-1 transition">
                                    Xem lịch sử →
                                </span>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
