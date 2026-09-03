export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  timestamp: number;
}

export interface UserProfile {
  onboarded: boolean;
}

/** Home-screen gradient look. Independent of the dark/light theme. */
export type GradientVariant = 'ocean' | 'ember';

export interface BackupState {
  googleConnected: boolean;
  googleEmail: string | null;
  lastBackup: number | null;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: TxType;
  iconName: string;
  color: string;
}
