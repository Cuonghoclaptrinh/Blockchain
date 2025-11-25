// src/app/admin/payroll/page.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { usePublicClient, useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

interface Employee {
    address: `0x${string}`;
    shortAddr: string;
    name: string;
    hourlyRate: string;
    accrued: string;
}

export default function PayrollPage() {
    const { address: userAddress } = useAccount();
    const publicClient = usePublicClient();
    const { payAll, isOwner, isPending, currency } = usePayrollContract();
    const toast = useToast();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [contractBalance, setContractBalance] = useState('0');
    const [totalAccrued, setTotalAccrued] = useState('0');
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const [loading, setLoading] = useState(true);

    // TẢI DỮ LIỆU
    useEffect(() => {
        if (!userAddress || !publicClient || !isOwner) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const list = (await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'allEmployees',
                })) as `0x${string}`[];

                setTotalEmployees(list.length);

                const start = page * pageSize;
                const end = Math.min(start + pageSize, list.length);
                const pageEmployees: Employee[] = [];
                let total = 0n;

                for (let i = start; i < end; i++) {
                    const addr = list[i];
                    const [info, accruedRaw] = await Promise.all([
                        publicClient.readContract({
                            address: CONTRACT_ADDRESS,
                            abi: CONTRACT_ABI,
                            functionName: 'employees',
                            args: [addr],
                        }) as Promise<any>,
                        publicClient.readContract({
                            address: CONTRACT_ADDRESS,
                            abi: CONTRACT_ABI,
                            functionName: 'accruedOf',
                            args: [addr],
                        }) as Promise<bigint>,
                    ]);

                    let name = 'Không tên';
                    let rate = 0n;

                    if (info) {
                        if ('name' in info) {
                            name = info.name || name;
                            rate = info.hourlyRate || 0n;
                        } else if (Array.isArray(info)) {
                            name = info[0] || name;
                            rate = info[1] || 0n;
                        }
                    }

                    const accrued = Number(formatEther(accruedRaw));
                    if (accrued > 0) {
                        pageEmployees.push({
                            address: addr,
                            shortAddr: `${addr.slice(0, 8)}...${addr.slice(-6)}`,
                            name,
                            hourlyRate: Number(formatEther(rate)).toFixed(6),
                            accrued: accrued.toFixed(6),
                        });
                        total += accruedRaw;
                    }
                }

                setEmployees(pageEmployees);
                setTotalAccrued(formatEther(total));

                const balance = await publicClient.getBalance({ address: CONTRACT_ADDRESS });
                setContractBalance(formatEther(balance));
            } catch (error) {
                console.error('Lỗi tải dữ liệu:', error);
                toast.error('Lỗi tải dữ liệu trả lương!');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userAddress, publicClient, isOwner, page]);

    const totalPages = Math.ceil(totalEmployees / pageSize);

    // TRẢ LƯƠNG 1 NGƯỜI (DÙNG writeContractAsync từ hook)
    const paySingle = async (empAddr: `0x${string}`) => {
        toast.loading('Đang trả lương cho 1 người...');
        try {
            // DÙNG payAll với limit = 1 (cách an toàn nhất)
            await payAll(
                employees.findIndex(e => e.address === empAddr),
                1
            );
            toast.success('Trả lương thành công!');
        } catch (error: any) {
            toast.error(error.message || 'Trả lương thất bại!');
        }
    };

    const payAllRemaining = async () => {
        toast.loading(`Đang trả lương cho ${employees.length} người...`);
        try {
            await payAll(page * pageSize, pageSize);
            toast.success('Trả lương hàng loạt thành công!');
        } catch (error: any) {
            toast.error(error.message || 'Trả lương thất bại!');
        }
    };

    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <p className="text-3xl font-bold text-red-600">Chỉ Admin mới được vào!</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-10 px-4">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-10 rounded-3xl shadow-2xl text-center">
                    <h1 className="text-5xl font-bold mb-6">TRẢ LƯƠNG HÀNG LOẠT</h1>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-6">
                            <p className="text-lg opacity-90">Tổng nhân viên</p>
                            <p className="text-4xl font-bold">{totalEmployees}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-6">
                            <p className="text-lg opacity-90">Quỹ lương</p>
                            <p className="text-4xl font-bold">{Number(contractBalance).toFixed(4)} {currency}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-6">
                            <p className="text-lg opacity-90">Cần trả trang này</p>
                            <p className="text-4xl font-bold">{totalAccrued} {currency}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-6">
                            <p className="text-lg opacity-90">Trang</p>
                            <p className="text-4xl font-bold">{page + 1} / {totalPages || 1}</p>
                        </div>
                    </div>
                </div>

                {/* DANH SÁCH NHÂN VIÊN */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <h2 className="text-3xl font-bold text-indigo-900 mb-8 text-center">
                        Nhân viên chờ trả lương (trang {page + 1})
                    </h2>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-8 border-indigo-600 border-t-transparent"></div>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="text-center py-20 bg-green-50 rounded-2xl">
                            <p className="text-4xl font-bold text-green-600">TẤT CẢ ĐÃ ĐƯỢC TRẢ LƯƠNG!</p>
                            <p className="text-xl text-gray-600 mt-4">Không còn ai chờ lương</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {employees.map((emp) => (
                                <div key={emp.address} className="flex justify-between items-center p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 hover:shadow-2xl transition">
                                    <div>
                                        <p className="text-2xl font-bold text-indigo-900">{emp.name}</p>
                                        <p className="text-lg text-gray-600 font-mono">{emp.shortAddr}</p>
                                        <p className="text-sm text-gray-500">Lương giờ: {emp.hourlyRate} {currency}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-5xl font-extrabold text-green-600">{emp.accrued} {currency}</p>
                                        <p className="text-xl text-gray-600 mt-2">Chờ trả lương</p>
                                        <button
                                            onClick={() => paySingle(emp.address)}
                                            disabled={isPending}
                                            className="mt-4 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition shadow-lg"
                                        >
                                            Trả ngay cho người này
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* NÚT TRẢ LƯƠNG + PHÂN TRANG */}
                <div className="bg-white rounded-3xl shadow-2xl p-10 text-center space-y-8">
                    <div className="flex justify-center gap-8">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-xl"
                        >
                            ← Trang trước
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-xl"
                        >
                            Trang sau →
                        </button>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={payAllRemaining}
                            disabled={isPending || employees.length === 0}
                            className="w-full max-w-4xl mx-auto bg-gradient-to-r from-red-600 to-pink-600 text-white py-8 rounded-3xl font-bold text-4xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 transition shadow-2xl transform hover:scale-105"
                        >
                            {isPending
                                ? 'ĐANG TRẢ LƯƠNG...'
                                : employees.length === 0
                                    ? 'KHÔNG CÒN AI ĐỂ TRẢ'
                                    : `TRẢ LƯƠNG NGAY CHO ${employees.length} NGƯỜI (TỔNG ${totalAccrued} ${currency})`}
                        </button>

                        <p className="text-lg text-gray-600">
                            Tổng cần trả trang này: <span className="font-bold text-red-600">{totalAccrued} {currency}</span>
                        </p>
                    </div>
                </div>

                {/* NÚT TRỞ LẠI */}
                <div className="text-center">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-3 text-indigo-600 hover:text-indigo-800 font-bold text-xl transition"
                    >
                        ← Quay lại Admin Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}