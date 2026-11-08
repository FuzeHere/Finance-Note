'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Account, Category, Transaction, TransactionType, UserProfile, CloudSyncStatus } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, generateSeedTransactions } from './defaults';
import { calculateAccountBalances } from '../finance/calculations';

interface FinanceContextType {
  // Profil / Akun
  currentUser: UserProfile;
  profiles: UserProfile[];
  loginOrCreateProfile: (name: string, email?: string) => UserProfile;
  switchProfile: (profileId: string) => void;
  logoutToGuest: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  // Cloud Sync & Auth
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncMessage: string | null;
  lastSyncedAt: string | null;
  isCloudActive: boolean;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  loginWithLocalAccount: (email: string, password: string, registerName?: string) => Promise<string | null>;
  logoutFromCloud: () => Promise<void>;

  // Akun / Dompet
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  totalBalance: number;
  isLoaded: boolean;
  
  // Transaksi Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => Transaction | null;
  undoDeleteTransaction: () => boolean;
  lastDeletedTransaction: Transaction | null;
  
  // Akun Actions
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Account;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => { success: boolean; message?: string };
  hasLinkedTransactions: (accountId: string) => boolean;
  
  // Kategori & Backup
  addCategory: (category: Omit<Category, 'id'>) => Category;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => boolean;

  // Reset Actions
  resetAllData: () => void;
  hardResetCleanData: () => void;
  isResetModalOpen: boolean;
  openResetModal: () => void;
  closeResetModal: () => void;

  // Modal Control (Add & Edit)
  isAddModalOpen: boolean;
  openAddModal: (initialType?: TransactionType) => void;
  openEditModal: (transaction: Transaction) => void;
  closeAddModal: () => void;
  initialModalType: TransactionType;
  editingTransaction: Transaction | null;
}

const STORAGE_KEYS = {
  ACCOUNTS: 'pk_accounts_v1',
  CATEGORIES: 'pk_categories_v1',
  TRANSACTIONS: 'pk_transactions_v1',
  PROFILES: 'pk_profiles_v1',
  CURRENT_USER: 'pk_current_user_v1',
  LAST_SYNC: 'pk_last_cloud_sync_v1',
};

const DEFAULT_GUEST_USER: UserProfile = {
  id: 'usr-guest',
  name: 'Tamu (Lokal)',
  isGuest: true,
  provider: 'guest',
  createdAt: new Date().toISOString(),
};

