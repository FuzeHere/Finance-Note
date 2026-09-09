'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, ArrowLeftRight, CreditCard, Plus } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';

export function BottomNav() {
  const pathname = usePathname();
  const { openAddModal } = useFinance();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-bottom">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Nav item 1: Beranda */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname === '/' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[11px]">Beranda</span>
        </Link>

        {/* Nav item 2: Transaksi */}
        <Link
          href="/transactions"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname === '/transactions' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 mb-1" />
          <span className="text-[11px]">Riwayat</span>
        </Link>

        {/* Center Floating Action Button: + Catat */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => openAddModal('expense')}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform border-4 border-slate-900 cursor-pointer"
            aria-label="Catat Transaksi Baru"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Nav item 3: Laporan Struk */}
        <Link
          href="/reports"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname === '/reports' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-5 h-5 mb-1" />
          <span className="text-[11px]">Struk</span>
        </Link>

        {/* Nav item 4: Akun/Dompet */}
        <Link
          href="/accounts"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname === '/accounts' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-5 h-5 mb-1" />
          <span className="text-[11px]">Dompet</span>
        </Link>
      </div>
    </div>
  );
}
