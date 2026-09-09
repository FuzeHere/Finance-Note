import { describe, it, expect } from 'vitest';
import {
  calculateAccountBalances,
  calculatePeriodCashFlow,
  calculateCategoryBreakdown,
  calculateSavingsRate,
  calculatePeriodComparison,
} from '../calculations';
import { generateMonthlyReceipt } from '../reports';
import { parseIDRInput, MAX_SAFE_AMOUNT } from '../currency';
import { Account, Category, Transaction } from '../../types';

describe('Financial Calculations Core Rules', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-cash',
      name: 'Cash',
      type: 'cash',
      initialBalance: 500000,
      color: '#10b981',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'acc-bca',
      name: 'BCA',
      type: 'bank',
      initialBalance: 2000000,
      color: '#3b82f6',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'acc-dana',
      name: 'DANA',
      type: 'ewallet',
      initialBalance: 250000,
      color: '#06b6d4',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const mockCategories: Category[] = [
    { id: 'cat-makan', name: 'Makanan', type: 'expense', icon: '🍔', color: '#f97316' },
    { id: 'cat-transport', name: 'Transportasi', type: 'expense', icon: '🛵', color: '#06b6d4' },
    { id: 'cat-gaji', name: 'Gaji', type: 'income', icon: '💼', color: '#10b981' },
  ];

  it('1. Saldo akun terhitung akurat dengan transaksi Expense dan Income', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'expense',
        amount: 50000,
        accountId: 'acc-cash',
        categoryId: 'cat-makan',
        date: '2026-09-02',
        createdAt: '2026-09-02T10:00:00.000Z',
      },
      {
        id: 'tx-2',
        type: 'income',
        amount: 1000000,
        accountId: 'acc-bca',
        categoryId: 'cat-gaji',
        date: '2026-09-03',
        createdAt: '2026-09-03T10:00:00.000Z',
      },
    ];

    const result = calculateAccountBalances(mockAccounts, transactions);

    const cash = result.accountsWithBalance.find((a) => a.id === 'acc-cash');
    expect(cash?.currentBalance).toBe(450000);

    const bca = result.accountsWithBalance.find((a) => a.id === 'acc-bca');
    expect(bca?.currentBalance).toBe(3000000);

    const dana = result.accountsWithBalance.find((a) => a.id === 'acc-dana');
    expect(dana?.currentBalance).toBe(250000);

    expect(result.totalBalance).toBe(3700000);
  });

  it('2. ATURAN KRUSIAL: Transfer antar akun tidak merubah total saldo & tidak dihitung sebagai pengeluaran/pemasukan', () => {
    const initialTotal = mockAccounts.reduce((acc, a) => acc + a.initialBalance, 0); // 2.750.000

    const transferTx: Transaction = {
      id: 'tx-transfer-1',
      type: 'transfer',
      amount: 200000,
      accountId: 'acc-bca',
      toAccountId: 'acc-dana',
      date: '2026-09-04',
      createdAt: '2026-09-04T12:00:00.000Z',
    };

    const balanceResult = calculateAccountBalances(mockAccounts, [transferTx]);
    const bca = balanceResult.accountsWithBalance.find((a) => a.id === 'acc-bca');
    const dana = balanceResult.accountsWithBalance.find((a) => a.id === 'acc-dana');

    expect(bca?.currentBalance).toBe(1800000);
    expect(dana?.currentBalance).toBe(450000);
    expect(balanceResult.totalBalance).toBe(initialTotal);

    const cashFlow = calculatePeriodCashFlow([transferTx], '2026-09-01', '2026-09-30');
    expect(cashFlow.totalIncome).toBe(0);
    expect(cashFlow.totalExpense).toBe(0);
    expect(cashFlow.netCashFlow).toBe(0);
  });

  it('3. Perhitungan breakdown kategori dan persentase belanja', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'expense',
        amount: 150000,
        accountId: 'acc-cash',
        categoryId: 'cat-makan',
        date: '2026-09-05',
        createdAt: '2026-09-05T00:00:00.000Z',
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 50000,
        accountId: 'acc-cash',
        categoryId: 'cat-transport',
        date: '2026-09-05',
        createdAt: '2026-09-05T00:00:00.000Z',
      },
    ];

    const breakdown = calculateCategoryBreakdown(transactions, mockCategories, 'expense');
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].categoryName).toBe('Makanan');
    expect(breakdown[0].totalAmount).toBe(150000);
    expect(breakdown[0].percentage).toBe(75);

    expect(breakdown[1].categoryName).toBe('Transportasi');
    expect(breakdown[1].totalAmount).toBe(50000);
    expect(breakdown[1].percentage).toBe(25);
  });

  it('4. Integritas Kategori Terhapus: Tidak crash jika kategori tidak lagi terdaftar', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-old-cat',
        type: 'expense',
        amount: 80000,
        accountId: 'acc-cash',
        categoryId: 'cat-sudah-dihapus',
        date: '2026-09-05',
        createdAt: '2026-09-05T00:00:00.000Z',
      },
    ];

    const breakdown = calculateCategoryBreakdown(transactions, mockCategories, 'expense');
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].categoryName).toBe('Lainnya');
    expect(breakdown[0].totalAmount).toBe(80000);
    expect(breakdown[0].percentage).toBe(100);
  });

  it('5. Perhitungan Savings Rate menangani pembagian dengan aman', () => {
    expect(calculateSavingsRate(1000000, 400000)).toBe(40);
    expect(calculateSavingsRate(0, -50000)).toBeNull();
  });

  it('6. Perbandingan periode jujur dan tidak menghasilkan infinite percentage', () => {
    const comparisonNoHistory = calculatePeriodComparison(100000, 0);
    expect(comparisonNoHistory.status).toBe('no_history');
    expect(comparisonNoHistory.percentageChange).toBeNull();

    const comparisonUp = calculatePeriodComparison(150000, 100000);
    expect(comparisonUp.status).toBe('increased');
    expect(comparisonUp.percentageChange).toBe(50);

    const comparisonDown = calculatePeriodComparison(150000, 200000);
    expect(comparisonDown.status).toBe('decreased');
    expect(comparisonDown.percentageChange).toBe(25);
  });

  it('7. Edit Transaksi mengubah saldo akun secara presisi', () => {
    // Awal: Kas 500.000
    // Tx 1: Expense 100.000 -> Sisa 400.000
    let txList: Transaction[] = [
      {
        id: 'tx-edit-1',
        type: 'expense',
        amount: 100000,
        accountId: 'acc-cash',
        categoryId: 'cat-makan',
        date: '2026-09-02',
        createdAt: '2026-09-02T10:00:00.000Z',
      },
    ];

    let bal = calculateAccountBalances(mockAccounts, txList);
    expect(bal.accountsWithBalance.find((a) => a.id === 'acc-cash')?.currentBalance).toBe(400000);

    // Edit: Ubah amount dari 100.000 menjadi 70.000
    txList = txList.map((t) => (t.id === 'tx-edit-1' ? { ...t, amount: 70000 } : t));
    bal = calculateAccountBalances(mockAccounts, txList);
    expect(bal.accountsWithBalance.find((a) => a.id === 'acc-cash')?.currentBalance).toBe(430000);

    // Edit lagi: Ubah tipe menjadi Income 200.000
    txList = txList.map((t) => (t.id === 'tx-edit-1' ? { ...t, type: 'income', amount: 200000 } : t));
    bal = calculateAccountBalances(mockAccounts, txList);
    expect(bal.accountsWithBalance.find((a) => a.id === 'acc-cash')?.currentBalance).toBe(700000);
  });

  it('8. Sanitasi input nominal dengan batas maksimal MAX_SAFE_AMOUNT', () => {
    expect(parseIDRInput('Rp 25.000')).toBe(25000);
    expect(parseIDRInput('500000')).toBe(500000);
    expect(parseIDRInput('0')).toBe(0);
    // Angka ekstrem melebihi 999 milyar dipotong ke MAX_SAFE_AMOUNT
    expect(parseIDRInput('99999999999999999999')).toBe(MAX_SAFE_AMOUNT);
  });

  it('9. Laporan Struk Bulanan menghasilkan data deterministik dan insight jujur', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'income',
        amount: 5000000,
        accountId: 'acc-bca',
        categoryId: 'cat-gaji',
        date: '2026-09-01',
        createdAt: '2026-09-01T08:00:00.000Z',
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 1200000,
        accountId: 'acc-bca',
        categoryId: 'cat-makan',
        note: 'Belanja Bulanan',
        date: '2026-09-02',
        createdAt: '2026-09-02T10:00:00.000Z',
      },
    ];

    const report = generateMonthlyReceipt(transactions, mockCategories, new Date('2026-09-05'));

    expect(report.type).toBe('monthly');
    expect(report.totalIncome).toBe(5000000);
    expect(report.totalExpense).toBe(1200000);
    expect(report.netCashFlow).toBe(3800000);
    expect(report.savingsRate).toBe(76);
    expect(report.transactionCount).toBe(2);
    expect(report.largestExpense?.amount).toBe(1200000);
    expect(report.insights.length).toBeGreaterThan(0);
  });
});
