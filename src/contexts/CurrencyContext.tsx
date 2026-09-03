import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CurrencyInfo } from '../types';
import { loadCurrency, saveCurrency } from '../utils/storage';
import { formatCurrency, formatNumber } from '../utils/format';

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', locale: 'en-AE' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', locale: 'en-SG' },
];

export const DEFAULT_CURRENCY = CURRENCIES[0];

interface CurrencyContextValue {
  currency: CurrencyInfo;
  setCurrencyByCode: (code: string) => void;
  formatAmount: (value: number, opts?: { sign?: boolean }) => string;
  formatValue: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrencyByCode: () => {},
  formatAmount: (val, opts) => formatCurrency(val, DEFAULT_CURRENCY.symbol, { ...opts, locale: DEFAULT_CURRENCY.locale }),
  formatValue: (val) => formatNumber(val, DEFAULT_CURRENCY.locale),
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyInfo>(DEFAULT_CURRENCY);

  useEffect(() => {
    loadCurrency().then((code) => {
      const found = CURRENCIES.find((c) => c.code === code);
      if (found) setCurrencyState(found);
    });
  }, []);

  const setCurrencyByCode = useCallback((code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) {
      setCurrencyState(found);
      saveCurrency(code);
    }
  }, []);

  const formatAmount = useCallback(
    (value: number, opts: { sign?: boolean } = {}) => {
      return formatCurrency(value, currency.symbol, { ...opts, locale: currency.locale });
    },
    [currency],
  );

  const formatValue = useCallback(
    (value: number) => {
      return formatNumber(value, currency.locale);
    },
    [currency],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyByCode, formatAmount, formatValue }}>
      {children}
    </CurrencyContext.Provider>
  );
}
