// src/app/admin/employees/page.tsx
'use client';

import { usePayrollContract } from '@/hooks/usePayrollContract';
import {
  useReadContract,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contract';
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
  const [editAddr, setEditAddr] = useState<`0x${string}` | undefined>();
  const [editRate, setEditRate] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: list, refetch: refetchList } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'allEmployees',
  });

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  /* --- AUTO REFETCH AFTER TX CONFIRM --- */
  useEffect(() => {
    if (isConfirmed && txHash) {
      refetchList();
      setTxHash(undefined);
    }
  }, [isConfirmed, txHash, refetchList]);

  /* --- LOAD EMPLOYEE DETAILS --- */
  const fetchEmployee = async (addr: `0x${string}`): Promise<Employee> => {
    try {
      const [info, accrued] = await Promise.all([
        publicClient?.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'employees',
          args: [addr],
        }),
        publicClient?.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'accruedOf',
          args: [addr],
        }),
      ]);

      const raw = info as any;

      const name = Array.isArray(raw) ? raw[0] : raw.name ?? 'Không tên';
      const hourlyRate = Array.isArray(raw) ? raw[1] : raw.hourlyRate ?? BigInt(0);

      return {
        addr,
        name,
        rate: Number(formatEther(hourlyRate)),
        accrued: Number(formatEther((accrued as bigint) ?? BigInt(0))),
      };
    } catch {
      return { addr, name: 'Lỗi dữ liệu', rate: 0, accrued: 0 };
    }
  };

  /* --- LOAD LIST --- */
  useEffect(() => {
    if (!list || !publicClient) return;

    setLoading(true);
    Promise.all((list as `0x${string}`[]).map(fetchEmployee))
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, [list, publicClient]);

  /* --- ACTION: ADD --- */
  const handleAdd = async () => {
    if (!addr || !name || !rate) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const id = toast.loading('Đang thêm nhân viên...');

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'addEmployee',
        args: [addr, name, parseEther(rate)],
      });

      setTxHash(hash);
      toast.dismiss(id);
      toast.success('Thêm nhân viên thành công!');
      setAddr('');
      setName('');
      setRate('');
    } catch (err: any) {
      toast.dismiss(id);
      toast.error(err.message);
    }
  };

  /* --- ACTION: UPDATE RATE --- */
  const handleUpdate = async (address: `0x${string}`) => {
    if (!editRate) return toast.error('Nhập mức lương mới!');

    const id = toast.loading('Đang cập nhật...');
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'updateRate',
        args: [address, parseEther(editRate)],
      });
      setTxHash(hash);
      toast.dismiss(id);
      toast.success('Cập nhật lương thành công!');
      setEditAddr(undefined);
    } catch (err: any) {
      toast.dismiss(id);
      toast.error(err.message);
    }
  };

  /* --- ACTION: REMOVE --- */
  const handleRemove = async (address: `0x${string}`) => {
    if (!confirm('Xóa nhân viên này?')) return;
    const id = toast.loading('Đang xóa nhân viên...');

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'removeEmployee',
        args: [address],
      });
      setTxHash(hash);
      toast.dismiss(id);
      toast.success('Xóa thành công!');
    } catch (err: any) {
      toast.dismiss(id);
      toast.error(err.message);
    }
  };

  /* --- ACCESS BLOCK --- */
  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl bg-white px-6 py-8 shadow text-center border border-red-100">
          <p className="text-red-600 text-lg font-bold">Chỉ Admin mới truy cập được!</p>
          <Link href="/admin" className="mt-4 inline-block text-indigo-600 hover:underline">
            ← Về Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* --- UI MAIN PAGE --- */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-[1px] shadow-xl">
          <div className="rounded-3xl bg-slate-950/5 px-6 py-7 text-white backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-100 font-semibold">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Quản lý nhân viên</h1>
            <p className="mt-1 text-sm text-indigo-100/80">
              Quản lý thông tin, lương và trạng thái lương của nhân viên.
            </p>
          </div>
        </header>

        {/* Add Employee */}
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Thêm nhân viên mới</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Địa chỉ ví (0x...)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên nhân viên"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            />
            <input
              value={rate}
              type="number"
              step="0.000001"
              onChange={(e) => setRate(e.target.value)}
              placeholder={`Lương/giờ (${currency})`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={isPending}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-white font-semibold shadow hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {isPending ? 'Đang xử lý…' : 'Thêm nhân viên'}
          </button>
        </section>

        {/* Employee List */}
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Danh sách nhân viên ({employees.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-500">Đang tải dữ liệu…</div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Chưa có nhân viên nào.</div>
          ) : (
            <div className="space-y-4">
              {employees.map((emp) => (
                <div
                  key={emp.addr}
                  className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-5 py-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* INFO */}
                    <div className="flex-1">
                      {editAddr === emp.addr ? (
                        <div className="space-y-2">
                          <input
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            type="number"
                            step="0.000001"
                            className="w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm focus:border-indigo-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(emp.addr)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditAddr(undefined)}
                              className="rounded-lg bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-500"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base font-semibold text-slate-900">{emp.name}</h3>
                          <p className="text-xs font-mono text-slate-500">{emp.addr}</p>
                        </>
                      )}
                    </div>

                    {/* RATE + ACCRUED */}
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {emp.rate.toFixed(6)} {currency}/giờ
                      </p>
                      {emp.accrued > 0 && (
                        <p className="text-xs font-semibold text-rose-600 mt-1">
                          Chờ trả: {emp.accrued.toFixed(6)} {currency}
                        </p>
                      )}
                    </div>

                    {/* ACTIONS */}
                    {editAddr !== emp.addr && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditAddr(emp.addr);
                            setEditRate(emp.rate.toString());
                          }}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleRemove(emp.addr)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
