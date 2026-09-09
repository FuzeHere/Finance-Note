'use client';

import React, { useState } from 'react';
import { User, Mail, LogIn, LogOut, Check, X, Shield, Plus } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';

export function ProfileModal() {
  const {
    currentUser,
    profiles,
    loginOrCreateProfile,
    switchProfile,
    logoutToGuest,
    isProfileModalOpen,
    closeProfileModal,
  } = useFinance();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!isProfileModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    loginOrCreateProfile(name.trim(), email.trim() || undefined);
    setName('');
    setEmail('');
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Akun Pengguna</h3>
              <p className="text-[11px] text-slate-400">
                {currentUser.isGuest ? 'Mode Tamu (Offline)' : 'Akun Terdaftar'}
              </p>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil Aktif Saat Ini */}
        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400">
                {currentUser.email || (currentUser.isGuest ? 'Penyimpanan lokal di browser ini' : 'Akun pribadi')}
              </p>
            </div>
          </div>

          {!currentUser.isGuest && (
            <button
              onClick={logoutToGuest}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
              title="Keluar ke Mode Tamu"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Daftar Profil yang Tersimpan */}
        {profiles.length > 1 && !isCreatingNew && (
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Beralih Akun
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {profiles.map((p) => {
                const isActive = p.id === currentUser.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold truncate">{p.name}</span>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Buat / Pakai Akun Baru */}
        {isCreatingNew || (currentUser.isGuest && profiles.length <= 1) ? (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {currentUser.isGuest ? 'Masuk / Buat Akun Pribadi' : 'Tambah Akun Baru'}
              </span>
              {isCreatingNew && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cth: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Email (Opsional)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="budi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Gunakan Akun Ini</span>
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah / Ganti Akun Lain</span>
          </button>
        )}

        {/* Footer Security Note */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Data keuangan tersimpan aman di browser Anda dan terisolasi.</span>
        </div>
      </div>
    </div>
  );
}
