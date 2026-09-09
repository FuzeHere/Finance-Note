import {
  Category,
  ReceiptReport,
  Transaction,
} from '../types';
import {
  calculateCategoryBreakdown,
  calculatePeriodCashFlow,
  calculatePeriodComparison,
  calculateSavingsRate,
} from './calculations';
import { formatIDR } from './currency';
import {
  formatDateIndo,
  getMonthRange,
  getWeekRange,
  getYearRange,
} from './dates';

/**
 * Generator Struk Keuangan Mingguan (Weekly Receipt)
 */
export function generateWeeklyReceipt(
  transactions: Transaction[],
  categories: Category[],
  refDate: Date = new Date()
): ReceiptReport {
  const currentWeek = getWeekRange(refDate);

  // Cari tanggal 7 hari sebelumnya untuk minggu lalu
  const prevDate = new Date(currentWeek.start);
  prevDate.setDate(prevDate.getDate() - 7);
  const prevWeek = getWeekRange(prevDate);

  // Hitung arus kas
  const currentFlow = calculatePeriodCashFlow(
    transactions,
    currentWeek.startStr,
    currentWeek.endStr
  );
  const prevFlow = calculatePeriodCashFlow(
    transactions,
    prevWeek.startStr,
    prevWeek.endStr
  );

  // Breakdown kategori pengeluaran
  const topCategories = calculateCategoryBreakdown(
    currentFlow.periodTransactions,
    categories,
    'expense'
  );

  // Cari transaksi pengeluaran terbesar
  let largestExpense: ReceiptReport['largestExpense'] = undefined;
  const expenseTxs = currentFlow.periodTransactions.filter(
    (tx) => tx.type === 'expense'
  );
  if (expenseTxs.length > 0) {
    const sorted = [...expenseTxs].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const cat = categories.find((c) => c.id === top.categoryId);
    largestExpense = {
      title: top.note || cat?.name || 'Pengeluaran',
      amount: top.amount,
      date: formatDateIndo(top.date),
      categoryName: cat?.name || 'Lainnya',
    };
  }

  // Perbandingan dengan minggu lalu
  const expenseComparison = calculatePeriodComparison(
    currentFlow.totalExpense,
    prevFlow.totalExpense
  );
  const incomeComparison = calculatePeriodComparison(
    currentFlow.totalIncome,
    prevFlow.totalIncome
  );

  // Savings rate
  const savingsRate = calculateSavingsRate(
    currentFlow.totalIncome,
    currentFlow.netCashFlow
  );

  // Insights berbasis fakta aktual
  const insights: string[] = [];

  if (currentFlow.periodTransactions.length === 0) {
    insights.push('Belum ada transaksi tercatat pada minggu ini.');
  } else {
    if (expenseComparison.status === 'increased' && expenseComparison.percentageChange !== null) {
      insights.push(
        `Pengeluaran minggu ini naik ${expenseComparison.percentageChange}% (${formatIDR(expenseComparison.differenceAmount)}) dibanding minggu lalu.`
      );
    } else if (expenseComparison.status === 'decreased' && expenseComparison.percentageChange !== null) {
      insights.push(
        `Hebat! Pengeluaran minggu ini lebih hemat ${expenseComparison.percentageChange}% dibanding minggu lalu.`
      );
    } else if (expenseComparison.status === 'no_history') {
      insights.push('Belum ada data pembanding dari minggu sebelumnya.');
    }

    if (topCategories.length > 0) {
      insights.push(
        `Porsi terbesar dialokasikan untuk ${topCategories[0].categoryName} (${topCategories[0].percentage}% dari total pengeluaran).`
      );
    }
  }

  return {
    id: `weekly-${currentWeek.startStr}`,
    type: 'weekly',
    periodLabel: 'STRUK MINGGUAN',
    dateRangeLabel: currentWeek.label,
    startDate: currentWeek.startStr,
    endDate: currentWeek.endStr,
    generatedAt: new Date().toISOString(),
    totalIncome: currentFlow.totalIncome,
    totalExpense: currentFlow.totalExpense,
    netCashFlow: currentFlow.netCashFlow,
    savingsRate,
    transactionCount: currentFlow.periodTransactions.length,
    topCategories: topCategories.slice(0, 5),
    largestExpense,
    expenseComparison,
    incomeComparison,
    insights,
  };
}

