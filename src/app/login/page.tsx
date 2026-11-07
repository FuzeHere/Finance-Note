'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) { setError(result.message || 'Gagal masuk.'); return; }
      // A full reload initializes the finance context from the newly created server session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/');
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-[#090d16] text-white"><div className="w-full max-w-sm space-y-6"><Link href="/" className="text-emerald-400 text-sm font-bold">DompetKu</Link><div><h1 className="text-2xl font-black">Selamat datang</h1><p className="text-sm text-slate-400 mt-1">Masuk untuk melihat catatan keuangan Anda.</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm text-slate-300">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500" /></label><label className="block text-sm text-slate-300">Kata sandi<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500" /></label>{error && <p role="alert" className="text-sm text-rose-400">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-slate-950 disabled:opacity-60">{busy ? 'Memproses…' : 'Masuk'}</button></form><p className="text-center text-sm text-slate-400">Belum punya akun? <Link href="/register" className="font-semibold text-emerald-400">Daftar</Link></p></div></main>;
}
