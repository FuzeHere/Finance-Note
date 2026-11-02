import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getUserFinanceData, saveUserFinanceData } from '@/lib/server/db';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Silakan login terlebih dahulu untuk mengakses data cloud.' },
      { status: 401 }
    );
  }

  const cloudData = getUserFinanceData(user.id);

  if (!cloudData) {
    return NextResponse.json({
      hasData: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  }

  return NextResponse.json({
    hasData: true,
    data: cloudData,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Silakan login terlebih dahulu untuk menyimpan ke cloud.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { accounts, categories, transactions } = body;

    if (!Array.isArray(accounts) || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Format data keuangan tidak valid.' },
        { status: 400 }
      );
    }

    const result = saveUserFinanceData(user.id, {
      accounts,
      categories: Array.isArray(categories) ? categories : [],
      transactions,
    });

    return NextResponse.json({
      success: true,
      updatedAt: result.updatedAt,
      message: 'Data berhasil disimpan ke cloud',
    });
  } catch (err) {
    console.error('Error saving finance cloud data:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Terjadi kesalahan saat menyimpan data ke cloud.' },
      { status: 500 }
    );
  }
}
