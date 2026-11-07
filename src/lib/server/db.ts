import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface DbFinanceData {
  user_id: string;
  accounts_json: string;
  categories_json: string;
  transactions_json: string;
  updated_at: string;
}

// Global singleton instance for Next.js hot-reloading
const globalForDb = globalThis as unknown as {
  financeDbInstance?: DatabaseSync;
};

export function getDatabase(): DatabaseSync {
  if (globalForDb.financeDbInstance) {
    return globalForDb.financeDbInstance;
  }

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'finance.sqlite');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  // Initialize Schema
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      provider TEXT DEFAULT 'local',
      password_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_finance_data (
      user_id TEXT PRIMARY KEY,
      accounts_json TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      transactions_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `);

  // Migrate databases created before password-based accounts were added.
  const userColumns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (!userColumns.some((column) => column.name === 'password_hash')) {
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  }

  globalForDb.financeDbInstance = db;
  return db;
}

export function createLocalUser(email: string, name: string, passwordHash: string): DbUser {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  db.prepare(`INSERT INTO users (id, email, name, provider, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, 'local', ?, ?, ?)`).run(id, email, name, passwordHash, now, now);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser;
}

export function getUserByEmail(email: string): (DbUser & { password_hash: string | null }) | null {
  return (getDatabase().prepare('SELECT * FROM users WHERE email = ?').get(email) as (DbUser & { password_hash: string | null }) | undefined) || null;
}

export function upgradeUserToLocal(id: string, name: string, passwordHash: string): DbUser {
  const db = getDatabase();
  db.prepare("UPDATE users SET name = ?, provider = 'local', password_hash = ?, updated_at = ? WHERE id = ?")
    .run(name, passwordHash, new Date().toISOString(), id);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser;
}

export function getLocalUserByEmail(email: string): (DbUser & { password_hash: string | null }) | null {
  return (getDatabase().prepare("SELECT * FROM users WHERE email = ? AND provider = 'local'").get(email) as (DbUser & { password_hash: string | null }) | undefined) || null;
}

// User operations
export function upsertUser(user: {
  id?: string;
  email: string;
  name: string;
  avatar?: string | null;
  provider?: string;
}): DbUser {
  const db = getDatabase();
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(user.email) as DbUser | undefined;

  if (existing) {
    db.prepare(`
      UPDATE users
      SET name = ?, avatar = COALESCE(?, avatar), updated_at = ?
      WHERE email = ?
    `).run(user.name, user.avatar || null, now, user.email);

    return (db.prepare('SELECT * FROM users WHERE email = ?').get(user.email) as DbUser);
  } else {
    const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO users (id, email, name, avatar, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.email, user.name, user.avatar || null, user.provider || 'local', now, now);

    return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser);
  }
}

export function getUserById(id: string): DbUser | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
  return row || null;
}

// Session operations
export function createSession(userId: string, durationDays = 30): string {
  const db = getDatabase();
  const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, expiresAt, now.toISOString());

  return token;
}

export function getUserBySession(token: string): DbUser | null {
  if (!token) return null;
  const db = getDatabase();
  const now = new Date().toISOString();

  // Bersihkan sesi yang kadaluwarsa sesekali
  try {
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  } catch {
    // ignore
  }

  const session = db.prepare(`
    SELECT u.*
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now) as DbUser | undefined;

  return session || null;
}

export function deleteSession(token: string): void {
  if (!token) return;
  const db = getDatabase();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// User Finance Data (Cloud storage)
export function getUserFinanceData(userId: string): {
  accounts: unknown[];
  categories: unknown[];
  transactions: unknown[];
  updatedAt: string;
} | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT accounts_json, categories_json, transactions_json, updated_at
    FROM user_finance_data
    WHERE user_id = ?
  `).get(userId) as {
    accounts_json: string;
    categories_json: string;
    transactions_json: string;
    updated_at: string;
  } | undefined;

  if (!row) return null;

  try {
    return {
      accounts: JSON.parse(row.accounts_json),
      categories: JSON.parse(row.categories_json),
      transactions: JSON.parse(row.transactions_json),
      updatedAt: row.updated_at,
    };
  } catch {
    return null;
  }
}

export function saveUserFinanceData(
  userId: string,
  data: {
    accounts: unknown[];
    categories: unknown[];
    transactions: unknown[];
  }
): { success: boolean; updatedAt: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  const accountsJson = JSON.stringify(data.accounts || []);
  const categoriesJson = JSON.stringify(data.categories || []);
  const transactionsJson = JSON.stringify(data.transactions || []);

  db.prepare(`
    INSERT INTO user_finance_data (user_id, accounts_json, categories_json, transactions_json, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      accounts_json = excluded.accounts_json,
      categories_json = excluded.categories_json,
      transactions_json = excluded.transactions_json,
      updated_at = excluded.updated_at
  `).run(userId, accountsJson, categoriesJson, transactionsJson, now);

  return { success: true, updatedAt: now };
}
