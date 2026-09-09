/**
 * Utilitas penanggalan untuk transaksi & laporan finansial.
 * Menggunakan format kalender lokal murni (bebas dari distorsi zona waktu UTC).
 */

/**
 * Format objek Date ke string YYYY-MM-DD menggunakan tanggal kalender lokal.
 * Mencegah bug toISOString() yang menggeser tanggal mundur akibat offset UTC.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function formatDateIndo(dateStr: string, includeDayName: boolean = false): string {
  if (!dateStr) return '';
  // Pastikan parsing sebagai tanggal lokal bukan UTC
  const parts = dateStr.split('-');
  let date: Date;
  if (parts.length === 3) {
    date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    date = new Date(dateStr);
  }
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  if (includeDayName) {
    options.weekday = 'long';
  }

  return new Intl.DateTimeFormat('id-ID', options).format(date);
}

export function formatMonthYearIndo(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Menghasilkan rentang awal dan akhir minggu (Senin sampai Minggu).
 */
export function getWeekRange(refDate: Date): { start: Date; end: Date; startStr: string; endStr: string; label: string } {
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const day = d.getDay();
  // Di JavaScript 0 = Minggu. Senin adalah awal minggu (day 1).
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const start = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);

  const startStr = formatLocalDate(start);
  const endStr = formatLocalDate(end);
  
  const startLabel = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(start);
  const endLabel = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(end);

  return {
    start,
    end,
    startStr,
    endStr,
    label: `${startLabel} - ${endLabel}`,
  };
}

/**
 * Menghasilkan rentang awal dan akhir bulan.
 */
export function getMonthRange(refDate: Date): { start: Date; end: Date; startStr: string; endStr: string; label: string } {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const startStr = formatLocalDate(start);
  const endStr = formatLocalDate(end);
  const label = formatMonthYearIndo(start);

  return {
    start,
    end,
    startStr,
    endStr,
    label,
  };
}

/**
 * Menghasilkan rentang awal dan akhir tahun.
 */
export function getYearRange(refDate: Date): { start: Date; end: Date; startStr: string; endStr: string; label: string } {
  const year = refDate.getFullYear();

  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const startStr = formatLocalDate(start);
  const endStr = formatLocalDate(end);
  const label = `Tahun ${year}`;

  return {
    start,
    end,
    startStr,
    endStr,
    label,
  };
}
