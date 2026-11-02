import { NextResponse } from 'next/server';
import { scanReceipt } from '@/lib/server/receipt-ocr';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('image');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Pilih foto struk terlebih dahulu.' }, { status: 400 });
    if (file.size === 0 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Ukuran foto maksimal 10 MB.' }, { status: 413 });

    const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!supportedTypes.has(file.type)) return NextResponse.json({ error: 'Format foto harus JPG, PNG, atau WebP.' }, { status: 415 });

    const result = await scanReceipt(Buffer.from(await file.arrayBuffer()), file.type);
    if (!result.text.trim()) return NextResponse.json({ error: 'Teks struk belum terbaca. Coba foto yang lebih terang dan tidak buram.' }, { status: 422 });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Receipt OCR failed:', error);
    return NextResponse.json({ error: 'Layanan PaddleOCR belum siap. Coba lagi sebentar atau hubungi admin server.' }, { status: 503 });
  }
}
