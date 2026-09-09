import { describe, it, expect } from 'vitest';
import {
  formatLocalDate,
  getTodayDateString,
  getWeekRange,
  getMonthRange,
  getYearRange,
  formatDateIndo,
} from '../dates';

describe('Date Utilities — Timezone & Boundary Accuracy (TDD)', () => {
  it('formatLocalDate menghasilkan format YYYY-MM-DD sesuai tanggal kalender lokal', () => {
    // Tanggal spesifik dengan jam tengah malam 00:00:00
    const localDate = new Date(2026, 8, 6, 0, 0, 0); // 6 September 2026
    const formatted = formatLocalDate(localDate);
    expect(formatted).toBe('2026-09-06');
  });

  it('getTodayDateString selalu menghasilkan format YYYY-MM-DD lokal', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getMonthRange untuk September 2026 dimulai tepat 2026-09-01 dan berakhir 2026-09-30', () => {
    const refDate = new Date(2026, 8, 15, 14, 30, 0); // 15 September 2026
    const range = getMonthRange(refDate);

    // Kritis: startStr tidak boleh mundur ke 2026-08-31 karena UTC offset!
    expect(range.startStr).toBe('2026-09-01');
    expect(range.endStr).toBe('2026-09-30');
  });

  it('getMonthRange untuk Februari pada tahun kabisat (2024) dan non-kabisat (2026)', () => {
    const feb2024 = getMonthRange(new Date(2024, 1, 10)); // Feb 2024 (kabisat)
    expect(feb2024.startStr).toBe('2024-02-01');
    expect(feb2024.endStr).toBe('2024-02-29');

    const feb2026 = getMonthRange(new Date(2026, 1, 10)); // Feb 2026 (non-kabisat)
    expect(feb2026.startStr).toBe('2026-02-01');
    expect(feb2026.endStr).toBe('2026-02-28');
  });

  it('getWeekRange menghasilkan hari Senin sebagai awal dan Minggu sebagai akhir tanpa timezone drift', () => {
    // 6 September 2026 adalah hari Minggu
    const sunday = new Date(2026, 8, 6, 12, 0, 0);
    const range = getWeekRange(sunday);

    // Minggu tersebut: Senin 31 Agustus 2026 s.d. Minggu 6 September 2026
    expect(range.startStr).toBe('2026-08-31');
    expect(range.endStr).toBe('2026-09-06');
  });

  it('getYearRange mencakup 1 Januari s.d. 31 Desember tepat', () => {
    const refDate = new Date(2026, 5, 1);
    const range = getYearRange(refDate);

    expect(range.startStr).toBe('2026-01-01');
    expect(range.endStr).toBe('2026-12-31');
  });

  it('formatDateIndo memformat tanggal secara benar dengan atau tanpa nama hari', () => {
    expect(formatDateIndo('2026-09-06')).toContain('Sep');
    expect(formatDateIndo('2026-09-06', true)).toContain('Minggu');
  });
});
