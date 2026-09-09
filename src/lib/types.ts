export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'other';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isGuest?: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number; // Integer Rupiah
  currentBalance?: number; // Calculated on runtime
  color: string;
  icon?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Integer in Rupiah (selalu positif)
  accountId: string; // Akun sumber
  toAccountId?: string; // Akun tujuan (khusus tipe transfer)
  categoryId?: string; // ID kategori (untuk income/expense)
  date: string; // ISO format string: YYYY-MM-DD
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  percentage: number;
  count: number;
}

export interface PeriodComparison {
  currentAmount: number;
  previousAmount: number;
  differenceAmount: number;
  percentageChange: number | null; // null jika previousAmount 0
  status: 'increased' | 'decreased' | 'same' | 'no_history';
}

export interface ReceiptReport {
  id: string;
  type: 'weekly' | 'monthly' | 'yearly';
  periodLabel: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  
  // Deterministic aggregates
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number | null; // (Net Cash Flow / Income * 100)
  transactionCount: number;
  
  // Breakdown
  topCategories: CategoryTotal[];
  largestExpense?: {
    title: string;
    amount: number;
    date: string;
    categoryName: string;
  };
  
  // Comparisons
  expenseComparison: PeriodComparison;
  incomeComparison: PeriodComparison;
  
  // Honest data-driven insights
  insights: string[];
}
