'use client';

import React, { useRef, useState } from 'react';
import { X, Check, ArrowRight, Calendar, AlertCircle, AlertTriangle, Camera, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../../lib/store/financeContext';
import { TransactionType } from '../../lib/types';
import { formatIDR, parseIDRInput } from '../../lib/finance/currency';
import { getTodayDateString } from '../../lib/finance/dates';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

function TransactionModalForm({
  onClose,
  initialType = 'expense',
}: {
  onClose: () => void;
  initialType?: TransactionType;
}) {
  const { accounts, categories, addTransaction, updateTransaction, editingTransaction } = useFinance();

  const isEditing = Boolean(editingTransaction);

  // Inisialisasi state form langsung dari data awal tanpa useEffect cascading
  const [type, setType] = useState<TransactionType>(() => {
    return editingTransaction ? editingTransaction.type : initialType;
  });

  const [rawAmount, setRawAmount] = useState<string>(() => {
    return editingTransaction ? String(editingTransaction.amount) : '';
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.accountId;
    return accounts.length > 0 ? accounts[0].id : '';
  });

  const [selectedToAccountId, setSelectedToAccountId] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.toAccountId || '';
    return accounts.length > 1 ? accounts[1].id : '';
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.categoryId || '';
    const filteredCats = categories.filter((c) => c.type === (initialType === 'income' ? 'income' : 'expense'));
    return filteredCats.length > 0 ? filteredCats[0].id : '';
  });

  const [date, setDate] = useState<string>(() => {
    return editingTransaction ? editingTransaction.date : getTodayDateString();
  });

  const [note, setNote] = useState<string>(() => {
    return editingTransaction?.note || '';
  });

  const [receiptItems, setReceiptItems] = useState<Array<{ name: string; price: number }>>(() => editingTransaction?.receiptItems || []);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrorMessage('');
    if (newType !== 'transfer') {
      const filteredCats = categories.filter((c) => c.type === newType);
      if (filteredCats.length > 0) {
        setSelectedCategoryId(filteredCats[0].id);
      }
    }
  };

  const currentNumericAmount = parseIDRInput(rawAmount);
  const availableCategories = categories.filter((c) => c.type === type);

  const currentAccount = accounts.find((a) => a.id === selectedAccountId);
  const availableBalance = currentAccount?.currentBalance ?? currentAccount?.initialBalance ?? 0;
  const isBalanceWarning = (type === 'expense' || type === 'transfer') && currentNumericAmount > availableBalance;

  const handleQuickAmount = (val: number) => {
    setRawAmount(String(val));
  };

  const handleReceiptScan = async (file?: File) => {
    if (!file) return;
    setIsScanning(true);
    setScanMessage('Sedang membaca struk di server lokal…');
    setErrorMessage('');
    try {
      const body = new FormData();
      body.append('image', file);
      const response = await fetch('/api/receipt/scan', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Struk gagal dipindai.');
      if (result.date) setDate(result.date);
      const extractedItems = Array.isArray(result.items) ? result.items.filter((item: { name?: string; price?: number }) => item.name && Number(item.price) > 0) : [];
      if (extractedItems.length) setReceiptItems(extractedItems);
      const extractedTotal = Number(result.total) || extractedItems.reduce((sum: number, item: { price: number }) => sum + Number(item.price), 0);
      if (extractedTotal > 0) setRawAmount(String(extractedTotal));
      const found = [result.date ? 'tanggal' : '', extractedItems.length ? `${extractedItems.length} item` : '', extractedTotal ? 'total' : ''].filter(Boolean).join(', ');
      setScanMessage(found ? `Terbaca: ${found}. Periksa kembali sebelum menyimpan.` : 'Teks terbaca, tetapi tanggal atau item belum terdeteksi. Silakan isi manual.');
      if (!found) setNote((previous) => previous || String(result.text || '').split('\n').filter(Boolean).slice(0, 5).join(' '));
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : 'Struk gagal dipindai.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (currentNumericAmount <= 0) {
      setErrorMessage('Nominal harus lebih besar dari Rp 0');
      return;
    }

    if (!selectedAccountId) {
      setErrorMessage('Pilih akun / dompet sumber');
      return;
    }

    if (type === 'transfer') {
      if (!selectedToAccountId) {
        setErrorMessage('Pilih akun / dompet tujuan transfer');
        return;
      }
      if (selectedAccountId === selectedToAccountId) {
        setErrorMessage('Akun tujuan tidak boleh sama dengan akun sumber');
        return;
      }
    } else {
      if (!selectedCategoryId) {
        setErrorMessage('Pilih kategori transaksi');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editingTransaction) {
        updateTransaction({
          ...editingTransaction,
          type,
          amount: currentNumericAmount,
          receiptItems: type === 'expense' && receiptItems.length ? receiptItems : undefined,
          accountId: selectedAccountId,
          toAccountId: type === 'transfer' ? selectedToAccountId : undefined,
          categoryId: type !== 'transfer' ? selectedCategoryId : undefined,
          date,
          note: note.trim() || undefined,
        });
      } else {
        addTransaction({
          type,
          amount: currentNumericAmount,
          receiptItems: type === 'expense' && receiptItems.length ? receiptItems : undefined,
          accountId: selectedAccountId,
          toAccountId: type === 'transfer' ? selectedToAccountId : undefined,
          categoryId: type !== 'transfer' ? selectedCategoryId : undefined,
          date,
          note: note.trim() || undefined,
        });

        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#06b6d4', '#f59e0b'],
        });
      }

      onClose();
    } catch {
      setErrorMessage('Gagal menyimpan transaksi. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-200"
      role="dialog"
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">
          {isEditing ? 'Ubah Transaksi' : 'Catat Transaksi'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Segmented Control Tipe Transaksi */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 rounded-xl my-4 border border-slate-700/50">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            type === 'expense'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            type === 'income'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('transfer')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            type === 'transfer'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Transfer
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {type === 'expense' && (
        <div className="space-y-2">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => void handleReceiptScan(e.target.files?.[0])} />
          <button type="button" disabled={isScanning} onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60">
            {isScanning ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {isScanning ? 'Memindai struk…' : 'Pindai foto struk'}
          </button>
          {scanMessage && <p className="text-xs text-slate-400">{scanMessage}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Nominal Utama */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 text-center">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Jumlah Nominal (IDR)
          </label>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-bold text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus={!isEditing}
              placeholder="0"
              value={rawAmount ? formatIDR(currentNumericAmount, false) : ''}
              onChange={(e) => setRawAmount(e.target.value)}
              className="w-full text-center text-3xl font-extrabold text-white bg-transparent border-none outline-none tracking-tight placeholder-slate-600 focus:ring-0"
            />
          </div>

          {isBalanceWarning && (
            <div className="mt-2 text-[11px] text-amber-400 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Nominal melebihi sisa saldo dompet ({formatIDR(availableBalance)})</span>
            </div>
          )}

          {/* Quick Amount Chips */}
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-700/40 overflow-x-auto no-scrollbar">
            {[20000, 50000, 100000, 200000, 500000].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => handleQuickAmount(quick)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              >
                +{quick >= 1000000 ? `${quick / 1000000}jt` : `${quick / 1000}rb`}
              </button>
            ))}
          </div>
        </div>

        {/* Kategori */}
        {type === 'expense' && receiptItems.length > 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-200">Item struk · periksa hasil scan</p>
              <button type="button" onClick={() => setReceiptItems([...receiptItems, { name: '', price: 0 }])} className="flex items-center gap-1 text-xs text-emerald-300"><Plus className="w-3.5 h-3.5" />Tambah</button>
            </div>
            {receiptItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input aria-label={`Nama item ${index + 1}`} value={item.name} onChange={(e) => setReceiptItems(receiptItems.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} placeholder="Nama item" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
                <input aria-label={`Harga item ${index + 1}`} type="number" min="0" value={item.price || ''} onChange={(e) => setReceiptItems(receiptItems.map((row, i) => i === index ? { ...row, price: Number(e.target.value) || 0 } : row))} placeholder="Harga" className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
                <button type="button" aria-label={`Hapus item ${index + 1}`} onClick={() => setReceiptItems(receiptItems.filter((_, i) => i !== index))} className="p-2 text-slate-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Kategori */}
        {type !== 'transfer' && (
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Kategori
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto no-scrollbar p-1">
              {availableCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-medium truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dompet / Transfer */}
        {type === 'transfer' ? (
          <div className="space-y-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Dari Akun / Dompet Asal
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Sisa: {formatIDR(acc.currentBalance ?? acc.initialBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Ke Akun / Dompet Tujuan
              </label>
              <select
                value={selectedToAccountId}
                onChange={(e) => setSelectedToAccountId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Sisa: {formatIDR(acc.currentBalance ?? acc.initialBalance)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Pilih Dompet / Rekening
            </label>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{acc.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatIDR(acc.currentBalance ?? acc.initialBalance)}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tanggal & Catatan */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5" /> Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Cth: Makan siang kantor"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Tombol Simpan / Perbarui */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Memproses...</span>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Perbarui Transaksi' : 'Simpan Transaksi'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export function TransactionModal({ isOpen, onClose, initialType = 'expense' }: TransactionModalProps) {
  const { editingTransaction } = useFinance();

  if (!isOpen) return null;

  // Render form dengan key unik agar state tereset otomatis tanpa useEffect cascading
  const modalKey = editingTransaction ? `edit-${editingTransaction.id}` : `new-${initialType}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <TransactionModalForm
        key={modalKey}
        onClose={onClose}
        initialType={initialType}
      />
    </div>
  );
}
