'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { usePublicClient, useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';

interface Employee {
    address: string;
    shortAddr: string;
    name: string;
    hourlyRate: string;
    accrued: string;
}

export default function PayrollPage() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { payAll, isOwner, isPending } = usePayrollContract();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [contractBalance, setContractBalance] = useState('0');
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const [loading, setLoading] = useState(true);

    // TẢI DỮ LIỆU NHÂN VIÊN + SỐ DƯ CONTRACT
    useEffect(() => {
        if (!address || !publicClient || !isOwner) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Lấy danh sách tất cả nhân viên
                const list = (await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'allEmployees',
                })) as string[];

                setTotalEmployees(list.length);

                // 2. Lấy thông tin từng người (phân trang)
                const start = page * pageSize;
                const end = Math.min(start + pageSize, list.length);
                const pageEmployees: Employee[] = [];

                for (let i = start; i < end; i++) {
                    const addr = list[i];
                    const info: any = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: CONTRACT_ABI,
                        functionName: 'employees',
                        args: [addr],
                    });

                    let name = 'Không tên';
                    let rate = 0n;
                    let accrued = 0n;

                    if ('name' in info) {
                        name = info.name || name;
                        rate = info.hourlyRate || 0n;
                        accrued = info.accrued || 0n;
                    } else if (Array.isArray(info)) {
                        name = info[0] || name;
                        rate = info[1] || 0n;
                        accrued = info[2] || 0n;
                    }

                    if (accrued > 0n) {
                        pageEmployees.push({
                            address: addr,
                            shortAddr: `${addr.slice(0, 8)}...${addr.slice(-6)}`,
                            name,
                            hourlyRate: Number(formatEther(rate)).toFixed(6),
                            accrued: Number(formatEther(accrued)).toFixed(6),
                        });
                    }
                }

                setEmployees(pageEmployees);

                // 3. Lấy số dư contract
                const balance = await publicClient.getBalance({ address: CONTRACT_ADDRESS });
                setContractBalance(formatEther(balance));
            } catch (error) {
                console.error('Lỗi tải dữ liệu admin:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [address, publicClient, isOwner, page]);

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="bg-white p-10 rounded-2xl shadow-2xl text-center">
                    <p className="text-3xl font-bold text-red-600">Cấm truy cập</p>
                    <p className="text-gray-600 mt-4">Chỉ Owner mới được vào trang này</p>
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(totalEmployees / pageSize);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-10 px-4">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-8 rounded-2xl shadow-2xl text-center">
                    <h1 className="text-4xl font-bold mb-4">TRẢ LƯƠNG HÀNG LOẠT</h1>
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                            <p className="text-sm opacity-90">Tổng nhân viên</p>
                            <p className="text-3xl font-bold">{totalEmployees}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                            <p className="text-sm opacity-90">Quỹ lương hiện tại</p>
                            <p className="text-3xl font-bold">{Number(contractBalance).toFixed(4)} ETH</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                            <p className="text-sm opacity-90">Trang hiện tại</p>
                            <p className="text-3xl font-bold">{page + 1} / {totalPages || 1}</p>
                        </div>
                    </div>
                </div>

                {/* DANH SÁCH NHÂN VIÊN TRONG TRANG */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Nhân viên có lương tích lũy (trang {page + 1})
                    </h2>

                    {loading ? (
                        <p className="text-center py-10 text-gray-500">Đang tải dữ liệu...</p>
                    ) : employees.length === 0 ? (
                        <p className="text-center py-10 text-green-600 font-bold text-xl">
                            Tất cả nhân viên đã được trả lương sạch sẽ!
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {employees.map((emp) => (
                                <div key={emp.address} className="flex justify-between items-center p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <div>
                                        <p className="font-bold text-gray-800">{emp.name}</p>
                                        <p className="text-sm text-gray-600">{emp.shortAddr}</p>
                                        <p className="text-xs text-gray-500">Lương giờ: {emp.hourlyRate} ETH</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-green-600">{emp.accrued} ETH</p>
                                        <p className="text-sm text-gray-600">Chờ trả lương</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* NÚT TRẢ LƯƠNG + PHÂN TRANG */}
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="px-8 py-4 bg-gray-200 rounded-xl font-bold hover:bg-gray-300 disabled:opacity-50 transition"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="px-8 py-4 bg-gray-200 rounded-xl font-bold hover:bg-gray-300 disabled:opacity-50 transition"
                        >
                            Sau
                        </button>
                    </div>

                    <button
                        onClick={() => payAll(page * pageSize, pageSize)}
                        disabled={isPending || employees.length === 0}
                        className="w-full max-w-2xl mx-auto bg-gradient-to-r from-red-600 to-pink-600 text-white py-6 rounded-2xl font-bold text-2xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 transition shadow-2xl"
                    >
                        {isPending
                            ? 'ĐANG TRẢ LƯƠNG CHO 10 NGƯỜI...'
                            : employees.length === 0
                                ? 'KHÔNG CÓ AI ĐỂ TRẢ'
                                : `TRẢ LƯƠNG NGAY CHO ${employees.length} NHÂN VIÊN (TRANG ${page + 1})`}
                    </button>

                    <p className="text-sm text-gray-500">
                        An toàn 100% • Không bao giờ hết gas • Dữ liệu lấy trực tiếp từ blockchain
                    </p>
                </div>
            </div>
        </div>
    );
}