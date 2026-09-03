import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Check, Plus } from 'lucide-react-native';
import { Colors, Fonts } from '../theme';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCategories } from '../contexts/CategoryContext';
import { AVAILABLE_CATEGORY_COLORS, AVAILABLE_CATEGORY_ICONS } from '../data/categories';
import type { TxType } from '../types';
import AnimatedModal from '../components/AnimatedModal';
import { useToast } from '../components/Toast';

interface Props {
  visible: boolean;
  type?: TxType;
  initialAmount?: number;
  initialCategory?: string;
  initialNote?: string;
  onClose: () => void;
  onSave: (type: TxType, amount: number, category: string, note: string) => void;
}

const sanitizeAmount = (t: string) => {
  const cleaned = t.replace(/[^0-9.]/g, '');
  const [head, ...rest] = cleaned.split('.');
  const tail = rest.length ? `.${rest.join('').slice(0, 2)}` : '';
  return `${head}${tail}`.slice(0, 12);
};

export default function AddTransactionModal({
  visible,
  type: initialType = 'income',
  initialAmount,
  initialCategory,
  initialNote,
  onClose,
  onSave,
}: Props) {
  const { currency } = useCurrency();
  const { expenseCategories, incomeCategories, addCustomCategory } = useCategories();
  const toast = useToast();

  const [activeType, setActiveType] = useState<TxType>('income');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Custom Category creation state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_CATEGORY_ICONS[0].name);
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_CATEGORY_COLORS[0]);

  const isIncome = activeType === 'income';
  const chips = isIncome ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (visible) {
      setActiveType(initialType);
      setAmountText(initialAmount ? String(initialAmount) : '');
      setNote(initialNote ?? '');
      setShowAddCategory(false);
      setNewCatName('');
      const activeChips = initialType === 'income' ? incomeCategories : expenseCategories;
      setCategory(
        initialCategory && activeChips.some((c) => c.name === initialCategory)
          ? initialCategory
          : activeChips[0]?.name ?? 'Other',
      );
    }
  }, [visible, initialType, initialAmount, initialCategory, initialNote, incomeCategories, expenseCategories]);

  // When switching type between income/expense
  const handleTypeSwitch = (type: TxType) => {
    setActiveType(type);
    const activeChips = type === 'income' ? incomeCategories : expenseCategories;
    setCategory(activeChips[0]?.name ?? 'Other');
  };

  const amount = useMemo(() => parseFloat(amountText) || 0, [amountText]);
  const valid = amount > 0;

  const save = () => {
    if (!valid) return;
    onSave(activeType, amount, category ?? chips[0].name, note.trim());
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast('Enter a category name');
      return;
    }
    const ok = await addCustomCategory(newCatName, activeType, newCatIcon, newCatColor);
    if (ok) {
      setCategory(newCatName.trim());
      setShowAddCategory(false);
      setNewCatName('');
    } else {
      toast('Category already exists');
    }
  };

  return (
    <AnimatedModal visible={visible} onClose={onClose}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
      >
        {/* HEADER ROW */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Transaction</Text>
          <Pressable
            style={styles.closeBtn}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
            hitSlop={8}
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        {/* SEGMENTED SWITCH: INCOME | EXPENSE */}
        <View style={styles.typeSegment}>
          <Pressable
            onPress={() => handleTypeSwitch('income')}
            style={[
              styles.segmentTab,
              isIncome && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isIncome && styles.segmentTextActive,
              ]}
            >
              Income
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTypeSwitch('expense')}
            style={[
              styles.segmentTab,
              !isIncome && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                !isIncome && styles.segmentTextActive,
              ]}
            >
              Expense
            </Text>
          </Pressable>
        </View>

        {/* AMOUNT FIELD */}
        <Text style={styles.fieldLabel}>Amount</Text>
        <View style={styles.amountBox}>
          <Text style={styles.currencyPrefix}>{currency.symbol}</Text>
          <TextInput
            value={amountText}
            onChangeText={(t) => setAmountText(sanitizeAmount(t))}
            placeholder="0.00"
            placeholderTextColor="#6B7280"
            style={styles.amountInput}
            keyboardType="decimal-pad"
            selectionColor="#FFFFFF"
          />
        </View>

        {/* NOTE / SOURCE FIELD */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
          {isIncome ? 'Where did it come from?' : 'What was it for?'}
        </Text>
        <View style={styles.noteBox}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={isIncome ? 'e.g. Salary, Freelance, Gift' : 'e.g. Food, Transport, Bills'}
            placeholderTextColor="#6B7280"
            style={styles.noteInput}
            maxLength={48}
          />
        </View>

        {/* CATEGORY SECTION HEADER */}
        <View style={styles.categoryHeaderRow}>
          <Text style={styles.categoryTitle}>Category</Text>
          <Pressable
            onPress={() => setShowAddCategory((v) => !v)}
            style={({ pressed }) => [styles.addCatLink, pressed && { opacity: 0.7 }]}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addCatLinkText}>
              {showAddCategory ? 'Cancel' : 'New'}
            </Text>
          </Pressable>
        </View>

        {/* CUSTOM CATEGORY CREATION ACCORDION */}
        {showAddCategory && (
          <View style={styles.createCatBox}>
            <Text style={styles.createCatTitle}>Create Custom Category</Text>
            <TextInput
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="e.g. Gaming, Coffee, Books"
              placeholderTextColor="#6B7280"
              style={styles.createCatInput}
              maxLength={24}
            />

            <Text style={styles.createCatSubLabel}>Pick Icon</Text>
            <View style={styles.iconRow}>
              {AVAILABLE_CATEGORY_ICONS.slice(0, 10).map((item) => {
                const IconComponent = item.icon;
                const isSelected = newCatIcon === item.name;
                return (
                  <Pressable
                    key={item.name}
                    onPress={() => setNewCatIcon(item.name)}
                    style={[
                      styles.iconSelectBtn,
                      isSelected && { borderColor: newCatColor, backgroundColor: `${newCatColor}22` },
                    ]}
                  >
                    <IconComponent
                      size={18}
                      color={isSelected ? newCatColor : '#9CA3AF'}
                      strokeWidth={2}
                    />
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.createCatSubLabel}>Pick Color</Text>
            <View style={styles.colorRow}>
              {AVAILABLE_CATEGORY_COLORS.map((col) => {
                const isSelected = newCatColor === col;
                return (
                  <Pressable
                    key={col}
                    onPress={() => setNewCatColor(col)}
                    style={[styles.colorDot, { backgroundColor: col }]}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleCreateCategory}
              disabled={!newCatName.trim()}
              style={({ pressed }) => [
                styles.createCatSubmitBtn,
                !newCatName.trim() && { opacity: 0.5 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.createCatSubmitText}>Add Category</Text>
            </Pressable>
          </View>
        )}

        {/* CHIP LIST */}
        <View style={styles.chips}>
          {chips.map((c) => {
            const isSelected = category === c.name;
            return (
              <Pressable
                key={c.name}
                onPress={() => setCategory(c.name)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* SAVE BUTTON (MATCHING SHEET DESIGN) */}
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            save();
          }}
          disabled={!valid}
          style={({ pressed }) => [
            styles.saveBtn,
            !valid && styles.saveDisabled,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={styles.saveText}>
            Save {isIncome ? 'Income' : 'Expense'}
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: Fonts.display,
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  typeSegment: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
  segmentTextActive: {
    color: '#0A0A0E',
    fontFamily: Fonts.displaySemi,
  },
  fieldLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 8,
  },
  amountBox: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  currencyPrefix: {
    color: '#FFFFFFAA',
    fontSize: 24,
    fontFamily: Fonts.displaySemi,
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: Fonts.displaySemi,
    paddingVertical: 0,
  },
  noteBox: {
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  noteInput: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.body,
    paddingVertical: 0,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts.display,
  },
  addCatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  addCatLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.bodySemi,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1C1C24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  chipTextSelected: {
    color: '#0A0A0E',
    fontFamily: Fonts.bodySemi,
  },
  saveBtn: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveText: {
    color: '#0A0A0E',
    fontSize: 16,
    fontFamily: Fonts.display,
  },
  createCatBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  createCatTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: Fonts.bodySemi,
  },
  createCatSubLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: Fonts.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  createCatInput: {
    backgroundColor: '#1C1C24',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconSelectBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1C1C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createCatSubmitBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  createCatSubmitText: {
    color: '#0A0A0E',
    fontSize: 13,
    fontFamily: Fonts.bodySemi,
  },
});
