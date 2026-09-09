'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Eye, EyeOff, Plus, Receipt } from 'lucide-react';
import Link from 'next/link';
import { formatIDR } from '../../lib/finance/currency';
import { useFinance } from '../../lib/store/financeContext';
import { getMonthRange } from '../../lib/finance/dates';
import { calculatePeriodCashFlow } from '../../lib/finance/calculations';

export function BalanceCard() {
  const { totalBalance, transactions, openAddModal } = useFinance();
  const [showBalance, setShowBalance] = React.useState(true);

  // Arus kas bulan ini
  const monthRange = getMonthRange(new Date());
  const monthFlow = calculatePeriodCashFlow(
    transactions,
    monthRange.startStr,
    monthRange.endStr
  );

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-xl shadow-black/40 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Kartu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Total Kekayaan
          </span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
            aria-label="Toggle Tampilkan Saldo"
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
          {monthRange.label}
        </span>
      </div>

      {/* Nilai Total Saldo */}
      <div className="my-2">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {showBalance ? formatIDR(totalBalance) : '••••••••'}
        </h2>
      </div>

      {/* Ringkasan Arus Kas Bulan Ini */}
      <div className="grid grid-cols-2 gap-2.5 pt-4 mt-4 border-t border-slate-800/80">
        <div className="bg-slate-800/40 p-2.5 rounded-2xl border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </div>
          <p className="text-sm font-bold text-white">
            {showBalance ? formatIDR(monthFlow.totalIncome) : '••••••'}
          </p>
        </div>

        <div className="bg-slate-800/40 p-2.5 rounded-2xl border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-400 mb-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Pengeluaran</span>
          </div>
          <p className="text-sm font-bold text-white">
            {showBalance ? formatIDR(monthFlow.totalExpense) : '••••••'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
        <button
          onClick={() => openAddModal('expense')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Catat Cepat</span>
        </button>

        <Link
          href="/reports"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 active:scale-95 transition-all"
        >
          <Receipt className="w-4 h-4 text-amber-400" />
          <span>Lihat Struk</span>
        </Link>
      </div>
    </div>
  );
}
