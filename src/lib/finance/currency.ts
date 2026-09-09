/**
 * Utilitas pemformatan mata uang Rupiah (IDR).
 * Sesuai brief.md, nilai uang selalu disimpan sebagai bilangan bulat (integer Rupiah).
 */

// Batas aman maksimal nilai transaksi (Rp 999 Miliar) untuk mencegah integer overflow
export const MAX_SAFE_AMOUNT = 999_999_999_999;

export function formatIDR(amount: number, showPrefix: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showPrefix ? 'Rp 0' : '0';
  }

  const absoluteValue = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absoluteValue);

  if (!showPrefix) {
    return formatted;
  }

  const prefix = amount < 0 ? '-Rp ' : 'Rp ';
  return `${prefix}${formatted}`;
}

export function formatSignedIDR(amount: number, type: 'income' | 'expense' | 'transfer'): string {
  const formatted = formatIDR(Math.abs(amount), true);
  if (type === 'income') {
    return `+${formatted}`;
  }
  if (type === 'expense') {
    return `-${formatted}`;
  }
  return formatted;
}

export function formatCompactIDR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`;
  }
  return formatIDR(amount);
}

export function parseIDRInput(rawInput: string): number {
  if (!rawInput) return 0;
  // Hapus semua karakter non-digit
  const cleanStr = rawInput.replace(/[^\d]/g, '');
  if (!cleanStr) return 0;
  
  const parsed = parseInt(cleanStr, 10);
  if (isNaN(parsed)) return 0;
  if (parsed > MAX_SAFE_AMOUNT) return MAX_SAFE_AMOUNT;
  return parsed;
}
