'use client';

import React from 'react';
import Link from 'next/link';
import { Wallet, Building2, Smartphone, Banknote, ChevronRight, Plus } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';
import { formatIDR } from '../../lib/finance/currency';
import { AccountType } from '../../lib/types';

export function AccountSlider() {
  const { accounts } = useFinance();

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'ewallet':
        return <Smartphone className="w-4 h-4 text-sky-400" />;
      case 'cash':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      default:
        return <Wallet className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="w-full my-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Dompet & Rekening
        </h3>
        <Link
          href="/accounts"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
        >
          <span>Kelola</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="min-w-[150px] max-w-[170px] shrink-0 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 p-3.5 rounded-2xl shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700/60">
                {getAccountIcon(acc.type)}
              </div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {acc.type}
              </span>
            </div>

            <p className="text-xs font-semibold text-white truncate">{acc.name}</p>
            <p className="text-sm font-extrabold text-slate-100 mt-1 tracking-tight">
              {formatIDR(acc.currentBalance ?? acc.initialBalance)}
            </p>
          </div>
        ))}

        {/* Tombol Tambah Akun Mini */}
        <Link
          href="/accounts"
          className="min-w-[110px] shrink-0 bg-slate-800/40 hover:bg-slate-800/60 border border-dashed border-slate-700 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center text-slate-400 hover:text-white transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center mb-1 text-slate-300">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold">Tambah</span>
        </Link>
      </div>
    </div>
  );
}
