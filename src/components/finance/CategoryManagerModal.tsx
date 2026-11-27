'use client';

import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../../lib/store/financeContext';
import { Category } from '../../lib/types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'income' | 'expense';
}

const PRESET_COLORS = [
  '#f97316',
  '#06b6d4',
  '#ec4899',
  '#eab308',
  '#8b5cf6',
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#14b8a6',
  '#64748b',
];

const PRESET_EMOJIS: Record<'expense' | 'income', string[]> = {
  expense: ['🍔', '🛵', '🛍️', '⚡', '🎮', '💊', '📚', '☕', '🏠', '🐾', '✈️', '📦'],
  income: ['💼', '💻', '🎁', '📈', '💰', '🏆', '🪙', '🧾'],
};

function CategoryManagerContent({
  onClose,
  initialType = 'expense',
}: {
  onClose: () => void;
  initialType?: 'income' | 'expense';
}) {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useFinance();

  const [activeType, setActiveType] = useState<'expense' | 'income'>(initialType);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(PRESET_EMOJIS[initialType][0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredCategories = categories.filter((c) => c.type === activeType);

  const resetForm = (nextType: 'expense' | 'income' = activeType) => {
    setEditingCategory(null);
    setName('');
    setIcon(PRESET_EMOJIS[nextType][0]);
    setColor(PRESET_COLORS[0]);
    setErrorMessage('');
  };

  const handleTabChange = (nextType: 'expense' | 'income') => {
    setActiveType(nextType);
    setConfirmDeleteId(null);
    resetForm(nextType);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setConfirmDeleteId(null);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Nama kategori tidak boleh kosong.');
      return;
    }

    const finalIcon = icon.trim() || PRESET_EMOJIS[activeType][0];

    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        name: trimmed,
        icon: finalIcon,
        color,
      });
    } else {
      addCategory({
        name: trimmed,
        type: activeType,
        icon: finalIcon,
        color,
      });
    }

    resetForm(activeType);
  };

  const handleDelete = (id: string) => {
    const res = deleteCategory(id);
    setConfirmDeleteId(null);
    if (!res.success) {
      setErrorMessage(res.message || 'Gagal menghapus kategori.');
      return;
    }
    if (editingCategory?.id === id) {
      resetForm(activeType);
    }
  };

  return (
    <div
      className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200"
      role="dialog"
      aria-label="Kelola Kategori"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">Kelola Kategori</h2>
          <p className="text-[11px] text-slate-400">Tambah, ubah, atau hapus kategori transaksi</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Pengeluaran / Pemasukan */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800/80 rounded-xl my-3 border border-slate-700/50 shrink-0">
        <button
          type="button"
          onClick={() => handleTabChange('expense')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeType === 'expense'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('income')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeType === 'income'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pemasukan
        </button>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Tambah / Ubah */}
      <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 space-y-3 mb-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            {editingCategory ? `Ubah: ${editingCategory.name}` : 'Tambah Kategori Baru'}
          </span>
          {editingCategory && (
            <button
              type="button"
              onClick={() => resetForm(activeType)}
              className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
            >
              Batal ubah
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            maxLength={4}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            aria-label="Ikon Emoji"
            className="w-12 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Nama kategori (mis: Kopi & Snack)"
            maxLength={32}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            {editingCategory ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
            <span>{editingCategory ? 'Simpan' : 'Tambah'}</span>
          </button>
        </div>

        {/* Pilihan Emoji Cepat */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {PRESET_EMOJIS[activeType].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 transition-colors cursor-pointer ${
                icon === emoji ? 'bg-emerald-500/20 ring-1 ring-emerald-500' : 'bg-slate-900/70 hover:bg-slate-800'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Pilihan Warna */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1">Warna:</span>
          {PRESET_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => setColor(swatch)}
              className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                color === swatch ? 'scale-125 ring-2 ring-white' : 'opacity-75 hover:opacity-100'
              }`}
              style={{ backgroundColor: swatch }}
              aria-label={`Pilih warna ${swatch}`}
            />
          ))}
        </div>
      </form>

      {/* Daftar Kategori */}
      <div className="overflow-y-auto no-scrollbar space-y-2 pr-0.5 flex-1">
        {filteredCategories.map((cat) => {
          const usageCount = transactions.filter((t) => t.categoryId === cat.id).length;
          const canDelete = filteredCategories.length > 1;
          const isConfirmingDelete = confirmDeleteId === cat.id;

          return (
            <div
              key={cat.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                editingCategory?.id === cat.id
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border border-white/10"
                  style={{ backgroundColor: `${cat.color}22` }}
                >
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <p className="text-xs font-bold text-white truncate">{cat.name}</p>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {usageCount > 0 ? `Dipakai di ${usageCount} transaksi` : 'Belum ada transaksi'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 pl-2">
                {isConfirmingDelete ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                      aria-label={`Ubah kategori ${cat.name}`}
                      title="Ubah"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(cat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                        aria-label={`Hapus kategori ${cat.name}`}
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryManagerModal({ isOpen, onClose, initialType = 'expense' }: CategoryManagerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <CategoryManagerContent key={initialType} onClose={onClose} initialType={initialType} />
    </div>
  );
}
