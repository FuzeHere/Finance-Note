'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Copy, Check, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { ReceiptReport } from '../../lib/types';
import { formatIDR, formatSignedIDR } from '../../lib/finance/currency';

interface ReceiptCardProps {
  report: ReceiptReport;
}

export function ReceiptCard({ report }: ReceiptCardProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Format teks untuk dibagikan via chat (WhatsApp/Telegram/dll)
  const generateShareText = () => {
    let text = `🧾 *${report.periodLabel}* (${report.dateRangeLabel})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🟢 Pemasukan: ${formatIDR(report.totalIncome)}\n`;
    text += `🔴 Pengeluaran: ${formatIDR(report.totalExpense)}\n`;
    text += `💰 Arus Kas Bersih: ${formatSignedIDR(report.netCashFlow, report.netCashFlow >= 0 ? 'income' : 'expense')}\n`;
    
    if (report.savingsRate !== null) {
      text += `📊 Rasio Tabungan: ${report.savingsRate}%\n`;
    }
    
    text += `\n*Pengeluaran Terbesar:*\n`;
    report.topCategories.forEach((cat, idx) => {
      text += `${idx + 1}. ${cat.categoryIcon} ${cat.categoryName}: ${formatIDR(cat.totalAmount)} (${cat.percentage}%)\n`;
    });

    if (report.insights.length > 0) {
      text += `\n💡 *Catatan:* ${report.insights[0]}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Dibuat otomatis oleh DompetKu_`;
    return text;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin teks ke clipboard');
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: '#090d16',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `struk-${report.type}-${report.startDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Gagal mengekspor gambar struk:', e);
      alert('Gagal membuat gambar struk. Anda dapat menggunakan tombol salin teks.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto my-4">
      {/* Container Struk Fisik Thermal */}
      <div
        ref={receiptRef}
        className="receipt-paper rounded-lg p-5 border border-stone-300 text-stone-900 transition-all font-sans relative overflow-hidden"
      >
        {/* Header Struk */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-900 text-white font-black text-xs mb-1">
            DK
          </div>
          <h2 className="text-xs font-black tracking-widest uppercase text-stone-800">
            DOMPETKU PERSONAL FINANCE
          </h2>
          <p className="text-[10px] text-stone-500 tracking-wider uppercase font-mono">
            {report.periodLabel}
          </p>
          <p className="text-xs font-bold text-stone-700 mt-0.5">
            {report.dateRangeLabel}
          </p>
        </div>

        <div className="receipt-dashed-divider" />

        {/* Ringkasan Arus Kas (Monospace Tabular) */}
        <div className="space-y-1.5 text-xs receipt-mono">
          <div className="flex justify-between items-center text-emerald-800">
            <span className="font-semibold">PEMASUKAN</span>
            <span className="font-bold">+{formatIDR(report.totalIncome, false)}</span>
          </div>
          <div className="flex justify-between items-center text-rose-800">
            <span className="font-semibold">PENGELUARAN</span>
            <span className="font-bold">-{formatIDR(report.totalExpense, false)}</span>
          </div>
          
          <div className="receipt-dotted-divider" />

          <div className="flex justify-between items-center pt-0.5 font-bold text-sm text-stone-900">
            <span>SISA KAS (NET)</span>
            <span className={report.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {formatSignedIDR(report.netCashFlow, report.netCashFlow >= 0 ? 'income' : 'expense')}
            </span>
          </div>

          {report.savingsRate !== null && (
            <div className="flex justify-between items-center text-[11px] text-stone-600 pt-1">
              <span>RASIO TABUNGAN</span>
              <span className="font-bold text-stone-800">{report.savingsRate}%</span>
            </div>
          )}
        </div>

        <div className="receipt-dashed-divider" />

        {/* Top Kategori Pengeluaran */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
            <span>Kategori Pengeluaran</span>
            <span>Jumlah ({report.transactionCount} Transaksi)</span>
          </div>

          {report.topCategories.length === 0 ? (
            <p className="text-xs text-stone-400 italic text-center py-2">
              Tidak ada pengeluaran pada periode ini.
            </p>
          ) : (
            <div className="space-y-2">
              {report.topCategories.map((cat) => (
                <div key={cat.categoryId} className="text-xs">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="flex items-center gap-1.5 font-medium text-stone-800 truncate">
                      <span>{cat.categoryIcon}</span>
                      <span className="truncate">{cat.categoryName}</span>
                    </span>
                    <span className="font-bold text-stone-900 receipt-mono shrink-0">
                      {formatIDR(cat.totalAmount)}
                    </span>
                  </div>
                  {/* Progress bar tipis */}
                  <div className="w-full bg-stone-200 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-stone-800 h-1 rounded-full"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pengeluaran Terbesar */}
        {report.largestExpense && (
          <>
            <div className="receipt-dotted-divider" />
            <div className="text-[11px] text-stone-600">
              <span className="font-semibold text-stone-800">Transaksi Terbesar: </span>
              <span>{report.largestExpense.title} ({formatIDR(report.largestExpense.amount)})</span>
            </div>
          </>
        )}

        {/* Perbandingan Periode */}
        {report.expenseComparison.status !== 'no_history' && report.expenseComparison.percentageChange !== null && (
          <>
            <div className="receipt-dotted-divider" />
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-600">vs Periode Sebelumnya:</span>
              <span className={`font-bold flex items-center gap-1 ${
                report.expenseComparison.status === 'decreased' ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {report.expenseComparison.status === 'decreased' ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {report.expenseComparison.status === 'decreased' ? 'Hemat' : 'Naik'} {report.expenseComparison.percentageChange}%
              </span>
            </div>
          </>
        )}

        <div className="receipt-dashed-divider" />

        {/* Factual Data Insights */}
        {report.insights.length > 0 && (
          <div className="bg-stone-100/80 p-2.5 rounded border border-stone-200/80 text-[11px] text-stone-700 mb-3 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{report.insights[0]}</p>
          </div>
        )}

        {/* Footer & Barcode Struk */}
        <div className="text-center pt-1">
          {/* Barcode CSS/SVG Estetik */}
          <div className="flex justify-center items-center gap-[2px] h-7 my-1 opacity-80">
            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1].map((w, i) => (
              <div
                key={i}
                className="bg-stone-900 h-full"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <p className="text-[9px] text-stone-400 font-mono tracking-widest">
            NO: {report.id.toUpperCase()}
          </p>
          <p className="text-[8px] text-stone-400 mt-0.5">
            Diterbitkan: {new Date(report.generatedAt).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Action Buttons: Bagikan & Simpan Gambar */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={handleCopyText}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Ringkasan</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownloadImage}
          disabled={isExporting}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isExporting ? 'Memproses...' : 'Simpan Gambar'}</span>
        </button>
      </div>
    </div>
  );
}
