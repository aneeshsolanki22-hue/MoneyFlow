import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CustomCategory, TxType } from '../types';
import {
  CategoryDef,
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  getCategory as resolveCategory,
  getCategoryIcon,
} from '../data/categories';
import { loadCustomCategories, saveCustomCategories } from '../utils/storage';
import { genId } from '../utils/format';

interface CategoryContextValue {
  customCategories: CustomCategory[];
  expenseCategories: CategoryDef[];
  incomeCategories: CategoryDef[];
  getCategory: (type: TxType, name: string) => CategoryDef;
  addCustomCategory: (name: string, type: TxType, iconName: string, color: string) => Promise<boolean>;
  deleteCustomCategory: (id: string) => Promise<void>;
  setCustomCategoriesList: (categories: CustomCategory[]) => Promise<void>;
}

const CategoryContext = createContext<CategoryContextValue>({
  customCategories: [],
  expenseCategories: EXPENSE_CATEGORIES,
  incomeCategories: INCOME_SOURCES,
  getCategory: (type, name) => resolveCategory(type, name),
  addCustomCategory: async () => false,
  deleteCustomCategory: async () => {},
  setCustomCategoriesList: async () => {},
});

export function useCategories() {
  return useContext(CategoryContext);
}

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  useEffect(() => {
    loadCustomCategories().then(setCustomCategories);
  }, []);

  const addCustomCategory = useCallback(
    async (name: string, type: TxType, iconName: string, color: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      // Avoid duplicate names (case-insensitive)
      const existing = [
        ...EXPENSE_CATEGORIES,
        ...INCOME_SOURCES,
        ...customCategories,
      ];
      if (existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
        return false;
      }

      const newCat: CustomCategory = {
        id: genId(),
        name: trimmed,
        type,
        iconName,
        color,
      };

      const updated = [...customCategories, newCat];
      setCustomCategories(updated);
      await saveCustomCategories(updated);
      return true;
    },
    [customCategories],
  );

  const deleteCustomCategory = useCallback(
    async (id: string) => {
      const updated = customCategories.filter((c) => c.id !== id);
      setCustomCategories(updated);
      await saveCustomCategories(updated);
    },
    [customCategories],
  );

  const setCustomCategoriesList = useCallback(async (categories: CustomCategory[]) => {
    setCustomCategories(categories);
    await saveCustomCategories(categories);
  }, []);

  const expenseCategories = useMemo(() => {
    const customs: CategoryDef[] = customCategories
      .filter((c) => c.type === 'expense')
      .map((c) => ({
        name: c.name,
        icon: getCategoryIcon(c.iconName),
        color: c.color,
        tile: `${c.color}22`,
      }));
    return [...EXPENSE_CATEGORIES.filter((c) => c.name !== 'Other'), ...customs, EXPENSE_CATEGORIES.find((c) => c.name === 'Other')!];
  }, [customCategories]);

  const incomeCategories = useMemo(() => {
    const customs: CategoryDef[] = customCategories
      .filter((c) => c.type === 'income')
      .map((c) => ({
        name: c.name,
        icon: getCategoryIcon(c.iconName),
        color: c.color,
        tile: `${c.color}22`,
      }));
    return [...INCOME_SOURCES.filter((c) => c.name !== 'Other'), ...customs, INCOME_SOURCES.find((c) => c.name === 'Other')!];
  }, [customCategories]);

  const getCategory = useCallback(
    (type: TxType, name: string) => {
      return resolveCategory(type, name, customCategories);
    },
    [customCategories],
  );

  return (
    <CategoryContext.Provider
      value={{
        customCategories,
        expenseCategories,
        incomeCategories,
        getCategory,
        addCustomCategory,
        deleteCustomCategory,
        setCustomCategoriesList,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

