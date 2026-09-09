'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';
import { ReceiptCard } from '../../components/finance/ReceiptCard';
import {
  generateWeeklyReceipt,
  generateMonthlyReceipt,
  generateYearlyReceipt,
} from '../../lib/finance/reports';

type ReportPeriodType = 'weekly' | 'monthly' | 'yearly';

export default function ReportsPage() {
  const { transactions, categories, isLoaded } = useFinance();

  const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Navigasi periode sebelumnya & berikutnya
  const handlePrevPeriod = () => {
    const next = new Date(currentDate);
    if (periodType === 'weekly') {
      next.setDate(next.getDate() - 7);
    } else if (periodType === 'monthly') {
      next.setMonth(next.getMonth() - 1);
    } else if (periodType === 'yearly') {
      next.setFullYear(next.getFullYear() - 1);
    }
    setCurrentDate(next);
  };

  const handleNextPeriod = () => {
    const next = new Date(currentDate);
    if (periodType === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (periodType === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else if (periodType === 'yearly') {
      next.setFullYear(next.getFullYear() + 1);
    }
    setCurrentDate(next);
  };

  const handleResetToCurrent = () => {
    setCurrentDate(new Date());
  };

  // Generate laporan struk secara deterministik
  const activeReport = useMemo(() => {
    if (periodType === 'weekly') {
      return generateWeeklyReceipt(transactions, categories, currentDate);
    }
    if (periodType === 'monthly') {
      return generateMonthlyReceipt(transactions, categories, currentDate);
    }
    return generateYearlyReceipt(transactions, categories, currentDate);
  }, [transactions, categories, periodType, currentDate]);

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24 space-y-4">
      {/* Header Halaman */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span>Struk Keuangan</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400">
            Laporan otomatis ala struk belanja digital
          </p>
        </div>

        <button
          onClick={handleResetToCurrent}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-colors"
        >
          Hari Ini
        </button>
      </div>

      {/* Segmented Period Switcher (Weekly / Monthly / Yearly) */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
        <button
          onClick={() => setPeriodType('weekly')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            periodType === 'weekly'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mingguan
        </button>
        <button
          onClick={() => setPeriodType('monthly')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            periodType === 'monthly'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Bulanan
        </button>
        <button
          onClick={() => setPeriodType('yearly')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            periodType === 'yearly'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tahunan
        </button>
      </div>

      {/* Navigasi Periode (‹ Tanggal ›) */}
      <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-xl border border-slate-700/40">
        <button
          onClick={handlePrevPeriod}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          aria-label="Periode Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold text-white text-center">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{activeReport.dateRangeLabel}</span>
        </div>

        <button
          onClick={handleNextPeriod}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          aria-label="Periode Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Kartu Struk Keuangan Digital */}
      <ReceiptCard report={activeReport} />
    </div>
  );
}
