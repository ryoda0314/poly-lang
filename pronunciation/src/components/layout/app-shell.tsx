'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, FileText, List, Menu, X, Wifi, WifiOff, Database } from 'lucide-react';
import { checkHealth } from '@/lib/api';

const navItems = [
    { href: '/pronunciation', label: 'Practice', icon: Mic },
    { href: '/pronunciation/logs', label: 'Logs', icon: List },
    { href: '/pronunciation/sentences', label: 'Sentences', icon: FileText },
];

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [health, setHealth] = useState<{ api: boolean; database: boolean } | null>(null);

    useEffect(() => {
        const check = async () => {
            const result = await checkHealth();
            setHealth({ api: result.api, database: result.database });
        };
        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header
                className="sticky top-0 z-50 glass"
                style={{ borderBottom: '1px solid var(--border)' }}
            >
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/pronunciation" className="flex items-center gap-3 group">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                        >
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-bold leading-none">
                                Pronunciation
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>
                                Feasibility
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'text-[var(--foreground)]'
                                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 rounded-lg"
                                            style={{ background: 'var(--primary)/10' }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Status indicators + Mobile menu button */}
                    <div className="flex items-center gap-4">
                        {/* Status */}
                        <div className="hidden sm:flex items-center gap-3">
                            <div
                                className="flex items-center gap-1.5 text-xs"
                                title={health?.api ? 'API Connected' : 'API Disconnected'}
                            >
                                {health?.api ? (
                                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                    <WifiOff className="w-3.5 h-3.5 text-red-400" />
                                )}
                                <span style={{ color: 'var(--foreground-muted)' }}>API</span>
                            </div>
                            <div
                                className="flex items-center gap-1.5 text-xs"
                                title={health?.database ? 'DB Connected' : 'DB Disconnected'}
                            >
                                <Database
                                    className={`w-3.5 h-3.5 ${health?.database ? 'text-emerald-400' : 'text-red-400'}`}
                                />
                                <span style={{ color: 'var(--foreground-muted)' }}>DB</span>
                            </div>
                        </div>

                        {/* Mobile menu toggle */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-[var(--card)]"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.nav
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden"
                            style={{ borderTop: '1px solid var(--border)' }}
                        >
                            <div className="p-4 space-y-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive
                                                    ? 'bg-[var(--primary)]/10 text-[var(--foreground)]'
                                                    : 'text-[var(--foreground-muted)] hover:bg-[var(--card)]'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </header>

            {/* Main content */}
            <main className="flex-1">{children}</main>
        </div>
    );
}