/**
 * Generator Struk Keuangan Bulanan (Monthly Receipt)
 */
export function generateMonthlyReceipt(
  transactions: Transaction[],
  categories: Category[],
  refDate: Date = new Date()
): ReceiptReport {
  const currentMonth = getMonthRange(refDate);

  // Cari bulan sebelumnya
  const prevDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const prevMonth = getMonthRange(prevDate);

  // Arus kas
  const currentFlow = calculatePeriodCashFlow(
    transactions,
    currentMonth.startStr,
    currentMonth.endStr
  );
  const prevFlow = calculatePeriodCashFlow(
    transactions,
    prevMonth.startStr,
    prevMonth.endStr
  );

  // Breakdown kategori
  const topCategories = calculateCategoryBreakdown(
    currentFlow.periodTransactions,
    categories,
    'expense'
  );

  // Transaksi terbesar
  let largestExpense: ReceiptReport['largestExpense'] = undefined;
  const expenseTxs = currentFlow.periodTransactions.filter(
    (tx) => tx.type === 'expense'
  );
  if (expenseTxs.length > 0) {
    const sorted = [...expenseTxs].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const cat = categories.find((c) => c.id === top.categoryId);
    largestExpense = {
      title: top.note || cat?.name || 'Pengeluaran',
      amount: top.amount,
      date: formatDateIndo(top.date),
      categoryName: cat?.name || 'Lainnya',
    };
  }

  // Perbandingan
  const expenseComparison = calculatePeriodComparison(
    currentFlow.totalExpense,
    prevFlow.totalExpense
  );
  const incomeComparison = calculatePeriodComparison(
    currentFlow.totalIncome,
    prevFlow.totalIncome
  );

  const savingsRate = calculateSavingsRate(
    currentFlow.totalIncome,
    currentFlow.netCashFlow
  );

  // Insights
  const insights: string[] = [];

  if (currentFlow.periodTransactions.length === 0) {
    insights.push('Belum ada transaksi tercatat pada bulan ini.');
  } else {
    if (savingsRate !== null) {
      if (savingsRate > 20) {
        insights.push(`Tingkat tabungan bulan ini sangat sehat mencapai ${savingsRate}%.`);
      } else if (savingsRate > 0) {
        insights.push(`Tingkat tabungan Anda bulan ini adalah ${savingsRate}%.`);
      } else {
        insights.push('Arus kas bulan ini defisit (pengeluaran melebihi pemasukan).');
      }
    }

    if (expenseComparison.status === 'decreased' && expenseComparison.percentageChange !== null) {
      insights.push(
        `Pengeluaran bulan ini berkurang ${expenseComparison.percentageChange}% dibanding ${prevMonth.label}.`
      );
    } else if (expenseComparison.status === 'increased' && expenseComparison.percentageChange !== null) {
      insights.push(
        `Pengeluaran bertambah ${expenseComparison.percentageChange}% dibanding ${prevMonth.label}.`
      );
    }

    if (topCategories.length > 0) {
      insights.push(
        `Kategori pengeluaran nomor satu: ${topCategories[0].categoryName} (${formatIDR(topCategories[0].totalAmount)}).`
      );
    }
  }

  return {
    id: `monthly-${currentMonth.startStr.substring(0, 7)}`,
    type: 'monthly',
    periodLabel: 'STRUK BULANAN',
    dateRangeLabel: currentMonth.label,
    startDate: currentMonth.startStr,
    endDate: currentMonth.endStr,
    generatedAt: new Date().toISOString(),
    totalIncome: currentFlow.totalIncome,
    totalExpense: currentFlow.totalExpense,
    netCashFlow: currentFlow.netCashFlow,
    savingsRate,
    transactionCount: currentFlow.periodTransactions.length,
    topCategories: topCategories.slice(0, 5),
    largestExpense,
    expenseComparison,
    incomeComparison,
    insights,
  };
}

/**
 * Generator Struk Keuangan Tahunan (Yearly Receipt)
 */
