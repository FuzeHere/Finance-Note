'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  Plus,
  ArrowRightLeft,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';
import { formatIDR, parseIDRInput } from '../../lib/finance/currency';
import { AccountType } from '../../lib/types';

export default function AccountsPage() {
  const {
    accounts,
    totalBalance,
    addAccount,
    deleteAccount,
    hasLinkedTransactions,
    openAddModal,
    openResetModal,
    exportBackupJSON,
    importBackupJSON,
    isLoaded,
  } = useFinance();

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('bank');
  const [rawInitialBalance, setRawInitialBalance] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [accountToDeleteId, setAccountToDeleteId] = useState<string | null>(null);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5 text-sky-400" />;
      case 'cash':
        return <Banknote className="w-5 h-5 text-emerald-400" />;
      default:
        return <Wallet className="w-5 h-5 text-purple-400" />;
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      initialBalance: parseIDRInput(rawInitialBalance),
      color: '#3b82f6',
    });

    setNewAccName('');
    setRawInitialBalance('');
    setIsAddAccountModalOpen(false);
    showToast('Dompet/Rekening baru berhasil ditambahkan!');
  };

  const handleDeleteAccount = (id: string) => {
    const res = deleteAccount(id);
    setAccountToDeleteId(null);
    if (res.success) {
      showToast('Dompet berhasil dihapus');
    } else {
      alert(res.message || 'Gagal menghapus dompet');
    }
  };

  const handleExportBackup = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-keuangan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('File backup berhasil diunduh!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        showToast('Data berhasil dipulihkan dari backup!');
      } else {
        alert('Format file cadangan tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24 space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Dompet & Rekening
          </h1>
          <p className="text-xs text-slate-400">
            Kelola sumber dana, bank, dan e-wallet
          </p>
        </div>

        <button
          onClick={() => setIsAddAccountModalOpen(true)}
          className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Total Kekayaan Agregat */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Sisa Saldo
          </span>
          <p className="text-2xl font-black text-white tracking-tight mt-0.5">
            {formatIDR(totalBalance)}
          </p>
        </div>

        <button
          onClick={() => openAddModal('transfer')}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-bold border border-sky-500/30 transition-colors cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Transfer Kas</span>
        </button>
      </div>

      {/* List Akun */}
      <div className="space-y-2.5">
        {accounts.map((acc) => {
          const hasLinked = hasLinkedTransactions(acc.id);

          return (
            <div
              key={acc.id}
              className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
                  {getAccountIcon(acc.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{acc.name}</p>
                  <p className="text-[11px] text-slate-400 uppercase font-medium">
                    Tipe: {acc.type} • Saldo Awal: {formatIDR(acc.initialBalance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-white">
                    {formatIDR(acc.currentBalance ?? acc.initialBalance)}
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold">Aktif</span>
                </div>

                {/* Tombol Hapus Akun dengan Konfirmasi */}
                {accounts.length > 1 && (
                  <button
                    onClick={() => setAccountToDeleteId(acc.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                    title={hasLinked ? 'Akun memiliki riwayat transaksi' : 'Hapus Akun'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manajemen Cadangan Data (Backup / Restore / Reset) */}
      <div className="mt-8 pt-4 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Cadangan & Pemulihan Data
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor Cadangan</span>
          </button>

          <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Impor Cadangan</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

        <button
          onClick={openResetModal}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Opsi Reset Semua Data</span>
        </button>
      </div>

      {/* Modal Tambah Akun Baru */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Tambah Akun Baru</h3>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Dompet / Rekening
                </label>
                <input
                  type="text"
                  placeholder="Cth: Mandiri Utama / OVO"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Jenis Akun
                </label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as AccountType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bank">Rekening Bank (BCA, Mandiri, BRI, dll)</option>
                  <option value="ewallet">E-Wallet (GoPay, DANA, OVO, ShopeePay)</option>
                  <option value="cash">Uang Tunai / Dompet Fisik</option>
                  <option value="savings">Tabungan / Investasi</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={rawInitialBalance ? formatIDR(parseIDRInput(rawInitialBalance), false) : ''}
                  onChange={(e) => setRawInitialBalance(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Akun */}
      {accountToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Hapus Dompet Ini?</h3>
            {hasLinkedTransactions(accountToDeleteId) ? (
              <p className="text-xs text-rose-300 font-medium">
                Peringatan: Dompet ini memiliki riwayat transaksi aktif. Anda tidak dapat menghapus dompet yang sedang digunakan untuk menjaga konsistensi keuangan.
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Dompet ini tidak memiliki transaksi dan aman untuk dihapus.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setAccountToDeleteId(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteAccount(accountToDeleteId)}
                disabled={hasLinkedTransactions(accountToDeleteId)}
                className="py-2 px-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold transition-colors shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
