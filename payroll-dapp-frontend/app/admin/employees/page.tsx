// src/app/admin/employees/page.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/constants/contract';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
type Employee = {
    addr: `0x${string}`;
    name: string;
    rate: number;
    accrued: number;
};

export default function EmployeeManagement() {
    const { isOwner, currency } = usePayrollContract();
    const publicClient = usePublicClient();
    const { writeContractAsync, isPending } = useWriteContract();
    const toast = useToast();

    const [addr, setAddr] = useState('');
    const [name, setName] = useState('');
    const [rate, setRate] = useState('');
    const [editAddr, setEditAddr] = useState<`0x${string}` | undefined>(undefined);
    const [editRate, setEditRate] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const { data: list, refetch: refetchList } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'allEmployees',
    });

    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    useEffect(() => {
        if (isConfirmed && txHash) {
            refetchList();
            setTxHash(undefined);
        }
    }, [isConfirmed, txHash, refetchList]);

    const fetchEmployee = async (addr: `0x${string}`): Promise<Employee> => {
        try {
            const [infoRaw, accruedRaw] = await Promise.all([
                publicClient?.readContract({
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: CONTRACT_ABI,
                    functionName: 'employees',
                    args: [addr],
                }),
                publicClient?.readContract({
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: CONTRACT_ABI,
                    functionName: 'accruedOf',
                    args: [addr],
                }),
            ]);

            let empName = 'Chưa đặt tên';
            let hourlyRate: bigint = BigInt(0);

            if (infoRaw) {
                const infoAny = infoRaw as any;
                if (Array.isArray(infoAny)) {
                    empName = infoAny[0] ?? empName;
                    hourlyRate = infoAny[1] ?? BigInt(0);
                } else {
                    empName = infoAny.name ?? empName;
                    hourlyRate = infoAny.hourlyRate ?? BigInt(0);
                }
            }

            const accruedAmount = (accruedRaw as bigint | undefined) ?? BigInt(0);

            return {
                addr,
                name: empName,
                rate: Number(formatEther(hourlyRate)),
                accrued: Number(formatEther(accruedAmount)),
            };
        } catch (error) {
            console.error('Lỗi lấy dữ liệu nhân viên:', error);
            return { addr, name: 'Lỗi tải', rate: 0, accrued: 0 };
        }
    };

    useEffect(() => {
        if (!list || !Array.isArray(list) || !publicClient) {
            setEmployees([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const addrs = list as `0x${string}`[];

        Promise.all(addrs.map(fetchEmployee))
            .then(setEmployees)
            .catch((e) => console.error('Lỗi tải danh sách:', e))
            .finally(() => setLoading(false));
    }, [list, publicClient]);

    const handleAdd = async () => {
        if (!addr || !name || !rate) {
            toast.error('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        const id = toast.loading('Đang thêm nhân viên...');
        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'addEmployee',
                args: [addr, name, parseEther(rate)],
            });
            setTxHash(hash);
            toast.dismiss(id);
            toast.success('Thêm nhân viên thành công!');
            setAddr(''); setName(''); setRate('');
        } catch (error: any) {
            toast.dismiss(id);
            toast.error(error.message || 'Thêm nhân viên thất bại!');
        }
    };

    const handleUpdate = async (addr: `0x${string}`) => {
        if (!editRate) {
            toast.error('Vui lòng nhập lương mới!');
            return;
        }
        const id = toast.loading('Đang cập nhật lương...');
        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'updateRate',
                args: [addr, parseEther(editRate)],
            });
            setTxHash(hash);
            toast.dismiss(id);
            toast.success('Cập nhật lương thành công!');
            setEditAddr(undefined);
        } catch (error: any) {
            toast.dismiss(id);
            toast.error(error.message || 'Cập nhật thất bại!');
        }
    };

    const handleRemove = async (addr: `0x${string}`) => {
        if (!confirm('Xóa nhân viên này?')) return;
        const id = toast.loading('Đang xóa nhân viên...');
        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'removeEmployee',
                args: [addr],
            });
            setTxHash(hash);
            toast.dismiss(id);
            toast.success('Xóa nhân viên thành công!');
        } catch (error: any) {
            toast.dismiss(id);
            toast.error(error.message || 'Xóa thất bại!');
        }
    };

    if (!isOwner) {
        return <p className="text-center mt-20 text-red-600 font-bold">Chỉ Admin mới truy cập được!</p>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-5xl font-bold text-indigo-900 text-center mb-10 drop-shadow-lg">
                    Quản Lý Nhân Viên
                </h1>
                <div className="text-center">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-3 text-indigo-600 hover:text-indigo-800 font-bold text-xl transition mb-10"
                    >
                        ← Quay lại Admin Dashboard
                    </Link>
                </div>

                {/* THÊM NHÂN VIÊN */}
                <div className="bg-white p-8 rounded-3xl shadow-2xl mb-10">
                    <h2 className="text-2xl font-bold text-indigo-800 mb-6">Thêm nhân viên mới</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <input
                            placeholder="Địa chỉ ví (0x...)"
                            value={addr}
                            onChange={(e) => setAddr(e.target.value)}
                            className="p-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                        />
                        <input
                            placeholder="Tên nhân viên"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                        />
                        <input
                            placeholder={`Lương/giờ (${currency})`}
                            type="number"
                            step="0.000001"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            className="p-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-xl font-bold text-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition transform hover:scale-105 shadow-lg"
                    >
                        {isPending ? 'Đang xử lý...' : 'Thêm nhân viên'}
                    </button>
                </div>

                {/* DANH SÁCH */}
                <div className="bg-white p-8 rounded-3xl shadow-2xl">
                    <h2 className="text-2xl font-bold text-indigo-800 mb-6">
                        Danh sách ({employees.length} người)
                    </h2>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-8 border-indigo-600 border-t-transparent"></div>
                            <p className="mt-6 text-xl text-gray-600">Đang tải danh sách...</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl">
                            <p className="text-2xl text-gray-500">Chưa có nhân viên nào</p>
                            <p className="text-sm text-gray-400 mt-4">Hãy thêm nhân viên đầu tiên!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {employees.map((emp) => (
                                <div key={emp.addr} className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 hover:shadow-2xl transition">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            {editAddr === emp.addr ? (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-gray-600 italic">Tên không thể sửa sau khi thêm</p>
                                                    <input
                                                        value={editRate}
                                                        onChange={(e) => setEditRate(e.target.value)}
                                                        type="number"
                                                        step="0.000001"
                                                        placeholder="Lương mới"
                                                        className="w-full p-3 border-2 border-indigo-300 rounded-lg focus:border-indigo-600 focus:outline-none transition"
                                                    />
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleUpdate(emp.addr)}
                                                            disabled={isPending}
                                                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition"
                                                        >
                                                            Lưu lương
                                                        </button>
                                                        <button
                                                            onClick={() => setEditAddr(undefined)}
                                                            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-2xl font-bold text-indigo-900">{emp.name}</p>
                                                    <p className="text-sm text-gray-600 font-mono mt-1">{emp.addr}</p>
                                                </>
                                            )}
                                        </div>

                                        <div className="text-right ml-6">
                                            <p className="text-2xl font-bold text-green-600">
                                                {emp.rate.toFixed(6)} {currency}/giờ
                                            </p>
                                            {emp.accrued > 0 && (
                                                <p className="text-lg font-bold text-red-600 mt-2">
                                                    Chờ trả: {emp.accrued.toFixed(6)} {currency}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-3 ml-6">
                                            <button
                                                onClick={() => {
                                                    setEditAddr(emp.addr);
                                                    setEditRate(emp.rate.toString());
                                                }}
                                                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                            >
                                                Sửa lương
                                            </button>
                                            <button
                                                onClick={() => handleRemove(emp.addr)}
                                                className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}