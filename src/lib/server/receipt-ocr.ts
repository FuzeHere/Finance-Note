import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export interface ReceiptScanResult {
  date: string | null;
  items: Array<{ name: string; price: number }>;
  total: number | null;
  text: string;
}

function runTesseract(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(/* turbopackIgnore: true */ process.env.TESSERACT_CMD || 'tesseract', [imagePath, 'stdout', '-l', 'ind+eng', '--psm', '6'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let error = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { output += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { error += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(output) : reject(new Error(error || `Tesseract exited with code ${code}`)));
  });
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

export async function scanReceipt(image: Buffer, extension: string): Promise<ReceiptScanResult> {
  const directory = await mkdtemp(path.join(tmpdir(), 'finance-receipt-'));
  const imagePath = path.join(directory, `receipt.${extension}`);
  try {
    await writeFile(imagePath, image, { mode: 0o600 });
    return parseReceiptText(await runTesseract(imagePath));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
