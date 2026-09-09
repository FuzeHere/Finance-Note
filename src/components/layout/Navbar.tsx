'use client';

import React from 'react';
import { Wallet2, Sun, Moon, User, RotateCcw } from 'lucide-react';
import { formatDateIndo, getTodayDateString } from '../../lib/finance/dates';
import { useFinance } from '../../lib/store/financeContext';
import { useTheme } from '../../lib/store/themeContext';

export function Navbar() {
  const todayStr = getTodayDateString();
  const { currentUser, openProfileModal, openResetModal } = useFinance();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 backdrop-blur-md border-b border-slate-800/80 dark:border-slate-800/80 px-4 py-2.5 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & Date */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Wallet2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white">DompetKu</h1>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Receipt
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {formatDateIndo(todayStr, true)}
            </p>
          </div>
        </div>

        {/* Action Controls: Akun Pengguna, Tema, dan Reset Data */}
        <div className="flex items-center gap-1.5">
          {/* Tombol Opsi Pakai Akun / Profil */}
          <button
            onClick={openProfileModal}
            className="flex items-center gap-1.5 py-1 px-2 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            title="Pengaturan Akun"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
            </div>
            <span className="text-[11px] max-w-[70px] truncate font-medium">
              {currentUser.isGuest ? 'Masuk' : currentUser.name}
            </span>
          </button>

          {/* Tombol Toggle Tema Gelap / Terang */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Toggle Tema Gelap atau Terang"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Tombol Opsi Reset All Data Cepat */}
          <button
            onClick={openResetModal}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            aria-label="Reset Semua Data"
            title="Reset Semua Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
