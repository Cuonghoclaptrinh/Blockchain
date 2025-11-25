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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
            Truy cập bị từ chối
          </p>
          <p className="mt-3 text-lg font-bold text-slate-900">
            Chỉ Owner mới truy cập được trang này
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng kết nối đúng ví admin để tiếp tục.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* HEADER */}
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-[1px] shadow-lg">
          <div className="h-full rounded-3xl bg-slate-950/5 px-6 py-7 text-white backdrop-blur">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-100">
                  Admin
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Trả lương hàng loạt
                </h1>
                <p className="mt-1 text-sm text-indigo-100/90">
                  Thực hiện trả lương cho tất cả nhân viên có lương đang tích lũy trên mỗi trang.
                </p>
              </div>

              <button
                onClick={() => payAll(page * pageSize, pageSize)}
                disabled={isPending || employees.length === 0}
                className="w-full rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {isPending
                  ? `Đang trả lương cho ${employees.length || pageSize} người…`
                  : employees.length === 0
                  ? 'Không có ai để trả'
                  : `Trả lương cho ${employees.length} nhân viên (trang ${page + 1})`}
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-black/15 px-4 py-3 text-center">
                <p className="text-xs text-indigo-100/80">Tổng nhân viên</p>
                <p className="mt-1 text-2xl font-semibold">{totalEmployees}</p>
              </div>
              <div className="rounded-2xl bg-black/15 px-4 py-3 text-center">
                <p className="text-xs text-indigo-100/80">Quỹ lương hiện tại</p>
                <p className="mt-1 text-2xl font-semibold">
                  {Number(contractBalance).toFixed(4)} ETH
                </p>
              </div>
              <div className="rounded-2xl bg-black/15 px-4 py-3 text-center">
                <p className="text-xs text-indigo-100/80">Trang hiện tại</p>
                <p className="mt-1 text-2xl font-semibold">
                  {page + 1} / {totalPages}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* DANH SÁCH NHÂN VIÊN */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Nhân viên có lương tích lũy (trang {page + 1})
              </h2>
              <p className="text-sm text-slate-500">
                Chỉ hiển thị những nhân viên đang có số tiền chờ trả lương &gt; 0.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {employees.length} nhân viên trong trang
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu…</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 py-10 text-center">
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
                  className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {emp.name}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        Có lương chờ trả
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      {emp.shortAddr}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lương giờ:{' '}
                      <span className="font-medium text-slate-700">
                        {emp.hourlyRate} ETH
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-emerald-600">
                      {emp.accrued} ETH
                    </p>
                    <p className="text-xs text-slate-500">Số tiền đang chờ trả</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PHÂN TRANG + GỢI Ý */}
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm space-y-5">
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Trang {page + 1} / {totalPages} • {pageSize} nhân viên / trang
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Tip: Nên kiểm tra số dư hợp đồng trước khi bấm trả lương hàng loạt để tránh
            giao dịch thất bại do thiếu ETH.
          </p>
        </section>
      </div>
    </div>
  );
}