export function generateYearlyReceipt(
  transactions: Transaction[],
  categories: Category[],
  refDate: Date = new Date()
): ReceiptReport {
  const currentYear = getYearRange(refDate);

  const prevDate = new Date(refDate.getFullYear() - 1, 0, 1);
  const prevYear = getYearRange(prevDate);

  const currentFlow = calculatePeriodCashFlow(
    transactions,
    currentYear.startStr,
    currentYear.endStr
  );
  const prevFlow = calculatePeriodCashFlow(
    transactions,
    prevYear.startStr,
    prevYear.endStr
  );

  const topCategories = calculateCategoryBreakdown(
    currentFlow.periodTransactions,
    categories,
    'expense'
  );

  let largestExpense: ReceiptReport['largestExpense'] = undefined;
  const expenseTxs = currentFlow.periodTransactions.filter(
    (tx) => tx.type === 'expense'
  );
  if (expenseTxs.length > 0) {
    const sorted = [...expenseTxs].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const cat = categories.find((c) => c.id === top.categoryId);
    largestExpense = {
      title: top.note || cat?.name || 'Pengeluaran Terbesar',
      amount: top.amount,
      date: formatDateIndo(top.date),
      categoryName: cat?.name || 'Lainnya',
    };
  }

  const expenseComparison = calculatePeriodComparison(
    currentFlow.totalExpense,
    prevFlow.totalExpense
  );
  const incomeComparison = calculatePeriodComparison(
    currentFlow.totalIncome,
    prevFlow.totalIncome
  );

  const savingsRate = calculateSavingsRate(
    currentFlow.totalIncome,
    currentFlow.netCashFlow
  );

  // Analisis bulan terbaik (best month) & bulan pengeluaran tertinggi (highest spending month)
  const monthlyStats: { [monthKey: number]: { income: number; expense: number; net: number } } = {};
  for (let m = 0; m < 12; m++) {
    monthlyStats[m] = { income: 0, expense: 0, net: 0 };
  }

  for (const tx of currentFlow.periodTransactions) {
    const txDate = new Date(tx.date);
    const month = txDate.getMonth();
    const amt = Math.abs(tx.amount || 0);
    if (tx.type === 'income') {
      monthlyStats[month].income += amt;
      monthlyStats[month].net += amt;
    } else if (tx.type === 'expense') {
      monthlyStats[month].expense += amt;
      monthlyStats[month].net -= amt;
    }
  }

  let bestMonthIndex = 0;
  let highestExpenseMonthIndex = 0;
  let maxNet = -Infinity;
  let maxExpense = -1;

  for (let m = 0; m < 12; m++) {
    if (monthlyStats[m].net > maxNet && (monthlyStats[m].income > 0 || monthlyStats[m].expense > 0)) {
      maxNet = monthlyStats[m].net;
      bestMonthIndex = m;
    }
    if (monthlyStats[m].expense > maxExpense) {
      maxExpense = monthlyStats[m].expense;
      highestExpenseMonthIndex = m;
    }
  }

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const insights: string[] = [];
  if (currentFlow.periodTransactions.length === 0) {
    insights.push('Belum ada transaksi di tahun ini.');
  } else {
    const avgMonthlyExpense = Math.round(currentFlow.totalExpense / 12);
    insights.push(`Rata-rata pengeluaran per bulan: ${formatIDR(avgMonthlyExpense)}.`);
    if (maxExpense > 0) {
      insights.push(`Bulan dengan pengeluaran tertinggi: ${monthNames[highestExpenseMonthIndex]} (${formatIDR(maxExpense)}).`);
    }
    if (maxNet > 0) {
      insights.push(`Bulan paling hemat: ${monthNames[bestMonthIndex]} (sisa kas ${formatIDR(maxNet)}).`);
    }
  }

  return {
    id: `yearly-${currentYear.startStr.substring(0, 4)}`,
    type: 'yearly',
    periodLabel: 'STRUK TAHUNAN',
    dateRangeLabel: currentYear.label,
    startDate: currentYear.startStr,
    endDate: currentYear.endStr,
    generatedAt: new Date().toISOString(),
    totalIncome: currentFlow.totalIncome,
    totalExpense: currentFlow.totalExpense,
    netCashFlow: currentFlow.netCashFlow,
    savingsRate,
    transactionCount: currentFlow.periodTransactions.length,
    topCategories: topCategories.slice(0, 5),
    largestExpense,
    expenseComparison,
    incomeComparison,
    insights,
  };
}
