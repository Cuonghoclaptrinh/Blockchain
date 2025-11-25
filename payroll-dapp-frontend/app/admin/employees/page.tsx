// src/app/admin/employees/page.tsx
'use client';

import { usePayrollContract } from '@/hooks/usePayrollContract';
import { useState, useEffect } from 'react';
import {
  useReadContract,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
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
      setAddr('');
      setName('');
      setRate('');
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

      // Update UI ngay
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.addr === addr ? { ...emp, rate: Number(editRate) } : emp,
        ),
      );

      setEditAddr(undefined);
      setEditRate('');
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
            Vui lòng kết nối đúng ví admin để quản lý nhân viên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Quản lý nhân viên
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Thêm, chỉnh sửa mức lương giờ và theo dõi số tiền lương đang chờ trả.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Hợp đồng đang hoạt động • {currency}
          </div>
        </header>

        {/* Form thêm nhân viên */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Thêm nhân viên mới
              </h2>
              <p className="text-sm text-slate-500">
                Điền địa chỉ ví, tên và mức lương theo giờ cho nhân viên.
              </p>
            </div>
            {txHash && (
              <span className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                Đang chờ xác nhận giao dịch…
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Địa chỉ ví
              </label>
              <input
                placeholder="0x..."
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Tên nhân viên
              </label>
              <input
                placeholder="VD: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Lương / giờ ({currency})
              </label>
              <input
                placeholder="0.01"
                type="number"
                step="0.000001"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500">
              ⚠️ Sau khi thêm, tên nhân viên không thể chỉnh sửa. Bạn chỉ có thể cập nhật
              lại lương / giờ.
            </p>
            <button
              onClick={handleAdd}
              disabled={!addr || !name || !rate || isPending}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
            >
              {isPending ? 'Đang xử lý…' : 'Thêm nhân viên'}
            </button>
          </div>
        </section>

        {/* Danh sách nhân viên */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách nhân viên
              </h2>
              <p className="text-sm text-slate-500">
                Quản lý lương theo giờ và số tiền lương đang tích lũy cho từng nhân viên.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              Tổng: {employees.length} nhân viên
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">Đang tải danh sách nhân viên…</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                Chưa có nhân viên nào.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Hãy thêm nhân viên đầu tiên bằng form phía trên.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => {
                const isEditing = editAddr === emp.addr;
                const hasAccrued = emp.accrued > 0;

                return (
                  <div
                    key={emp.addr}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      {/* Left: info + edit form */}
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 italic">
                              Tên không thể sửa, chỉ cập nhật mức lương / giờ.
                            </p>
                            <div className="grid gap-2 md:grid-cols-[1.2fr,auto] md:items-end">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">
                                  Lương mới ({currency}/giờ)
                                </label>
                                <input
                                  value={editRate}
                                  onChange={(e) => setEditRate(e.target.value)}
                                  type="number"
                                  step="0.000001"
                                  placeholder="Nhập mức lương mới"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                />
                              </div>
                              <div className="flex gap-2 md:justify-end">
                                <button
                                  onClick={() => handleUpdate(emp.addr)}
                                  disabled={isPending || !editRate}
                                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Lưu lương
                                </button>
                                <button
                                  onClick={() => {
                                    setEditAddr(undefined);
                                    setEditRate('');
                                  }}
                                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {emp.name}
                              </p>
                              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                                Nhân viên
                              </span>
                              {hasAccrued && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                                  Có lương đang chờ
                                </span>
                              )}
                            </div>
                            <p className="mt-1 font-mono text-[11px] text-slate-500 break-all">
                              {emp.addr}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Middle: salary / accrued */}
                      {!isEditing && (
                        <div className="mt-2 min-w-[180px] text-right md:mt-0">
                          <p className="text-sm font-semibold text-emerald-600">
                            {emp.rate.toFixed(6)} {currency}/giờ
                          </p>
                          {hasAccrued && (
                            <p className="mt-1 text-xs text-rose-600">
                              Chờ trả:{' '}
                              <span className="font-medium">
                                {emp.accrued.toFixed(6)} {currency}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Right: actions */}
                      {!isEditing && (
                        <div className="mt-2 flex items-center gap-2 md:mt-0 md:flex-col md:items-end">
                          <button
                            onClick={() => {
                              setEditAddr(emp.addr);
                              setEditRate(emp.rate.toString());
                            }}
                            className="inline-flex items-center justify-center rounded-full border border-indigo-500 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                          >
                            Sửa lương
                          </button>
                          <button
                            onClick={() => handleRemove(emp.addr)}
                            className="inline-flex items-center justify-center rounded-full border border-rose-500 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
