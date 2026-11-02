export interface ReceiptScanResult {
  date: string | null;
  items: Array<{ name: string; price: number }>;
  total: number | null;
  text: string;
}

function parseRupiah(value: string): number | null {
  const digits = value.replace(/[^\d]/g, '');
  const amount = Number(digits);
  return digits && Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function parseDate(text: string): string | null {
  const patterns = [
    /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/,
    /\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    let year: number, month: number, day: number;
    if (match[1].length === 4) {
      year = Number(match[1]); month = Number(match[2]); day = Number(match[3]);
    } else {
      day = Number(match[1]); month = Number(match[2]); year = Number(match[3]);
      if (year < 100) year += year < 70 ? 2000 : 1900;
    }
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

export function parseReceiptText(text: string): ReceiptScanResult {
  let total: number | null = null;
  const items: ReceiptScanResult['items'] = [];
  const ignored = /\b(total|subtotal|sub total|grand total|tunai|cash|kembali|change|pajak|tax|ppn|diskon|discount|debit|kredit|visa|mastercard)\b/i;
  const money = /(?:rp\.?\s*)?\b\d[\d.,]{0,14}\b/gi;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/\s{2,}/g, ' ');
    if (!line) continue;
    const amounts = [...line.matchAll(money)].map((match) => ({ text: match[0], index: match.index ?? 0 }));
    if (!amounts.length) continue;
    const label = line.replace(money, ' ').replace(/[|:*#]/g, ' ').trim();
    const isTotal = /\b(grand\s*total|total\s*(?:belanja|tagihan)?|amount\s*due|jumlah\s*bayar)\b/i.test(line);
    const amount = parseRupiah(amounts[amounts.length - 1].text);
    if (!amount) continue;
    if (isTotal) { total = amount; continue; }
    if (ignored.test(line) || label.length < 2 || /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/.test(line)) continue;
    const cleanName = label.replace(/\b\d+(?:[.,]\d+)?\s*(?:x|@)\s*/gi, '').replace(/\s+/g, ' ').trim();
    if (cleanName && /[a-zA-Z\u00c0-\u024f]/.test(cleanName)) items.push({ name: cleanName.slice(0, 100), price: amount });
  }
  return { date: parseDate(text), items: items.slice(0, 50), total, text: text.slice(0, 12000) };
}

export async function scanReceipt(image: Buffer, contentType: string): Promise<ReceiptScanResult> {
  const endpoint = process.env.PADDLE_OCR_URL || 'http://127.0.0.1:3101/scan';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: new Uint8Array(image),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) throw new Error(`PaddleOCR service returned ${response.status}`);
  const result = await response.json() as { text?: string };
  return parseReceiptText(typeof result.text === 'string' ? result.text : '');
}
