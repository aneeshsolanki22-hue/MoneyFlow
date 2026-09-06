import React, { memo, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, PieChart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '../theme';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCategories } from '../contexts/CategoryContext';
import type { Transaction, TxType } from '../types';
import { MONTH_NAMES_FULL, monthDate, monthKey } from '../utils/format';

interface Props {
  transactions: Transaction[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

function AnalyticsScreen({
  transactions,
  selectedMonth,
  onMonthChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { formatAmount } = useCurrency();
  const { getCategory } = useCategories();

  const [activeType, setActiveType] = useState<TxType>('expense');

  // Month parsing
  const currentMonthDate = useMemo(() => monthDate(selectedMonth), [selectedMonth]);

  const monthName = MONTH_NAMES_FULL[currentMonthDate.getMonth()];
  const yearName = String(currentMonthDate.getFullYear());

  const changeMonth = (offset: number) => {
    if (Platform.OS === 'android') Vibration.vibrate(10);
    const next = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + offset, 1);
    onMonthChange(monthKey(next.getTime()));
  };

  // Filter transactions for this month and active type (income/expense)
  const currentTxs = useMemo(() => {
    return transactions.filter(
      (t) => monthKey(t.timestamp) === selectedMonth && t.type === activeType,
    );
  }, [transactions, selectedMonth, activeType]);

  const totalAmount = useMemo(() => {
    return currentTxs.reduce((sum, t) => sum + t.amount, 0);
  }, [currentTxs]);

  // Aggregate by category
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of currentTxs) {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }

    const items = [...map.entries()].map(([catName, amount]) => {
      const def = getCategory(activeType, catName);
      const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
      return {
        name: catName,
        amount,
        percentage,
        color: def.color,
      };
    });

    // Sort descending by amount
    items.sort((a, b) => b.amount - a.amount);
    return items;
  }, [currentTxs, totalAmount, activeType, getCategory]);

  // Generate SVG Donut Slices
  const donutPaths = useMemo(() => {
    if (totalAmount <= 0 || categoryStats.length === 0) return [];

    const size = 140;
    const center = size / 2;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.6;

    let cumulativeAngle = 0;

    return categoryStats.map((item) => {
      const fraction = item.amount / totalAmount;
      const angle = Math.min(fraction * 360, 359.99);
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      // Polar to cartesian conversion
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + outerRadius * Math.cos(startRad);
      const y1 = center + outerRadius * Math.sin(startRad);
      const x2 = center + outerRadius * Math.cos(endRad);
      const y2 = center + outerRadius * Math.sin(endRad);

      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ');

      return {
        ...item,
        path,
      };
    });
  }, [categoryStats, totalAmount]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      {/* Static design gradient (expnese tracker.pen: Analytics Page radial #f55d05 glow) */}
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={['#f55d05', '#000000']}
        locations={[0.12, 0.6]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + Math.max(insets.bottom, 16) },
        ]}
      >
        {/* HEADER BAR: < Month 2026 > */}
        <View style={styles.header}>
          <Pressable
            onPress={() => changeMonth(-1)}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>

          <View style={styles.monthHeaderCenter}>
            <Text style={styles.monthTitle}>{monthName}</Text>
            <Text style={styles.yearSub}>{yearName}</Text>
          </View>

          <Pressable
            onPress={() => changeMonth(1)}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>

        {/* SEGMENTED SWITCH: INCOME | EXPENSE */}
        <View style={styles.typeSegment}>
          <Pressable
            onPress={() => setActiveType('income')}
            style={[
              styles.segmentTab,
              activeType === 'income' && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeType === 'income' && styles.segmentTextActive,
              ]}
            >
              Income
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveType('expense')}
            style={[
              styles.segmentTab,
              activeType === 'expense' && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeType === 'expense' && styles.segmentTextActive,
              ]}
            >
              Expense
            </Text>
          </Pressable>
        </View>

        {/* CARD 1: BREAKDOWN DONUT CHART CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {activeType === 'income' ? 'Income' : 'Expense'} · {monthName}
            </Text>
            <Text style={styles.cardTotal}>
              {formatAmount(totalAmount)} total
            </Text>
          </View>

          {categoryStats.length > 0 ? (
            <View style={styles.donutRow}>
              {/* DONUT SVG */}
              <View style={styles.donutBox}>
                <Svg width={140} height={140} viewBox="0 0 140 140">
                  <G>
                    {donutPaths.map((slice, i) => (
                      <Path
                        key={slice.name + i}
                        d={slice.path}
                        fill={slice.color}
                      />
                    ))}
                  </G>
                </Svg>
              </View>

              {/* LEGEND ON RIGHT */}
              <View style={styles.legend}>
                {categoryStats.slice(0, 5).map((c) => (
                  <View key={c.name} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                    <Text style={styles.legendText}>
                      {c.name} · {c.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <PieChart size={32} color="rgba(255, 255, 255, 0.2)" />
              <Text style={styles.emptyText}>No data for {monthName}</Text>
            </View>
          )}
        </View>

        {/* CARD 2: BY CATEGORY PROGRESS BARS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Category · {monthName}</Text>

          {categoryStats.length > 0 ? (
            <View style={styles.categoryList}>
              {categoryStats.map((c) => (
                <View key={c.name} style={styles.categoryProgressRow}>
                  {/* Category Name & Amount */}
                  <View style={styles.categoryProgressHeader}>
                    <Text style={styles.categoryProgName}>{c.name}</Text>
                    <Text style={styles.categoryProgAmount}>
                      {formatAmount(c.amount)}
                    </Text>
                  </View>

                  {/* Progress Bar Track & Fill */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: c.color,
                          width: `${Math.max(c.percentage, 4)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <Text style={styles.emptyText}>
                No category transactions in {monthName}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}export default memo(AnalyticsScreen);

const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#02030A',
    },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthHeaderCenter: {
    alignItems: 'center',
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: Fonts.display,
    letterSpacing: -0.5,
  },
  yearSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    marginTop: 2,
  },
  typeSegment: {
    height: 48,
    backgroundColor: '#121216',
    borderRadius: 14,
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
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
  card: {
    backgroundColor: '#121212',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 18,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.displaySemi,
  },
  cardTotal: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  donutBox: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flex: 1,
    paddingLeft: 20,
    gap: 10,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12.5,
    fontFamily: Fonts.bodySemi,
  },
  categoryList: {
    gap: 16,
    paddingTop: 4,
  },
  categoryProgressRow: {
    gap: 8,
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryProgName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
  categoryProgAmount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontFamily: Fonts.displaySemi,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#2A2A2A',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    fontFamily: Fonts.body,
  },
});
