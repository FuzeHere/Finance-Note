'use client';

import React, { useState } from 'react';
import { User, Mail, LogIn, LogOut, Check, X, Shield, Plus, Cloud, CloudCheck, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';

// Google Icon SVG Resmi
function GoogleLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function ProfileModal() {
  const {
    currentUser,
    profiles,
    loginOrCreateProfile,
    switchProfile,
    logoutToGuest,
    isProfileModalOpen,
    closeProfileModal,
    cloudSyncStatus,
    lastSyncedAt,
    isCloudActive,
    isGoogleConfigured,
    syncToCloud,
    loginWithGoogle,
    loginWithDemoGoogle,
    logoutFromCloud,
  } = useFinance();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  if (!isProfileModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    loginOrCreateProfile(name.trim(), email.trim() || undefined);
    setName('');
    setEmail('');
    setIsCreatingNew(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncToCloud();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    await loginWithDemoGoogle('budi.santoso@gmail.com', 'Budi Santoso');
    setDemoLoading(false);
  };

  const formatSyncTime = (isoString: string | null) => {
    if (!isoString) return 'Belum tersinkron';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              {isCloudActive ? <Cloud className="w-4 h-4 text-sky-400" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Akun & Cloud Sync</h3>
              <p className="text-[11px] text-slate-400">
                {isCloudActive ? 'Akun Google (Cloud Aktif)' : currentUser.isGuest ? 'Mode Tamu (Offline)' : 'Akun Lokal'}
              </p>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil Aktif Saat Ini */}
        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {currentUser.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full ${isCloudActive ? 'bg-gradient-to-tr from-sky-500 to-indigo-500' : 'bg-gradient-to-tr from-emerald-500 to-teal-400'} text-slate-950 font-black text-sm flex items-center justify-center shrink-0`}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  {isCloudActive && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1 shrink-0">
                      <CloudCheck className="w-2.5 h-2.5" />
                      Cloud
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser.email || (currentUser.isGuest ? 'Hanya tersimpan di browser ini' : 'Penyimpanan lokal')}
                </p>
              </div>
            </div>

            {!currentUser.isGuest && (
              <button
                onClick={isCloudActive ? logoutFromCloud : logoutToGuest}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors shrink-0 cursor-pointer"
                title="Keluar ke Mode Tamu"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cloud Sync Status Info for Logged-In Google Users */}
          {isCloudActive && (
            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                {cloudSyncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                    <span className="text-sky-300">Menyinkronkan data...</span>
                  </>
                ) : cloudSyncStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span className="text-rose-400">Gagal sinkron</span>
                  </>
                ) : (
                  <>
                    <CloudCheck className="w-3 h-3 text-emerald-400" />
                    <span>Tersinkron: {formatSyncTime(lastSyncedAt)}</span>
                  </>
                )}
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing || cloudSyncStatus === 'syncing'}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          )}
        </div>

        {/* Section: Login Gmail (Cloud Sync) */}
        {!isCloudActive && (
          <div className="space-y-2 p-3 bg-gradient-to-b from-sky-950/30 to-slate-800/40 border border-sky-800/30 rounded-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-xs font-bold text-white">Sinkronisasi Cloud dengan Gmail</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Login dengan Google agar transaksi & akun tersimpan aman di cloud dan dapat dibuka dari berbagai perangkat (HP/Laptop).
            </p>

            {isGoogleConfigured ? (
              <button
                onClick={loginWithGoogle}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <GoogleLogo className="w-4 h-4" />
                <span>Masuk dengan Akun Google</span>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <GoogleLogo className="w-4 h-4" />
                  <span>Masuk dengan Google (OAuth)</span>
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <div className="h-px bg-slate-700 flex-1" />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">atau coba langsung</span>
                  <div className="h-px bg-slate-700 flex-1" />
                </div>

                <button
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{demoLoading ? 'Menghubungkan...' : 'Login Gmail Simulasi (Demo Cloud)'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Daftar Profil Lokal yang Tersimpan (jika ada) */}
        {profiles.length > 1 && !isCreatingNew && (
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Akun Lokal Lainnya
            </label>
            <div className="space-y-1.5 max-h-28 overflow-y-auto no-scrollbar">
              {profiles.map((p) => {
                const isActive = p.id === currentUser.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-colors cursor-pointer ${
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

        {/* Form Buat Profil Lokal Manual */}
        {isCreatingNew ? (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Buat Profil Lokal Baru</span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
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
              <span>Simpan Profil Lokal</span>
            </button>
          </form>
        ) : (
          !isCloudActive && (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gunakan Profil Lokal Offline</span>
            </button>
          )
        )}

        {/* Footer Security Note */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            {isCloudActive
              ? 'Tersimpan aman & terenkripsi di server database cloud Anda.'
              : 'Data tersimpan lokal di browser. Login Google untuk backup cloud.'}
          </span>
        </div>
      </div>
    </div>
  );
}
