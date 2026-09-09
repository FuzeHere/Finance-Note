import {
  Account,
  Category,
  CategoryTotal,
  PeriodComparison,
  Transaction,
} from '../types';

/**
 * Menghitung saldo terkini tiap akun dan total saldo agregat.
 * 
 * Aturan Akuntansi:
 * - Saldo Awal akun
 * + Transaksi Income ke akun tersebut
 * - Transaksi Expense dari akun tersebut
 * - Transaksi Transfer KELUAR (dari accountId akun tersebut)
 * + Transaksi Transfer MASUK (ke toAccountId akun tersebut)
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): {
  accountsWithBalance: Account[];
  totalBalance: number;
} {
  const balanceMap = new Map<string, number>();

  // Inisialisasi saldo awal
  for (const acc of accounts) {
    balanceMap.set(acc.id, acc.initialBalance || 0);
  }

  // Iterasi semua transaksi
  for (const tx of transactions) {
    const amount = Math.abs(tx.amount || 0);

    if (tx.type === 'income') {
      const current = balanceMap.get(tx.accountId) || 0;
      balanceMap.set(tx.accountId, current + amount);
    } else if (tx.type === 'expense') {
      const current = balanceMap.get(tx.accountId) || 0;
      balanceMap.set(tx.accountId, current - amount);
    } else if (tx.type === 'transfer') {
      // Akun sumber berkurang
      const srcBalance = balanceMap.get(tx.accountId) || 0;
      balanceMap.set(tx.accountId, srcBalance - amount);

      // Akun tujuan bertambah (jika ada toAccountId)
      if (tx.toAccountId) {
        const destBalance = balanceMap.get(tx.toAccountId) || 0;
        balanceMap.set(tx.toAccountId, destBalance + amount);
      }
    }
  }

  let totalBalance = 0;
  const accountsWithBalance = accounts.map((acc) => {
    const currentBalance = balanceMap.get(acc.id) ?? acc.initialBalance ?? 0;
    totalBalance += currentBalance;
    return {
      ...acc,
      currentBalance,
    };
  });

  return {
    accountsWithBalance,
    totalBalance,
  };
}

/**
 * Menghitung arus kas (Income, Expense, Net) dalam rentang tanggal tertentu.
 * PENTING: Transaksi tipe 'transfer' tidak mempengaruhi arus kas global pengguna.
 */
export function calculatePeriodCashFlow(
  transactions: Transaction[],
  startDateStr: string,
  endDateStr: string
): {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  periodTransactions: Transaction[];
} {
  let totalIncome = 0;
  let totalExpense = 0;
  const periodTransactions: Transaction[] = [];

  for (const tx of transactions) {
    if (tx.date >= startDateStr && tx.date <= endDateStr) {
      periodTransactions.push(tx);

      const amount = Math.abs(tx.amount || 0);
      if (tx.type === 'income') {
        totalIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpense += amount;
      }
      // Transfer diabaikan dalam agregasi cashflow global
    }
  }

  const netCashFlow = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netCashFlow,
    periodTransactions,
  };
}

/**
 * Menghitung rincian pengeluaran per kategori beserta persentasenya.
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income' = 'expense'
): CategoryTotal[] {
  const categoryMap = new Map<string, Category>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  const totals = new Map<string, { amount: number; count: number }>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type === type && tx.categoryId) {
      const amount = Math.abs(tx.amount || 0);
      grandTotal += amount;

      const current = totals.get(tx.categoryId) || { amount: 0, count: 0 };
      totals.set(tx.categoryId, {
        amount: current.amount + amount,
        count: current.count + 1,
      });
    }
  }

  const results: CategoryTotal[] = [];

  totals.forEach((data, categoryId) => {
    const category = categoryMap.get(categoryId);
    const percentage = grandTotal > 0 ? (data.amount / grandTotal) * 100 : 0;

    results.push({
      categoryId,
      categoryName: category?.name || 'Lainnya',
      categoryIcon: category?.icon || '📁',
      categoryColor: category?.color || '#94a3b8',
      totalAmount: data.amount,
      percentage: Math.round(percentage * 10) / 10,
      count: data.count,
    });
  });

  // Urutkan dari nominal terbesar ke terkecil
  return results.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Menghitung Rasio Tabungan (Savings Rate).
 * Rumus: (Net Cash Flow / Total Income) * 100
 * Jika Total Income <= 0, mengembalikan null.
 */
export function calculateSavingsRate(
  totalIncome: number,
  netCashFlow: number
): number | null {
  if (totalIncome <= 0) {
    return null;
  }
  const rate = (netCashFlow / totalIncome) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * Menghitung perbandingan antara periode sekarang dan periode sebelumnya secara jujur.
 */
export function calculatePeriodComparison(
  currentAmount: number,
  previousAmount: number
): PeriodComparison {
  const diff = currentAmount - previousAmount;

  if (previousAmount <= 0) {
    return {
      currentAmount,
      previousAmount,
      differenceAmount: diff,
      percentageChange: null,
      status: currentAmount === 0 ? 'same' : 'no_history',
    };
  }

  const percentage = (diff / previousAmount) * 100;
  const roundedPercentage = Math.round(Math.abs(percentage) * 10) / 10;

  return {
    currentAmount,
    previousAmount,
    differenceAmount: diff,
    percentageChange: roundedPercentage,
    status: diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'same',
  };
}
