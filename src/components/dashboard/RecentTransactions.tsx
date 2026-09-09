'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftRight, ChevronRight, Shuffle } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';
import { formatIDR, formatSignedIDR } from '../../lib/finance/currency';
import { formatDateIndo } from '../../lib/finance/dates';

export function RecentTransactions() {
  const { transactions, categories, accounts } = useFinance();

  // Ambil 5 transaksi terbaru
  const recent = transactions.slice(0, 5);

  const getCategoryInfo = (catId?: string) => {
    return categories.find((c) => c.id === catId);
  };

  const getAccountName = (accId: string) => {
    return accounts.find((a) => a.id === accId)?.name || 'Akun';
  };

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Transaksi Terbaru
        </h3>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 text-center">
          <ArrowLeftRight className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Belum ada transaksi.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tekan tombol + di bawah untuk mencatat pengeluaran pertama Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((tx) => {
            const cat = getCategoryInfo(tx.categoryId);
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex items-center justify-between transition-colors"
              >
                {/* Icon Kategori / Tipe */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0 text-lg">
                    {isTransfer ? (
                      <Shuffle className="w-4 h-4 text-sky-400" />
                    ) : (
                      cat?.icon || (isIncome ? '💰' : '📦')
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isTransfer
                        ? `Transfer: ${getAccountName(tx.accountId)} → ${getAccountName(tx.toAccountId || '')}`
                        : tx.note || cat?.name || 'Transaksi'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {formatDateIndo(tx.date)} • {getAccountName(tx.accountId)}
                    </p>
                  </div>
                </div>

                {/* Nominal */}
                <div className="text-right shrink-0 pl-2">
                  <p
                    className={`text-xs font-extrabold tracking-tight ${
                      isIncome
                        ? 'text-emerald-400'
                        : isExpense
                        ? 'text-rose-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {isTransfer
                      ? formatIDR(tx.amount)
                      : formatSignedIDR(tx.amount, tx.type)}
                  </p>
                  <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider">
                    {tx.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
