// src/components/RedirectHandler.tsx
'use client';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectHandler() {
    const { address, isConnected } = useAccount();
    const { isOwner } = usePayrollContract();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Nếu chưa connect ví → không làm gì
        if (!isConnected || !address) return;

        // Nếu đang ở trang chủ → tự động chuyển
        if (pathname === '/') {
            if (isOwner) {
                router.replace('/admin');
            } else {
                router.replace('/employee');
            }
        }
    }, [isConnected, address, isOwner, pathname, router]);

    // Component này không render gì cả
    return null;
}