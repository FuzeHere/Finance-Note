'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const result = await response.json();
      if (!response.ok) { setError(result.message || 'Pendaftaran gagal.'); return; }
      // A full reload initializes the finance context from the newly created server session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/');
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-[#090d16] text-white"><div className="w-full max-w-sm space-y-6"><Link href="/" className="text-emerald-400 text-sm font-bold">DompetKu</Link><div><h1 className="text-2xl font-black">Buat akun</h1><p className="text-sm text-slate-400 mt-1">Daftar dengan email dan kata sandi.</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm text-slate-300">Nama<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500" /></label><label className="block text-sm text-slate-300">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500" /></label><label className="block text-sm text-slate-300">Kata sandi<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500" /><span className="mt-1 block text-xs text-slate-500">Minimal 8 karakter.</span></label>{error && <p role="alert" className="text-sm text-rose-400">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-slate-950 disabled:opacity-60">{busy ? 'Membuat akun…' : 'Daftar'}</button></form><p className="text-center text-sm text-slate-400">Sudah punya akun? <Link href="/login" className="font-semibold text-emerald-400">Masuk</Link></p></div></main>;
}
