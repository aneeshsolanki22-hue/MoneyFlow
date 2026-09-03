import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BackupState, CustomCategory, Transaction, UserProfile } from '../types';

const KEYS = {
  transactions: '@mfb/transactions/v1',
  user: '@mfb/user/v1',
  backup: '@mfb/backup/v1',
  theme: '@mfb/theme/v1',
  gradient: '@mfb/gradient/v1',
  currency: '@mfb/currency/v1',
  customCategories: '@mfb/custom_categories/v1',
};

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.transactions);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Any valid stored array is authoritative — including an empty one.
    // Fresh installs start with no data; nothing fake is ever seeded.
    return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
  } catch {
    return [];
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

const GRADIENT_VARIANTS: ReadonlyArray<'ocean' | 'ember'> = ['ocean', 'ember'];

export async function loadGradient(): Promise<'ocean' | 'ember' | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.gradient);
    return (GRADIENT_VARIANTS as readonly string[]).includes(raw ?? '')
      ? (raw as 'ocean' | 'ember')
      : null;
  } catch {
    return null;
  }
}

export async function saveGradient(variant: 'ocean' | 'ember'): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.gradient, variant);
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