function getInitialState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  // Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() =>
    getInitialState(STORAGE_KEYS.CURRENT_USER, DEFAULT_GUEST_USER)
  );
  const [profiles, setProfiles] = useState<UserProfile[]>(() =>
    getInitialState(STORAGE_KEYS.PROFILES, [DEFAULT_GUEST_USER])
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Cloud Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle');
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    getInitialState(STORAGE_KEYS.LAST_SYNC, null)
  );

  // Core Data States
  const [accounts, setAccounts] = useState<Account[]>(() =>
    getInitialState(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS)
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    getInitialState(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getInitialState(STORAGE_KEYS.TRANSACTIONS, generateSeedTransactions())
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Undo buffer
  const [lastDeletedTransaction, setLastDeletedTransaction] = useState<Transaction | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialModalType, setInitialModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync ref to avoid stale closures
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCloudActive = currentUser.provider === 'local' || currentUser.provider === 'google';

  // Cloud Sync Worker function
  const pushToCloud = useCallback(async (
    targetAccounts: Account[],
    targetCategories: Category[],
    targetTransactions: Transaction[]
  ): Promise<boolean> => {
    try {
      setCloudSyncStatus('syncing');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accounts: targetAccounts,
          categories: targetCategories,
          transactions: targetTransactions,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const syncTime = json.updatedAt || new Date().toISOString();
        setCloudSyncStatus('synced');
        setCloudSyncMessage(null);
        setLastSyncedAt(syncTime);
        try {
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(syncTime));
        } catch {
          // ignore
        }
        return true;
      } else {
        const error = await res.json().catch(() => null);
        setCloudSyncMessage(error?.message || `Sinkronisasi gagal (HTTP ${res.status}).`);
        setCloudSyncStatus('error');
        return false;
      }
    } catch (err) {
      console.error('Cloud sync push error:', err);
      setCloudSyncMessage('Server tidak dapat dijangkau. Periksa koneksi jaringan Anda.');
      setCloudSyncStatus('error');
      return false;
    }
  }, []);

  // Debounced auto-sync when changes occur
  const triggerAutoSync = useCallback((
    newAccounts: Account[],
    newCategories: Category[],
    newTransactions: Transaction[]
  ) => {
    if (currentUser.provider !== 'local' && currentUser.provider !== 'google') return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    setCloudSyncStatus('syncing');
    syncTimeoutRef.current = setTimeout(() => {
      pushToCloud(newAccounts, newCategories, newTransactions);
    }, 800);
  }, [currentUser.provider, pushToCloud]);

  // Simpan akun ke storage & sync cloud
  const saveAccounts = useCallback((newAccounts: Account[]) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(newAccounts));
    } catch (e) {
      console.error('Gagal menyimpan akun ke storage:', e);
    }
    triggerAutoSync(newAccounts, categories, transactions);
  }, [categories, transactions, triggerAutoSync]);

  // Simpan kategori ke storage & sync cloud
  const saveCategories = useCallback((newCategories: Category[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    } catch (e) {
      console.error('Gagal menyimpan kategori ke storage:', e);
    }
    triggerAutoSync(accounts, newCategories, transactions);
  }, [accounts, transactions, triggerAutoSync]);

  // Simpan transaksi ke storage & sync cloud
  const saveTransactions = useCallback((newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
    } catch (e) {
      console.error('Gagal menyimpan transaksi ke storage:', e);
    }
    triggerAutoSync(accounts, categories, newTransactions);
  }, [accounts, categories, triggerAutoSync]);

  // Manual Trigger: Sync data to cloud
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    return pushToCloud(accounts, categories, transactions);
  }, [accounts, categories, transactions, pushToCloud]);

  // Manual Trigger: Pull data from cloud
  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    try {
      setCloudSyncStatus('syncing');
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json.hasData && json.data) {
          const cloudAccounts = json.data.accounts || DEFAULT_ACCOUNTS;
          const cloudCategories = json.data.categories || DEFAULT_CATEGORIES;
          const cloudTransactions = json.data.transactions || [];

          setAccounts(cloudAccounts);
          setCategories(cloudCategories);
          setTransactions(cloudTransactions);

          try {
            localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(cloudAccounts));
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudCategories));
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudTransactions));
          } catch {
            // ignore
          }

          const syncTime = json.data.updatedAt || new Date().toISOString();
          setCloudSyncStatus('synced');
          setCloudSyncMessage(null);
          setLastSyncedAt(syncTime);
          return true;
        } else if (!json.hasData) {
          // Cloud kosong, simpan data lokal saat ini ke cloud
          return pushToCloud(accounts, categories, transactions);
        }
      }
      const error = await res.json().catch(() => null);
      setCloudSyncMessage(error?.message || `Sinkronisasi gagal (HTTP ${res.status}).`);
      setCloudSyncStatus('error');
      return false;
    } catch (err) {
      console.error('Sync from cloud failed:', err);
      setCloudSyncMessage('Server tidak dapat dijangkau. Periksa koneksi jaringan Anda.');
      setCloudSyncStatus('error');
      return false;
    }
  }, [accounts, categories, transactions, pushToCloud]);

  // Check auth & sync on startup
  useEffect(() => {
    let isMounted = true;

    async function initializeAuthAndCloud() {
      try {
        // Cek sesi login saat ini
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user && isMounted) {
            const accountUser: UserProfile = {
              id: meData.user.id,
              name: meData.user.name,
              email: meData.user.email,
              avatar: meData.user.avatar,
              provider: meData.user.provider || 'local',
              isGuest: false,
              createdAt: meData.user.createdAt,
            };

            setCurrentUser(accountUser);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(accountUser));
            setProfiles((existingProfiles) => {
              const offlineProfiles = existingProfiles.map((profile) =>
                profile.provider === 'local' ? { ...profile, provider: 'offline' as const } : profile
              );
              localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(offlineProfiles));
              return offlineProfiles;
            });

            // Pull cloud data
            const syncRes = await fetch('/api/sync');
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.hasData && syncData.data) {
                const cloudAccs = syncData.data.accounts || DEFAULT_ACCOUNTS;
                const cloudCats = syncData.data.categories || DEFAULT_CATEGORIES;
                const cloudTxs = syncData.data.transactions || [];

                setAccounts(cloudAccs);
                setCategories(cloudCats);
                setTransactions(cloudTxs);

                localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(cloudAccs));
                localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudCats));
                localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudTxs));

                setCloudSyncStatus('synced');
                setCloudSyncMessage(null);
                setLastSyncedAt(syncData.data.updatedAt);
              } else if (!syncData.hasData) {
                // Initial backup of existing local data to cloud
                const currentAccs = getInitialState(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
                const currentCats = getInitialState(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
                const currentTxs = getInitialState(STORAGE_KEYS.TRANSACTIONS, generateSeedTransactions());
                pushToCloud(currentAccs, currentCats, currentTxs);
              }
            } else {
              const syncError = await syncRes.json().catch(() => null);
              setCloudSyncMessage(syncError?.message || `Sinkronisasi gagal (HTTP ${syncRes.status}).`);
              setCloudSyncStatus('error');
            }
          }
          if (meRes.ok && !meData.user && isMounted) {
            // Older offline profiles also used provider="local"; they have no server session.
            setCurrentUser((current) => {
              const offlineUser = current.provider === 'local' ? { ...current, provider: 'offline' as const } : current;
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(offlineUser));
              return offlineUser;
            });
            setProfiles((existingProfiles) => {
              const offlineProfiles = existingProfiles.map((profile) =>
                profile.provider === 'local' ? { ...profile, provider: 'offline' as const } : profile
              );
              localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(offlineProfiles));
              return offlineProfiles;
            });
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    initializeAuthAndCloud();

    return () => {
      isMounted = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [pushToCloud]);

  const loginWithLocalAccount = useCallback(async (email: string, password: string, registerName?: string): Promise<string | null> => {
    try {
      const response = await fetch(registerName ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerName ? { name: registerName, email, password } : { email, password }),
      });
      const result = await response.json();
      if (!response.ok) return result.message || 'Tidak dapat masuk.';
      const user: UserProfile = { ...result.user, isGuest: false, provider: 'local' };
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      await pushToCloud(accounts, categories, transactions);
      setIsProfileModalOpen(false);
      return null;
    } catch { return 'Koneksi bermasalah. Silakan coba lagi.'; }
  }, [accounts, categories, transactions, pushToCloud]);

  const logoutFromCloud = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setCurrentUser(DEFAULT_GUEST_USER);
    setCloudSyncStatus('idle');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_GUEST_USER));
    setIsProfileModalOpen(false);
  }, []);

  // Profil Actions: Buat / Masuk Akun Lokal
  const loginOrCreateProfile = useCallback((name: string, email?: string): UserProfile => {
    const existing = profiles.find(
      (p) => p.name.toLowerCase() === name.toLowerCase() || (email && p.email?.toLowerCase() === email.toLowerCase())
    );

    let user: UserProfile;
    if (existing) {
      user = existing;
    } else {
      user = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: email?.trim() || undefined,
        isGuest: false,
        provider: 'offline',
        createdAt: new Date().toISOString(),
      };
      const updatedProfiles = [...profiles, user];
      setProfiles(updatedProfiles);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedProfiles));
    }

    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    setIsProfileModalOpen(false);
    return user;
  }, [profiles]);

  const switchProfile = useCallback((profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
      setIsProfileModalOpen(false);
    }
  }, [profiles]);

  const logoutToGuest = useCallback(() => {
    if (currentUser.provider === 'google' || currentUser.provider === 'local') {
      logoutFromCloud();
    } else {
      setCurrentUser(DEFAULT_GUEST_USER);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_GUEST_USER));
      setIsProfileModalOpen(false);
    }
  }, [currentUser.provider, logoutFromCloud]);

  const openProfileModal = useCallback(() => setIsProfileModalOpen(true), []);
  const closeProfileModal = useCallback(() => setIsProfileModalOpen(false), []);

  // Perhitungan saldo tiap akun & saldo total (Memoized)
  const { accountsWithBalance, totalBalance } = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  // Transaksi CRUD
  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    saveTransactions([newTx, ...transactions]);
    return newTx;
  }, [transactions, saveTransactions]);

  const updateTransaction = useCallback((updatedTx: Transaction) => {
    const updated = transactions.map((t) =>
      t.id === updatedTx.id ? { ...updatedTx, updatedAt: new Date().toISOString() } : t
    );
    saveTransactions(updated);
  }, [transactions, saveTransactions]);

  const deleteTransaction = useCallback((id: string): Transaction | null => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return null;

    setLastDeletedTransaction(target);
    const updated = transactions.filter((t) => t.id !== id);
    saveTransactions(updated);
    return target;
  }, [transactions, saveTransactions]);

  const undoDeleteTransaction = useCallback((): boolean => {
    if (!lastDeletedTransaction) return false;

    saveTransactions([lastDeletedTransaction, ...transactions]);
    setLastDeletedTransaction(null);
    return true;
  }, [lastDeletedTransaction, transactions, saveTransactions]);

  const hasLinkedTransactions = useCallback((accountId: string): boolean => {
    return transactions.some((t) => t.accountId === accountId || t.toAccountId === accountId);
  }, [transactions]);

  const addAccount = useCallback((accData: Omit<Account, 'id' | 'createdAt'>): Account => {
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    saveAccounts([...accounts, newAcc]);
    return newAcc;
  }, [accounts, saveAccounts]);

  const updateAccount = useCallback((updatedAcc: Account) => {
    const updated = accounts.map((a) => (a.id === updatedAcc.id ? updatedAcc : a));
    saveAccounts(updated);
  }, [accounts, saveAccounts]);

  const deleteAccount = useCallback((id: string): { success: boolean; message?: string } => {
    if (accounts.length <= 1) {
      return { success: false, message: 'Minimal harus ada satu dompet/rekening aktif.' };
    }

    if (hasLinkedTransactions(id)) {
      return {
        success: false,
        message: 'Tidak dapat menghapus dompet yang memiliki riwayat transaksi aktif.',
      };
    }

    const updated = accounts.filter((a) => a.id !== id);
    saveAccounts(updated);
    return { success: true };
  }, [accounts, hasLinkedTransactions, saveAccounts]);

  const addCategory = useCallback((catData: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    saveCategories([...categories, newCat]);
    return newCat;
  }, [categories, saveCategories]);

  const resetAllData = useCallback(() => {
    const seedTxs = generateSeedTransactions();
    saveAccounts(DEFAULT_ACCOUNTS);
    saveCategories(DEFAULT_CATEGORIES);
    saveTransactions(seedTxs);
    setLastDeletedTransaction(null);
    setIsResetModalOpen(false);
  }, [saveAccounts, saveCategories, saveTransactions]);

  const hardResetCleanData = useCallback(() => {
    const cleanAccounts: Account[] = [
      {
        id: 'acc-cash',
        name: 'Uang Tunai',
        type: 'cash',
        initialBalance: 0,
        color: '#10b981',
        createdAt: new Date().toISOString(),
      },
    ];
    saveAccounts(cleanAccounts);
    saveCategories(DEFAULT_CATEGORIES);
    saveTransactions([]);
    setLastDeletedTransaction(null);
    setIsResetModalOpen(false);
  }, [saveAccounts, saveCategories, saveTransactions]);

  const openResetModal = useCallback(() => setIsResetModalOpen(true), []);
  const closeResetModal = useCallback(() => setIsResetModalOpen(false), []);

  const exportBackupJSON = useCallback((): string => {
    const data = {
      app: 'DompetKu',
      version: 1,
      exportedAt: new Date().toISOString(),
      user: currentUser,
      accounts,
      categories,
      transactions,
    };
    return JSON.stringify(data, null, 2);
  }, [currentUser, accounts, categories, transactions]);

  const importBackupJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.accounts) && Array.isArray(data.transactions)) {
        saveAccounts(data.accounts);
        if (Array.isArray(data.categories)) {
          saveCategories(data.categories);
        }
        saveTransactions(data.transactions);
        if (data.user) {
          setCurrentUser(data.user);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [saveAccounts, saveCategories, saveTransactions]);

  const openAddModal = useCallback((initialType: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setInitialModalType(initialType);
    setIsAddModalOpen(true);
  }, []);

  const openEditModal = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setInitialModalType(transaction.type);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        profiles,
        loginOrCreateProfile,
        switchProfile,
        logoutToGuest,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        cloudSyncStatus,
        cloudSyncMessage,
        lastSyncedAt,
        isCloudActive,
        syncToCloud,
        syncFromCloud,
        loginWithLocalAccount,
        logoutFromCloud,
        accounts: accountsWithBalance,
        categories,
        transactions,
        totalBalance,
        isLoaded,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        undoDeleteTransaction,
        lastDeletedTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        hasLinkedTransactions,
        addCategory,
        exportBackupJSON,
        importBackupJSON,
        resetAllData,
        hardResetCleanData,
        isResetModalOpen,
        openResetModal,
        closeResetModal,
        isAddModalOpen,
        openAddModal,
        openEditModal,
        closeAddModal,
        initialModalType,
        editingTransaction,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance harus digunakan di dalam FinanceProvider');
  }
  return context;
}
