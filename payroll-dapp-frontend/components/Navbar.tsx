'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const links = [
        { href: '/employee', label: 'Chấm công', color: 'text-green-600' },
        { href: '/admin', label: 'Admin', color: 'text-indigo-600' },
        { href: '/history', label: 'Lịch sử', color: 'text-gray-600' },
    ];

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-indigo-900">
                    Payroll DApp
                </Link>
                <div className="flex items-center gap-6">
                    {links.map(({ href, label, color }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`${color} font-medium hover:underline transition ${pathname === href ? 'underline' : ''
                                }`}
                        >
                            {label}
                        </Link>
                    ))}
                    <ConnectButton />
                </div>
            </div>
        </nav>
    );
}