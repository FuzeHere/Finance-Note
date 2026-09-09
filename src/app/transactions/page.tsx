'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Edit3, ArrowLeftRight, Shuffle, Plus, AlertCircle, X, RotateCcw } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';
import { Transaction } from '../../lib/types';
import { formatIDR, formatSignedIDR } from '../../lib/finance/currency';
import { formatDateIndo } from '../../lib/finance/dates';

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    accounts,
    deleteTransaction,
    undoDeleteTransaction,
    openAddModal,
    openEditModal,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  // Filter & Search transaksi
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter tipe
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // Filter akun
      if (selectedAccount !== 'all') {
        if (tx.accountId !== selectedAccount && tx.toAccountId !== selectedAccount) {
          return false;
        }
      }

      // Filter pencarian teks
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === tx.categoryId);
        const matchNote = tx.note?.toLowerCase().includes(query);
        const matchCat = cat?.name.toLowerCase().includes(query);
        const matchAmount = String(tx.amount).includes(query);

        if (!matchNote && !matchCat && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, categories, selectedType, selectedAccount, searchQuery]);

  // Group transaksi berdasarkan tanggal
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};
    for (const tx of filteredTransactions) {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    }
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateStr) => ({
        dateStr,
        items: groups[dateStr],
      }));
  }, [filteredTransactions]);

  const getCategory = (id?: string) => categories.find((c) => c.id === id);
  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeleteConfirmId(null);
    setShowUndoBanner(true);
    // Banner auto-hide setelah 5 detik
    setTimeout(() => {
      setShowUndoBanner(false);
    }, 5000);
  };

  const handleUndo = () => {
    undoDeleteTransaction();
    setShowUndoBanner(false);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24 space-y-4 relative">
      {/* Undo Floating Banner */}
      {showUndoBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto bg-slate-800 text-white px-4 py-3 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
          <span className="text-xs font-medium text-slate-300">
            Transaksi telah dihapus.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal (Undo)</span>
            </button>
            <button
              onClick={() => setShowUndoBanner(false)}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-400">
            {filteredTransactions.length} transaksi ditemukan
          </p>
        </div>

        <button
          onClick={() => openAddModal('expense')}
          className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari transaksi, catatan, atau nominal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Chips Tipe */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'expense', label: 'Pengeluaran' },
          { id: 'income', label: 'Pemasukan' },
          { id: 'transfer', label: 'Transfer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              selectedType === tab.id
                ? 'bg-slate-200 text-slate-950 font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Akun Dompet */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Semua Dompet & Rekening</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Daftar Transaksi Terkelompokkan per Tanggal */}
      {groupedByDate.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-8 text-center my-6">
          <ArrowLeftRight className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold">Tidak ada transaksi ditemukan</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Coba ubah kata kunci pencarian atau filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => {
            let dayExpense = 0;
            let dayIncome = 0;
            for (const item of group.items) {
              if (item.type === 'expense') dayExpense += item.amount;
              if (item.type === 'income') dayIncome += item.amount;
            }

            return (
              <div key={group.dateStr} className="space-y-1.5">
                {/* Header Tanggal */}
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-semibold border-b border-slate-800/80 pb-1">
                  <span>{formatDateIndo(group.dateStr, true)}</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    {dayExpense > 0 && (
                      <span className="text-rose-400">-{formatIDR(dayExpense)}</span>
                    )}
                    {dayIncome > 0 && (
                      <span className="text-emerald-400">+{formatIDR(dayIncome)}</span>
                    )}
                  </div>
                </div>

                {/* Items Transaksi */}
                <div className="space-y-2">
                  {group.items.map((tx) => {
                    const cat = getCategory(tx.categoryId);
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const srcAcc = getAccount(tx.accountId);
                    const destAcc = tx.toAccountId ? getAccount(tx.toAccountId) : undefined;

                    return (
                      <div
                        key={tx.id}
                        className="bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 p-3 rounded-2xl flex items-center justify-between transition-colors"
                      >
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
                                ? `Transfer: ${srcAcc?.name || 'Asal'} → ${destAcc?.name || 'Tujuan'}`
                                : tx.note || cat?.name || 'Transaksi'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {isTransfer
                                ? 'Pindah Kas'
                                : `${cat?.name || 'Kategori'} • ${srcAcc?.name || 'Akun'}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-2">
                          <div className="text-right">
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

                          {/* Tombol Edit Transaksi */}
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                            aria-label="Ubah Transaksi"
                            title="Ubah Transaksi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => setDeleteConfirmId(tx.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                            aria-label="Hapus Transaksi"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Transaksi */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Hapus Transaksi?</h3>
            <p className="text-xs text-slate-400">
              Transaksi akan dihapus dan saldo akun Anda akan diperbarui. Anda masih dapat membatalkannya melalui tombol Undo.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="py-2 px-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold transition-colors shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
