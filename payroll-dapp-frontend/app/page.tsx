'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
          Payroll DApp
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-10">
          Hệ thống chấm công & trả lương tự động trên blockchain
        </p>
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 inline-block">
          <p className="text-white text-lg font-medium">
            Đang chờ kết nối ví...
          </p>
        </div>
      </div>
    </div>
  );
}