import { describe, it, expect } from 'vitest';
import { upsertUser, createLocalUser, getLocalUserByEmail, upgradeUserToLocal, createSession, getUserBySession, deleteSession, saveUserFinanceData, getUserFinanceData } from '../db';

describe('Server SQLite Cloud Persistence', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testName = 'Budi Santoso';

  it('berhasil melakukan upsert user dan membuat session', () => {
    const user = upsertUser({
      email: testEmail,
      name: testName,
      provider: 'local',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.name).toBe(testName);

    const token = createSession(user.id);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token).toMatch(/^[a-zA-Z0-9_-]{43}$/);

    const sessionUser = getUserBySession(token);
    expect(sessionUser).not.toBeNull();
    expect(sessionUser?.id).toBe(user.id);
    expect(sessionUser?.email).toBe(testEmail);

    deleteSession(token);
    const deletedSessionUser = getUserBySession(token);
    expect(deletedSessionUser).toBeNull();
  });

  it('stores local account password hashes and upgrades legacy users without changing their ID', () => {
    const email = `local_${Date.now()}@example.com`;
    const passwordHash = 'a'.repeat(32) + ':' + 'b'.repeat(128);
    const user = createLocalUser(email, 'Local Tester', passwordHash);

    expect(user.provider).toBe('local');
    expect(getLocalUserByEmail(email)?.password_hash).toBe(passwordHash);

    const upgraded = upgradeUserToLocal(user.id, 'Updated Tester', 'c'.repeat(32) + ':' + 'd'.repeat(128));
    expect(upgraded.id).toBe(user.id);
    expect(upgraded.name).toBe('Updated Tester');
  });

  it('berhasil menyimpan dan mengambil data keuangan cloud per user', () => {
    const user = upsertUser({
      email: `sync_${Date.now()}@example.com`,
      name: 'Cloud Tester',
    });

    const mockAccounts = [
      { id: 'acc-1', name: 'BCA Cloud', type: 'bank', initialBalance: 5000000, color: '#3b82f6', createdAt: '2026-10-22' }
    ];
    const mockCategories = [
      { id: 'cat-1', name: 'Gaji', type: 'income', icon: 'DollarSign', color: '#10b981' }
    ];
    const mockTransactions = [
      { id: 'tx-1', type: 'income', amount: 5000000, accountId: 'acc-1', date: '2026-10-22', createdAt: '2026-10-22' }
    ];

    const saveResult = saveUserFinanceData(user.id, {
      accounts: mockAccounts,
      categories: mockCategories,
      transactions: mockTransactions,
    });

    expect(saveResult.success).toBe(true);
    expect(saveResult.updatedAt).toBeDefined();

    const cloudData = getUserFinanceData(user.id);
    expect(cloudData).not.toBeNull();
    expect(cloudData?.accounts).toHaveLength(1);
    expect(cloudData?.transactions).toHaveLength(1);
    expect((cloudData?.accounts[0] as { name: string }).name).toBe('BCA Cloud');
  });
});
