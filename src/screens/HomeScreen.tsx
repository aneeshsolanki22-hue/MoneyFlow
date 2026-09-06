import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, HOME_GRADIENTS } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCategories } from '../contexts/CategoryContext';
import type { BackupState, Transaction, TxType, UserProfile } from '../types';
import {
  formatDayHeader,
  genId,
  monthDate,
  MONTH_NAMES_FULL,
  monthKey,
} from '../utils/format';
import {
  loadBackup,
  loadTransactions,
  saveBackup,
  saveTransactions,
} from '../utils/storage';
import { downloadBackup, uploadBackup } from '../utils/drive';
import { useToast } from '../components/Toast';
import CountUpText from '../components/CountUpText';
import TransactionRow from '../components/TransactionRow';
import H1Navbar, { type TabType } from '../components/H1Navbar';
import AddTransactionModal from './AddTransactionModal';
import AnalyticsScreen from './AnalyticsScreen';
import SettingsScreen from './SettingsScreen';

interface Props {
  user: UserProfile;
  initialGoogleToken?: string | null;
}

/** Stable separator — defined outside component so identity never changes. */
const ListSeparator = () => <View style={{ height: 8 }} />;

const keyExtractor = (item: Transaction) => item.id;

export default function HomeScreen({ user, initialGoogleToken = null }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { theme, colors, gradient } = useTheme();
  const isDark = theme === 'dark';
  const { currency, formatAmount, formatValue, setCurrencyByCode } = useCurrency();
  const { customCategories, setCustomCategoriesList } = useCategories();

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(Date.now()));
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [openTxId, setOpenTxId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [modal, setModal] = useState<TxType | null>(null);
  const [backup, setBackup] = useState<BackupState>({
    googleConnected: false,
    googleEmail: null,
    lastBackup: null,
  });
  const [googleToken, setGoogleToken] = useState<string | null>(initialGoogleToken);
  const [listAnimated, setListAnimated] = useState(false);
  // Track which tabs have been visited — mount on first visit, stay mounted.
  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(() => new Set<TabType>(['home']));

  const handleTabChange = useCallback((tab: TabType) => {
    setCurrentTab(tab);
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  useEffect(() => {
    if (ready && transactions.length > 0) {
      const t = setTimeout(() => setListAnimated(true), 1500);
      return () => clearTimeout(t);
    }
  }, [ready, transactions.length]);

  useEffect(() => {
    (async () => {
      const [txs, b] = await Promise.all([loadTransactions(), loadBackup()]);
      setTransactions(txs);
      if (b) setBackup(b);
      setReady(true);
    })();
  }, []);

  // Debounce storage writes so rapid add/delete/undo sequences batch into one
  // write instead of one per keystroke-like state change.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveTransactions(transactions), 400);
  }, [transactions, ready]);

  // Flush any pending debounced write when the screen unmounts, so the very
  // last change is never lost.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTransactions(transactionsRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modal) {
        setModal(null);
        return true;
      }
      if (currentTab !== 'home') {
        setCurrentTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [modal, currentTab]);

  const currentMonthDate = useMemo(() => monthDate(selectedMonth), [selectedMonth]);

  const monthDisplayText = useMemo(() => {
    return `${MONTH_NAMES_FULL[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;
  }, [currentMonthDate]);

  const changeMonth = (offset: number) => {
    if (Platform.OS === 'android') Vibration.vibrate(10);
    const next = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + offset, 1);
    setSelectedMonth(monthKey(next.getTime()));
  };

  const monthly = useMemo(
    () =>
      transactions
        .filter((t) => monthKey(t.timestamp) === selectedMonth)
        .filter((t) => filter === 'all' || t.type === filter)
        .sort((a, b) => b.timestamp - a.timestamp),
    [transactions, selectedMonth, filter],
  );

  const sections = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of monthly) {
      const d = new Date(tx.timestamp);
      d.setHours(0, 0, 0, 0);
      const key = String(d.getTime());
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return [...map.entries()].map(([, txs]) => ({
      title: formatDayHeader(txs[0].timestamp),
      data: txs,
    }));
  }, [monthly]);

  const balance = useMemo(() => {
    return transactions.reduce(
      (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
      0,
    );
  }, [transactions]);

  const totals = useMemo(() => {
    const monthTxs = transactions.filter((t) => monthKey(t.timestamp) === selectedMonth);
    let monthIncome = 0;
    let monthExpense = 0;
    for (const t of monthTxs) {
      if (t.type === 'income') monthIncome += t.amount;
      else monthExpense += t.amount;
    }
    return { monthIncome, monthExpense };
  }, [transactions, selectedMonth]);

  const toggleTxReveal = useCallback((id: string) => {
    setOpenTxId((cur) => (cur === id ? null : id));
  }, []);

  // Snapshot of the most recently deleted transaction, for single-slot Undo.
  const undoRef = useRef<{ tx: Transaction; index: number } | null>(null);
  const transactionsRef = useRef<Transaction[]>([]);
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);
  const deletingTxIdRef = useRef<string | null>(null);
  useEffect(() => {
    deletingTxIdRef.current = deletingTxId;
  }, [deletingTxId]);

  // Start the delete: capture the snapshot, close the reveal, animate the row out.
  const handleDeleteTx = useCallback((id: string) => {
    const txs = transactionsRef.current;
    const index = txs.findIndex((t) => t.id === id);
    if (index === -1) return;
    undoRef.current = { tx: txs[index], index };
    setOpenTxId((cur) => (cur === id ? null : cur));
    if (Platform.OS === 'android') Vibration.vibrate(15);
    setDeletingTxId(id);
    // Failsafe: if the row unmounts before its 220ms exit animation can
    // finish (fast scroll recycling or a month switch), commit the removal
    // anyway so the tx never gets stuck invisible-but-present in state.
    setTimeout(() => {
      if (deletingTxIdRef.current !== id) return;
      setDeletingTxId((cur) => (cur === id ? null : cur));
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }, 650);
  }, []);

  // Restore the deleted transaction at its original position.
  const undoDelete = useCallback(() => {
    const snap = undoRef.current;
    undoRef.current = null;
    if (!snap) return;
    setTransactions((prev) => {
      const next = [...prev];
      next.splice(Math.min(snap.index, next.length), 0, snap.tx);
      return next;
    });
  }, []);

  // Called by the row once its exit animation finishes — commit the removal.
  const handleTxDeleted = useCallback(
    (id: string) => {
      setDeletingTxId((cur) => (cur === id ? null : cur));
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      const snap = undoRef.current;
      if (snap?.tx.id === id) {
        toast('Transaction deleted', {
          action: { label: 'Undo', onPress: undoDelete },
        });
      }
    },
    [toast, undoDelete],
  );

  const closeRevealOnScroll = useCallback(() => setOpenTxId(null), []);

  // Stable render props so the SectionList (a PureComponent) skips re-renders
  // when unrelated HomeScreen state changes (modal open/close, tab switches).
  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <Text
        style={[
          styles.dateGroupHeader,
          isDark && { color: 'rgba(255, 255, 255, 0.5)' },
        ]}
      >
        {section.title}
      </Text>
    ),
    [isDark],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Transaction; index: number }) => (
      <TransactionRow
        tx={item}
        index={index}
        animateIn={!listAnimated}
        open={openTxId === item.id}
        deleting={deletingTxId === item.id}
        onToggle={toggleTxReveal}
        onDelete={handleDeleteTx}
        onDeleted={handleTxDeleted}
        colors={colors}
      />
    ),
    [
      listAnimated,
      openTxId,
      deletingTxId,
      toggleTxReveal,
      handleDeleteTx,
      handleTxDeleted,
      colors,
    ],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyTile}>
          <Wallet size={26} color={isDark ? '#FFFFFF' : '#0B0B12'} strokeWidth={1.8} />
        </View>
        <Text style={[styles.emptyTitle, isDark && { color: '#FFFFFF' }]}>
          {monthly.length === 0 && transactions.length > 0
            ? filter === 'income'
              ? `No income in ${monthDisplayText}`
              : filter === 'expense'
                ? `No expenses in ${monthDisplayText}`
                : `No transactions in ${monthDisplayText}`
            : 'No transactions yet'}
        </Text>
        <Text style={[styles.emptySub, isDark && { color: 'rgba(255, 255, 255, 0.6)' }]}>
          {filter !== 'all'
            ? 'Tap the filter pill again to clear.'
            : 'Tap the + button below to add your first entry.'}
        </Text>
      </View>
    ),
    [isDark, monthly.length, transactions.length, filter, monthDisplayText],
  );

  const handleAdd = useCallback(
    (type: TxType, amount: number, category: string, note: string) => {
      const tx: Transaction = {
        id: genId(),
        amount,
        type,
        category,
        note,
        timestamp: Date.now(),
      };
      setTransactions((prev) => [tx, ...prev]);
      setModal(null);
      setSelectedMonth(monthKey(tx.timestamp));
    },
    [],
  );

  const handleSignedIn = useCallback(
    (token: string, email: string) => {
      setGoogleToken(token);
      setBackup((prev) => {
        const next: BackupState = {
          ...prev,
          googleConnected: true,
          googleEmail: email,
        };
        saveBackup(next);
        return next;
      });
      toast(`Signed in as ${email}`);
    },
    [toast],
  );

  const handleSignedOut = useCallback(() => {
    setGoogleToken(null);
    setBackup((prev) => {
      const next: BackupState = {
        ...prev,
        googleConnected: false,
        googleEmail: null,
      };
      saveBackup(next);
      return next;
    });
    toast('Signed out from Google');
  }, [toast]);

  const handleBackup = useCallback(async () => {
    if (!googleToken) {
      toast('Sign in with Google first');
      return;
    }
    try {
      await uploadBackup(googleToken, {
        schemaVersion: 1,
        user,
        transactions,
        currency: currency.code,
        customCategories,
        backedUpAt: Date.now(),
      });
      setBackup((prev) => {
        const next = { ...prev, lastBackup: Date.now() };
        saveBackup(next);
        return next;
      });
      toast('Backup complete ☁️');
    } catch {
      toast('Backup failed — sign in again');
    }
  }, [googleToken, user, transactions, currency.code, customCategories, toast]);

  const handleRestore = useCallback(async () => {
    if (!googleToken) {
      toast('Sign in with Google first');
      return;
    }
    try {
      const payload = await downloadBackup(googleToken);
      if (!payload) {
        toast('No backup found yet');
        return;
      }
      setTransactions(payload.transactions);
      if (payload.currency) {
        setCurrencyByCode(payload.currency);
      }
      if (payload.customCategories && Array.isArray(payload.customCategories)) {
        await setCustomCategoriesList(payload.customCategories);
      }
      setBackup((prev) => {
        const next = { ...prev, lastBackup: payload.backedUpAt };
        saveBackup(next);
        return next;
      });
      toast(`Restored ${payload.transactions.length} transactions`);
    } catch {
      toast('Restore failed — sign in again');
    }
  }, [googleToken, setCurrencyByCode, toast]);

  return (
    <View style={styles.root}>
      {/* 1. HOME TAB */}
      <View style={[styles.homeContainer, currentTab !== 'home' && styles.hidden]}>
          {/* FULL-SCREEN GRADIENT — no GPU shader. Colors come from the independent
              “Home gradient” setting (ocean/sky); it does NOT change with dark mode.
              Spans the whole home background so the sheet corners rest on a continuous fade. */}
          <LinearGradient
            style={StyleSheet.absoluteFill}
            colors={HOME_GRADIENTS[gradient]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* HEADER HERO (transparent, over the gradient) */}
          <View style={[styles.headerHero, { paddingTop: insets.top + 10 }]}>
            {/* HEADER BAR WITH MONTH PILL */}
            <View style={styles.headerBar}>
              <View style={styles.monthPill}>
                <Pressable
                  onPress={() => changeMonth(-1)}
                  style={({ pressed }) => [styles.chevronBtn, pressed && { opacity: 0.6 }]}
                  hitSlop={8}
                >
                  <ChevronLeft size={18} color="#FFFFFF" strokeWidth={2.4} />
                </Pressable>

                <Text style={styles.monthText}>{monthDisplayText}</Text>

                <Pressable
                  onPress={() => changeMonth(1)}
                  style={({ pressed }) => [styles.chevronBtn, pressed && { opacity: 0.6 }]}
                  hitSlop={8}
                >
                  <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                </Pressable>
              </View>
            </View>

            {/* TOTAL BALANCE — sits directly on the gradient, no card */}
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>

              <View style={styles.amountRow}>
                <View style={styles.rupeeWrap}>
                  <Text style={styles.rupeeSymbol}>{currency.symbol}</Text>
                </View>
                <CountUpText
                  value={balance}
                  format={formatValue}
                  style={styles.balanceAmount}
                />
              </View>

              {/* INCOME & EXPENSE BADGE PILLS */}
              <View style={styles.badgeRow}>
                <Pressable
                  onPress={() => setFilter((cur) => (cur === 'income' ? 'all' : 'income'))}
                  style={({ pressed }) => [
                    styles.statBadge,
                    isDark && { backgroundColor: '#000000', shadowOpacity: 0.3 },
                    filter === 'income' && styles.statBadgeActive,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <TrendingUp size={18} color="#16A34A" strokeWidth={2.4} />
                  <CountUpText
                    value={totals.monthIncome}
                    format={formatAmount}
                    style={[styles.statBadgeText, isDark && { color: '#FFFFFF' }]}
                  />
                </Pressable>

                <Pressable
                  onPress={() => setFilter((cur) => (cur === 'expense' ? 'all' : 'expense'))}
                  style={({ pressed }) => [
                    styles.statBadge,
                    isDark && { backgroundColor: '#000000', shadowOpacity: 0.3 },
                    filter === 'expense' && styles.statBadgeActive,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <TrendingDown size={18} color="#DC2626" strokeWidth={2.4} />
                  <CountUpText
                    value={totals.monthExpense}
                    format={formatAmount}
                    style={[styles.statBadgeText, isDark && { color: '#FFFFFF' }]}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* TRANSACTION LIST CONTAINER SHEET */}
          <View
            style={[
              styles.sheetContainer,
              isDark && { backgroundColor: '#000000' },
            ]}
          >
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.titleGroup}>
                <Text
                  style={[
                    styles.sectionTitle,
                    isDark && { color: '#FFFFFF' },
                  ]}
                >
                  Transaction
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    isDark && { color: 'rgba(255, 255, 255, 0.65)' },
                  ]}
                >
                  {monthly.length} {monthly.length === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
            </View>

            <SectionList
              sections={sections}
              style={styles.listFullBleed}
              keyExtractor={keyExtractor}
              initialNumToRender={10}
              maxToRenderPerBatch={12}
              removeClippedSubviews={Platform.OS === 'android'}
              onScrollBeginDrag={closeRevealOnScroll}
              renderSectionHeader={renderSectionHeader}
              renderItem={renderItem}
              ItemSeparatorComponent={ListSeparator}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: 110 + Math.max(insets.bottom, 16) },
              ]}
              ListEmptyComponent={renderEmpty}
            />
          </View>
        </View>

      {/* 2. ANALYTICS TAB — mount on first visit, then stay mounted */}
      {visitedTabs.has('analytics') && (
        <View style={[{ flex: 1 }, currentTab !== 'analytics' && styles.hidden]}>
          <AnalyticsScreen
            transactions={transactions}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </View>
      )}

      {/* 3. SETTINGS TAB — mount on first visit, then stay mounted */}
      {visitedTabs.has('settings') && (
        <View style={[{ flex: 1 }, currentTab !== 'settings' && styles.hidden]}>
          <SettingsScreen
            backup={backup}
            connected={backup.googleConnected && googleToken !== null}
            onSignedIn={handleSignedIn}
            onSignedOut={handleSignedOut}
            onBackup={handleBackup}
            onRestore={handleRestore}
          />
        </View>
      )}


      {/* FLOATING BOTTOM NAVBAR */}
      <H1Navbar
        activeTab={currentTab}
        onTabChange={handleTabChange}
        onAddPress={() => setModal('expense')}
      />

      {/* ADD TRANSACTION MODAL */}
      <AddTransactionModal
        visible={modal !== null}
        type={modal ?? 'expense'}
        onClose={() => setModal(null)}
        onSave={handleAdd}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F5FB',
  },
  hidden: {
    display: 'none',
  },
  homeContainer: {
    flex: 1,
  },
  headerHero: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  headerBar: {
    alignItems: 'center',
    marginBottom: 14,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  chevronBtn: {
    padding: 2,
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.displaySemi,
    letterSpacing: 0.3,
  },
  balanceSection: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 24,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontFamily: Fonts.bodySemi,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  rupeeWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rupeeSymbol: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: Fonts.display,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 42,
    fontFamily: Fonts.display,
    letterSpacing: -1.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statBadgeActive: {
    borderWidth: 1.5,
    borderColor: '#0B0B12',
  },
  statBadgeText: {
    color: '#0B0B12',
    fontSize: 14,
    fontFamily: Fonts.display,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F0F5FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    gap: 2,
  },
  sectionTitle: {
    color: '#0B0B12',
    fontSize: 22,
    fontFamily: Fonts.display,
  },
  sectionSubtitle: {
    color: 'rgba(11, 11, 18, 0.5)',
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  listContent: {
    paddingTop: 4,
  },
  // Section-header labels keep the 20px inset, matching the floating cards.
  dateGroupHeader: {
    color: 'rgba(11, 11, 18, 0.45)',
    fontSize: 12,
    fontFamily: Fonts.displaySemi,
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 2,
    paddingHorizontal: 20,
  },
  // The list spans the full sheet width while each row card keeps its own
  // 20px margin. Full-bleed here is what lets a revealed row slide out
  // through the real screen edge instead of clipping at an internal column
  // edge on web.
  listFullBleed: {
    marginHorizontal: -20,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTile: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Fonts.displaySemi,
    color: '#0B0B12',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: 'rgba(11, 11, 18, 0.55)',
    textAlign: 'center',
    lineHeight: 19,
  },
});
