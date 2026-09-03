import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BackupState, CustomCategory, Transaction, UserProfile } from '../types';

const KEYS = {
  transactions: '@mfb/transactions/v1',
  user: '@mfb/user/v1',
  backup: '@mfb/backup/v1',
  theme: '@mfb/theme/v1',
  currency: '@mfb/currency/v1',
  customCategories: '@mfb/custom_categories/v1',
};

const INITIAL_H1_TRANSACTIONS: Transaction[] = [
  {
    id: 'h1_tx_1',
    amount: 450,
    type: 'expense',
    category: 'Food',
    note: 'Dinner at Spice Villa',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // Today 8:42 PM
  },
  {
    id: 'h1_tx_2',
    amount: 1240,
    type: 'expense',
    category: 'Groceries',
    note: 'Big Bazaar weekly',
    timestamp: Date.now() - 1000 * 60 * 60 * 4, // Today 6:10 PM
  },
  {
    id: 'h1_tx_3',
    amount: 180,
    type: 'expense',
    category: 'Transport',
    note: 'Uber to office',
    timestamp: Date.now() - 1000 * 60 * 60 * 9, // Today 9:15 AM
  },
  {
    id: 'h1_tx_4',
    amount: 85000,
    type: 'income',
    category: 'Salary',
    note: 'Monthly salary',
    timestamp: Date.now() - 1000 * 60 * 60 * 26, // Yesterday 12:00 PM
  },
  {
    id: 'h1_tx_5',
    amount: 1650,
    type: 'expense',
    category: 'Bills',
    note: 'Electricity bill',
    timestamp: Date.now() - 1000 * 60 * 60 * 28, // Yesterday 10:30 AM
  },
];

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.transactions);
    if (!raw) {
      await saveTransactions(INITIAL_H1_TRANSACTIONS);
      return INITIAL_H1_TRANSACTIONS;
    }
    const parsed: unknown = JSON.parse(raw);
    // Any valid stored array is authoritative — including an empty one
    // (the user deleted everything). Seed data only appears on first launch.
    return Array.isArray(parsed) ? (parsed as Transaction[]) : INITIAL_H1_TRANSACTIONS;
  } catch {
    return INITIAL_H1_TRANSACTIONS;
  }
}

export async function saveTransactions(txs: Transaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(txs));
  } catch {
    // ignore write failures for now
  }
}

export async function loadUser(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.user);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveUser(user: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export async function loadBackup(): Promise<BackupState> {
  const fallback: BackupState = { googleConnected: false, googleEmail: null, lastBackup: null };
  try {
    const raw = await AsyncStorage.getItem(KEYS.backup);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as BackupState) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveBackup(state: BackupState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.backup, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export async function loadSavedTheme(): Promise<'light' | 'dark' | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.theme);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}
export const loadTheme = loadSavedTheme;

export async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.theme, theme);
  } catch {
    // ignore
  }
}

export async function loadSavedCurrency(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.currency);
  } catch {
    return null;
  }
}
export const loadCurrency = loadSavedCurrency;

export async function saveCurrency(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.currency, code);
  } catch {
    // ignore
  }
}

export async function loadCustomCategories(): Promise<CustomCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.customCategories);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomCategory[]) : [];
  } catch {
    return [];
  }
}

export async function saveCustomCategories(categories: CustomCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.customCategories, JSON.stringify(categories));
  } catch {
    // ignore
  }
}
