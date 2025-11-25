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

        const balance = await publicClient.getBalance({
          address: CONTRACT_ADDRESS,
        });
        setContractBalance(formatEther(balance));
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        toast.error('Lỗi tải dữ liệu trả lương!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userAddress, publicClient, isOwner, page, toast]);

  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));

  // TRẢ LƯƠNG 1 NGƯỜI
  const paySingle = async (empAddr: `0x${string}`) => {
    const idx = employees.findIndex((e) => e.address === empAddr);
    if (idx === -1) return;

    const id = toast.loading('Đang trả lương cho 1 nhân viên...');
    try {
      // Dùng payAll với limit = 1, start = index trong trang
      await payAll(page * pageSize + idx, 1);
      toast.dismiss(id);
      toast.success('Trả lương thành công!');
    } catch (error: any) {
      toast.dismiss(id);
      toast.error(error.message || 'Trả lương thất bại!');
    }
  };

  const payAllRemaining = async () => {
    if (employees.length === 0) return;
    const id = toast.loading(
      `Đang trả lương cho ${employees.length} nhân viên trong trang này...`,
    );
    try {
      await payAll(page * pageSize, pageSize);
      toast.dismiss(id);
      toast.success('Trả lương hàng loạt thành công!');
    } catch (error: any) {
      toast.dismiss(id);
      toast.error(error.message || 'Trả lương thất bại!');
    }
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
            Truy cập bị từ chối
          </p>
          <p className="mt-3 text-lg font-bold text-slate-900">
            Chỉ Admin mới truy cập được trang này!
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium"
          >
            ← Quay lại Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* HEADER */}
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-[1px] shadow-lg">
          <div className="rounded-3xl bg-slate-950/5 px-6 py-7 text-white backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-100">
                  Admin
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Trả lương hàng loạt
                </h1>
                <p className="mt-1 text-sm text-indigo-100/90">
                  Thực hiện thanh toán lương cho các nhân viên đang có số dư chờ trả.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4 md:text-sm">
                <div className="rounded-2xl bg-black/20 px-3 py-3 text-center">
                  <p className="text-indigo-100/80">Tổng nhân viên</p>
                  <p className="mt-1 text-lg font-semibold">{totalEmployees}</p>
                </div>
                <div className="rounded-2xl bg-black/20 px-3 py-3 text-center">
                  <p className="text-indigo-100/80">Quỹ lương</p>
                  <p className="mt-1 text-lg font-semibold">
                    {Number(contractBalance).toFixed(4)} {currency}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 px-3 py-3 text-center">
                  <p className="text-indigo-100/80">Cần trả trang này</p>
                  <p className="mt-1 text-lg font-semibold">
                    {totalAccrued} {currency}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 px-3 py-3 text-center">
                  <p className="text-indigo-100/80">Trang</p>
                  <p className="mt-1 text-lg font-semibold">
                    {page + 1} / {totalPages}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* DANH SÁCH NHÂN VIÊN */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Nhân viên chờ trả lương (trang {page + 1})
              </h2>
              <p className="text-xs text-slate-500">
                Chỉ hiển thị những nhân viên có lương tích lũy &gt; 0 trong phạm vi
                trang hiện tại.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {employees.length} nhân viên trong trang
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-emerald-700">
                Tất cả nhân viên trong trang này đã được trả lương đầy đủ.
              </p>
              <p className="mt-1 text-xs text-emerald-700/80">
                Hãy chuyển sang trang khác hoặc chờ chu kỳ chấm công tiếp theo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div
                  key={emp.address}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      {emp.shortAddr}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lương giờ:{' '}
                      <span className="font-medium text-slate-700">
                        {emp.hourlyRate} {currency}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-600">
                      {emp.accrued} {currency}
                    </p>
                    <p className="text-[11px] text-slate-500">Số tiền chờ trả</p>
                    <button
                      onClick={() => paySingle(emp.address)}
                      disabled={isPending}
                      className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Trả cho nhân viên này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* NÚT TRẢ LƯƠNG + PHÂN TRANG */}
        <section className="rounded-3xl bg-white p-6 text-center shadow-sm space-y-5">
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Trang {page + 1} / {totalPages} • {pageSize} nhân viên / trang
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </div>

          <button
            onClick={payAllRemaining}
            disabled={isPending || employees.length === 0}
            className="mt-2 w-full rounded-full bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 text-sm font-semibold text-white shadow-md transition hover:from-rose-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? 'Đang trả lương...'
              : employees.length === 0
              ? 'Không còn ai để trả lương'
              : `Trả lương cho tất cả ${employees.length} nhân viên trong trang (≈ ${totalAccrued} ${currency})`}
          </button>

          <p className="text-[11px] text-slate-500">
            Tip: Hãy đảm bảo số dư quỹ lương đủ lớn trước khi trả lương hàng loạt để tránh
            giao dịch thất bại.
          </p>
        </section>

        {/* BACK LINK */}
        <div className="text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            ← Quay lại Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
