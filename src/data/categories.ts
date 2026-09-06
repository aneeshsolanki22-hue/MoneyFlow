import type { ComponentType } from 'react';
import {
  Banknote,
  BookOpen,
  Bus,
  Coffee,
  CreditCard,
  Dog,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Music,
  Pizza,
  Plane,
  Receipt,
  Shirt,
  ShoppingBasket,
  Smile,
  Sparkles,
  TrendingUp,
  Tv,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react-native';
import type { CustomCategory, TxType } from '../types';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number | string;
}

export type IconType = ComponentType<IconProps>;

export interface CategoryDef {
  name: string;
  icon: IconType;
  color: string;
}

export const AVAILABLE_CATEGORY_ICONS: { name: string; icon: IconType }[] = [
  { name: 'Utensils', icon: Utensils },
  { name: 'Coffee', icon: Coffee },
  { name: 'Pizza', icon: Pizza },
  { name: 'ShoppingBasket', icon: ShoppingBasket },
  { name: 'Shirt', icon: Shirt },
  { name: 'Bus', icon: Bus },
  { name: 'Fuel', icon: Fuel },
  { name: 'Plane', icon: Plane },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Film', icon: Film },
  { name: 'Music', icon: Music },
  { name: 'Tv', icon: Tv },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Dog', icon: Dog },
  { name: 'Home', icon: Home },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Smile', icon: Smile },
  { name: 'Zap', icon: Zap },
  { name: 'Receipt', icon: Receipt },
  { name: 'Wallet', icon: Wallet },
  { name: 'Laptop', icon: Laptop },
  { name: 'Gift', icon: Gift },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'MoreHorizontal', icon: MoreHorizontal },
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#FB923C', // Orange
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#34D399', // Emerald
  '#10B981', // Green
  '#38BDF8', // Sky
  '#6366F1', // Indigo
  '#A78BFA', // Violet
  '#F472B6', // Pink
  '#9CA3AF', // Gray
];

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: 'Food', icon: Utensils, color: '#FB923C' },
  { name: 'Groceries', icon: ShoppingBasket, color: '#34D399' },
  { name: 'Transport', icon: Bus, color: '#A78BFA' },
  { name: 'Utilities', icon: Zap, color: '#38BDF8' },
  { name: 'Bills', icon: Receipt, color: '#F87171' },
  { name: 'Other', icon: MoreHorizontal, color: '#9CA3AF' },
];

export const INCOME_SOURCES: CategoryDef[] = [
  { name: 'Salary', icon: Wallet, color: '#4ADE80' },
  { name: 'Freelance', icon: Laptop, color: '#38BDF8' },
  { name: 'Gift', icon: Gift, color: '#F472B6' },
  { name: 'Investment', icon: TrendingUp, color: '#A78BFA' },
  { name: 'Income', icon: Banknote, color: '#34D399' },
  { name: 'Payment', icon: CreditCard, color: '#6366F1' },
  { name: 'Other', icon: MoreHorizontal, color: '#9CA3AF' },
];

export function getCategoryIcon(iconName: string): IconType {
  const found = AVAILABLE_CATEGORY_ICONS.find((i) => i.name === iconName);
  return found ? found.icon : MoreHorizontal;
}

export function getCategory(
  type: TxType,
  name: string,
  customCategories: CustomCategory[] = [],
): CategoryDef {
  // Check custom categories first
  const custom = customCategories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (custom) {
    return {
      name: custom.name,
      icon: getCategoryIcon(custom.iconName),
      color: custom.color,
    };
  }

  const list = type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;
  return list.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? list[list.length - 1];
}
