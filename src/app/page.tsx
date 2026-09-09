'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, ChevronRight } from 'lucide-react';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { AccountSlider } from '../components/dashboard/AccountSlider';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { useFinance } from '../lib/store/financeContext';
import { generateMonthlyReceipt } from '../lib/finance/reports';
import { formatIDR } from '../lib/finance/currency';

export default function HomePage() {
  const { transactions, categories, isLoaded } = useFinance();

  // Ambil data struk bulan berjalan sebagai teaser
  const currentReceipt = React.useMemo(() => {
    return generateMonthlyReceipt(transactions, categories, new Date());
  }, [transactions, categories]);

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24 space-y-4">
      {/* 1. Overview Kartu Total Saldo & Arus Kas */}
      <BalanceCard />

      {/* 2. Slider Dompet & Rekening */}
      <AccountSlider />

      {/* 3. Teaser Struk Digital Bulan Ini */}
      <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white">Struk {currentReceipt.dateRangeLabel}</h4>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              {currentReceipt.transactionCount} transaksi • Pengeluaran: {formatIDR(currentReceipt.totalExpense)}
            </p>
          </div>
        </div>

        <Link
          href="/reports"
          className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
        >
          <span>Buka</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Transaksi Terbaru */}
      <RecentTransactions />
    </div>
  );
}
