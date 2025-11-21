// src/app/admin/employees/page.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/constants/contract';

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

    // Form thêm
    const [addr, setAddr] = useState('');
    const [name, setName] = useState('');
    const [rate, setRate] = useState('');
    const [editAddr, setEditAddr] = useState<`0x${string}` | undefined>(undefined);
    const [editRate, setEditRate] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // === REFETCH + GIAO DỊCH ===
    const { data: list, refetch: refetchList } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'allEmployees',
    });

    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    // === CẬP NHẬT SAU KHI GIAO DỊCH XÁC NHẬN ===
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
        if (!addr || !name || !rate) return;
        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'addEmployee',
                args: [addr, name, parseEther(rate)],
            });
            setTxHash(hash);
            setAddr(''); setName(''); setRate('');
        } catch (error: any) {
            alert('Lỗi: ' + (error.shortMessage || error.message));
        }
    };

    const handleUpdate = async (addr: `0x${string}`) => {
        if (!editRate) return;

        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'updateRate',
                args: [addr, parseEther(editRate)],
            });

            // Update UI ngay lập tức
            setEmployees((prev) =>
                prev.map((emp) =>
                    emp.addr === addr
                        ? { ...emp, rate: Number(editRate) }
                        : emp
                )
            );

            setEditAddr(undefined);
            setEditRate('');

            // vẫn để txHash để nếu bạn muốn auto-refetch khi confirm
            setTxHash(hash);

        } catch (error: any) {
            alert('Lỗi: ' + (error.shortMessage || error.message));
        }
    };

    const handleRemove = async (addr: `0x${string}`) => {
        if (!confirm('Xóa nhân viên này?')) return;
        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'removeEmployee',
                args: [addr],
            });
            setTxHash(hash);
        } catch (error: any) {
            alert('Lỗi: ' + (error.shortMessage || error.message));
        }
    };

    if (!isOwner) {
        return <p className="text-center mt-20 text-red-600 font-bold">Chỉ Admin mới truy cập được!</p>;
    }

    return (
        <div className="max-w-5xl mx-auto mt-10 p-6 space-y-8">
            <h1 className="text-3xl font-bold text-indigo-900 text-center">Quản Lý Nhân Viên</h1>

            {/* === THÊM NHÂN VIÊN === */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-indigo-800">Thêm nhân viên mới</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        placeholder="Địa chỉ ví (0x...)"
                        value={addr}
                        onChange={(e) => setAddr(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        placeholder="Tên nhân viên"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        placeholder={`Lương/giờ (${currency})`}
                        type="number"
                        step="0.000001"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={!addr || !name || !rate || isPending}
                    className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                    {isPending ? 'Đang xử lý...' : 'Thêm nhân viên'}
                </button>
            </div>

            {/* === DANH SÁCH === */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-indigo-800">
                    Danh sách ({employees.length} người)
                </h2>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600">Đang tải...</p>
                    </div>
                ) : employees.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Chưa có nhân viên nào</p>
                ) : (
                    <div className="space-y-4">
                        {employees.map((emp) => (
                            <div key={emp.addr} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        {editAddr === emp.addr ? (
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-600 italic">
                                                    Tên không thể sửa sau khi thêm
                                                </p>
                                                <input
                                                    value={editRate}
                                                    onChange={(e) => setEditRate(e.target.value)}
                                                    type="number"
                                                    step="0.000001"
                                                    placeholder="Lương mới"
                                                    className="w-full p-2 border rounded text-sm"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdate(emp.addr)}
                                                        disabled={isPending}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                    >
                                                        Lưu lương
                                                    </button>
                                                    <button
                                                        onClick={() => setEditAddr(undefined)}
                                                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-indigo-900">{emp.name}</p>
                                                <p className="text-sm text-gray-600 font-mono">{emp.addr}</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="text-right ml-4">
                                        <p className="font-bold text-green-600">
                                            {emp.rate.toFixed(6)} {currency}/giờ
                                        </p>
                                        {emp.accrued > 0 && (
                                            <p className="text-sm text-red-600">
                                                Chờ trả: {emp.accrued.toFixed(6)} {currency}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => {
                                                setEditAddr(emp.addr);
                                                setEditRate(emp.rate.toString());
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                        >
                                            Sửa lương
                                        </button>
                                        <button
                                            onClick={() => handleRemove(emp.addr)}
                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
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
    );
}