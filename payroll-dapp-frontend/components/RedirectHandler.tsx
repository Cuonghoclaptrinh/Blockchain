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
        if (isConnected && address) {
            if (pathname === '/') {
                if (isOwner) {
                    router.replace('/admin');
                } else {
                    router.replace('/employee');
                }
            }
        }

        // Trường hợp 2: Ngắt kết nối ví → về trang chủ ngay lập tức
        if (!isConnected && pathname !== '/') {
            router.replace('/');
        }
    }, [isConnected, address, isOwner, pathname, router]);

    // Component này không render gì cả
    return null;
}