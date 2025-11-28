'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

const navLinks = [
    { href: '/employee', label: 'Chấm công' },
    { href: '/admin', label: 'Admin' },
    { href: '/history', label: 'Lịch sử' },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);


    const isActive = (href: string) =>
        href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
                {/* Logo + Brand */}
                <Link href="/" className="flex items-center gap-2 md:gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md md:h-10 md:w-10">
                        <span className="text-lg font-semibold">P</span>
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-500 md:text-xs">
                            Payroll
                        </span>
                        <span className="text-base font-semibold text-slate-900 md:text-lg">
                            Payroll DApp
                        </span>
                    </div>
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-6 md:flex">
                    <div className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1.5 shadow-inner">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={[
                                    'relative rounded-full px-3 py-1.5 text-sm font-medium transition',
                                    'hover:text-indigo-600',
                                    isActive(link.href)
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-600',
                                ].join(' ')}
                            >
                                {link.label}
                                {isActive(link.href) && (
                                    <span className="absolute inset-x-3 -bottom-1 h-[2px] rounded-full bg-indigo-500" />
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="ml-2">
                        <ConnectButton
                            chainStatus="icon"
                            accountStatus="address"
                            showBalance={false}
                        />
                    </div>
                </div>

                {/* Mobile: Wallet + Toggle */}
                <div className="flex items-center gap-2 md:hidden">
                    <ConnectButton
                        chainStatus="icon"
                        accountStatus="avatar"
                        showBalance={false}
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                        aria-label="Toggle navigation"
                    >
                        {isOpen ? (
                            <HiOutlineX className="h-5 w-5" />
                        ) : (
                            <HiOutlineMenu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
                    <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={[
                                    'flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium transition',
                                    'hover:bg-slate-50',
                                    isActive(link.href)
                                        ? 'bg-slate-100 text-indigo-600'
                                        : 'text-slate-700',
                                ].join(' ')}
                            >
                                <span>{link.label}</span>
                                {isActive(link.href) && (
                                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}