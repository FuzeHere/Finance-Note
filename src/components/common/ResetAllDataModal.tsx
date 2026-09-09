'use client';

import React from 'react';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';

export function ResetAllDataModal() {
  const { isResetModalOpen, closeResetModal, resetAllData, hardResetCleanData } = useFinance();

  if (!isResetModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Reset Semua Data</h3>
          </div>
          <button
            onClick={closeResetModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Pilih jenis reset yang Anda inginkan. Seluruh transaksi dan saldo yang ada akan diatur ulang sesuai opsi berikut:
        </p>

        <div className="space-y-2.5 pt-1">
          {/* Opsi 1: Bersihkan Total / Mulai dari Nol */}
          <button
            onClick={hardResetCleanData}
            className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-colors flex items-start gap-3 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-400 group-hover:text-rose-300">
                Bersih Total (Mulai dari Nol)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hapus semua riwayat transaksi, sisakan 1 dompet Uang Tunai dengan saldo Rp 0.
              </p>
            </div>
          </button>

          {/* Opsi 2: Kembalikan ke Data Contoh Awal */}
          <button
            onClick={resetAllData}
            className="w-full p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-start gap-3 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                Kembalikan ke Data Contoh Awal
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Muat ulang contoh rekening (BCA, DANA, Cash, GoPay) dan contoh transaksi realistis.
              </p>
            </div>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={closeResetModal}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
