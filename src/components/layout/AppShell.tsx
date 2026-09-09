'use client';

import React from 'react';
import { FinanceProvider, useFinance } from '../../lib/store/financeContext';
import { ThemeProvider, useTheme } from '../../lib/store/themeContext';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { TransactionModal } from '../finance/TransactionModal';
import { ProfileModal } from '../profile/ProfileModal';
import { ResetAllDataModal } from '../common/ResetAllDataModal';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isAddModalOpen, closeAddModal, initialModalType } = useFinance();
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <Navbar />
      <main className="flex-1 w-full max-w-md mx-auto">
        {children}
      </main>
      <BottomNav />
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        initialType={initialModalType}
      />
      <ProfileModal />
      <ResetAllDataModal />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <AppContent>{children}</AppContent>
      </FinanceProvider>
    </ThemeProvider>
  );
}
