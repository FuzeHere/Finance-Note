import { Account, Category, Transaction } from '../types';

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    name: 'Uang Tunai (Cash)',
    type: 'cash',
    initialBalance: 450000,
    color: '#10b981', // Emerald
    icon: 'Banknote',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-bca',
    name: 'BCA',
    type: 'bank',
    initialBalance: 3250000,
    color: '#2563eb', // Blue
    icon: 'Building2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-dana',
    name: 'DANA',
    type: 'ewallet',
    initialBalance: 350000,
    color: '#0284c7', // Sky
    icon: 'Smartphone',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-gopay',
    name: 'GoPay',
    type: 'ewallet',
    initialBalance: 185000,
    color: '#059669', // Teal
    icon: 'Wallet',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense
  { id: 'cat-makan', name: 'Makanan & Minuman', type: 'expense', icon: '🍔', color: '#f97316', isDefault: true },
  { id: 'cat-transport', name: 'Transportasi', type: 'expense', icon: '🛵', color: '#06b6d4', isDefault: true },
  { id: 'cat-belanja', name: 'Belanja & Groceries', type: 'expense', icon: '🛍️', color: '#ec4899', isDefault: true },
  { id: 'cat-tagihan', name: 'Tagihan & Utilitas', type: 'expense', icon: '⚡', color: '#eab308', isDefault: true },
  { id: 'cat-hiburan', name: 'Hiburan & Hobi', type: 'expense', icon: '🎮', color: '#8b5cf6', isDefault: true },
  { id: 'cat-kesehatan', name: 'Kesehatan & Obat', type: 'expense', icon: '💊', color: '#ef4444', isDefault: true },
  { id: 'cat-pendidikan', name: 'Edukasi & Buku', type: 'expense', icon: '📚', color: '#3b82f6', isDefault: true },
  { id: 'cat-lain-keluar', name: 'Pengeluaran Lain', type: 'expense', icon: '📦', color: '#64748b', isDefault: true },

  // Income
  { id: 'cat-gaji', name: 'Gaji Pokok', type: 'income', icon: '💼', color: '#10b981', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance & Side Job', type: 'income', icon: '💻', color: '#059669', isDefault: true },
  { id: 'cat-bonus', name: 'Bonus & THR', type: 'income', icon: '🎁', color: '#14b8a6', isDefault: true },
  { id: 'cat-investasi', name: 'Dividen & Investasi', type: 'income', icon: '📈', color: '#6366f1', isDefault: true },
  { id: 'cat-lain-masuk', name: 'Pemasukan Lain', type: 'income', icon: '💰', color: '#84cc16', isDefault: true },
];

/**
 * Data transaksi contoh agar aplikasi langsung terlihat hidup dan informatif saat pertama dibuka.
 */
export function generateSeedTransactions(): Transaction[] {
  const today = new Date();
  
  const formatDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'tx-seed-1',
      type: 'income',
      amount: 5500000,
      accountId: 'acc-bca',
      categoryId: 'cat-gaji',
      date: formatDate(5),
      note: 'Gaji Bulanan',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-seed-2',
      type: 'expense',
      amount: 35000,
      accountId: 'acc-cash',
      categoryId: 'cat-makan',
      date: formatDate(0), // Hari ini
      note: 'Makan Siang Nasi Padang',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-seed-3',
      type: 'expense',
      amount: 18000,
      accountId: 'acc-gopay',
      categoryId: 'cat-transport',
      date: formatDate(0),
      note: 'Gojek ke Kantor',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-seed-4',
      type: 'transfer',
      amount: 150000,
      accountId: 'acc-bca',
      toAccountId: 'acc-dana',
      date: formatDate(1),
      note: 'Top up DANA dari BCA',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-seed-5',
      type: 'expense',
      amount: 145000,
      accountId: 'acc-dana',
      categoryId: 'cat-belanja',
      date: formatDate(2),
      note: 'Belanja Mingguan Minimarket',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-seed-6',
      type: 'expense',
      amount: 350000,
      accountId: 'acc-bca',
      categoryId: 'cat-tagihan',
      date: formatDate(4),
      note: 'Tagihan Listrik & WiFi',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-seed-7',
      type: 'income',
      amount: 750000,
      accountId: 'acc-bca',
      categoryId: 'cat-freelance',
      date: formatDate(3),
      note: 'Project Desain UI',
      createdAt: new Date().toISOString(),
    },
  ];
}
