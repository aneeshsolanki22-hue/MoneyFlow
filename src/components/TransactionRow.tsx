import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';
import type { Transaction } from '../types';
import { Colors, Fonts, type ThemeColors } from '../theme';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCategories } from '../contexts/CategoryContext';
import { formatTime } from '../utils/format';

interface Props {
  tx: Transaction;
  index: number;
  open?: boolean;
  deleting?: boolean;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDeleted?: (id: string) => void;
  colors?: ThemeColors;
  animateIn?: boolean;
}

// Rows are floating cards inset by 20px (aligned with the sheet content).
// Sliding LEFT by ACTION_W reveals the red delete bar under the card. The
// list itself is full-bleed, so the sliding card exits through the real
// screen edge instead of clipping at an internal column edge.
const ACTION_W = 80;

const TransactionRow = React.memo<Props>(function TransactionRow({
  tx,
  index,
  open = false,
  deleting = false,
  onToggle,
  onDelete,
  onDeleted,
  colors = Colors,
  animateIn = true,
}: Props) {
  const { formatAmount } = useCurrency();
  const { getCategory } = useCategories();
  const def = getCategory(tx.type, tx.category);
  const Icon = def.icon;
  const isIncome = tx.type === 'income';
  const signed =
    isIncome ? `+${formatAmount(tx.amount)}` : `-${formatAmount(tx.amount)}`;

  const rowReveal = useSharedValue(open ? 1 : 0);
  const actionReveal = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    rowReveal.value = withTiming(open ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
    actionReveal.value = withDelay(
      open ? 40 : 0,
      withTiming(open ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) }),
    );
  }, [open, rowReveal, actionReveal]);

  const deleteProgress = useSharedValue(0);

  useEffect(() => {
    if (!deleting || !onDeleted) return;
    deleteProgress.value = withTiming(
      1,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          // withTiming callbacks run on the UI thread on native — hop back
          // to JS before touching React state (same pattern as AnimatedModal).
          runOnJS(onDeleted)(tx.id);
        }
      },
    );
  }, [deleting, deleteProgress, onDeleted, tx.id]);

  const deletingStyle = useAnimatedStyle(() => ({
    opacity: 1 - deleteProgress.value,
    transform: [{ translateX: -deleteProgress.value * 150 }],
  }));

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -rowReveal.value * ACTION_W }],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: actionReveal.value,
    transform: [{ scale: 0.6 + 0.4 * actionReveal.value }],
  }));

  return (
    <Animated.View
      entering={
        animateIn
          ? FadeInDown.delay(Math.min(index * 60, 360))
              .duration(260)
              .easing(Easing.out(Easing.cubic))
          : undefined
      }
      style={[styles.outer, deletingStyle]}
    >
      <View style={styles.slot}>
        {/* Delete bar — same footprint + radius as the card, revealed as it slides left */}
        <View style={styles.deleteBar}>
          <Animated.View style={[styles.deleteAction, actionStyle]}>
            <Pressable
              onPress={() => onDelete?.(tx.id)}
              disabled={deleting}
              accessibilityLabel={`Delete ${tx.category}`}
              style={({ pressed }) => [
                styles.deleteInner,
                pressed && styles.deletePressed,
              ]}
            >
              <Trash2 size={20} color="#FFFFFF" strokeWidth={2.1} />
            </Pressable>
          </Animated.View>
        </View>

        {/* Card Body */}
        <Animated.View
          style={[
            styles.rowShell,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
            rowStyle,
          ]}
        >
          <Pressable
            onPress={() => onToggle?.(tx.id)}
            disabled={deleting}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            {/* Leading 44x44 Icon Tile */}
            <View
              style={[
                styles.leadingIcon,
                { backgroundColor: colors.border },
              ]}
            >
              <Icon size={20} color={colors.textPrimary} strokeWidth={2.2} />
            </View>

            {/* Text Group */}
            <View style={styles.textGroup}>
              <Text
                style={[styles.category, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {tx.category}
              </Text>
              <Text
                style={[styles.desc, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {tx.note || (isIncome ? 'Income credit' : 'Expense payment')}
              </Text>
            </View>

            {/* Trailing Amount & Time */}
            <View style={styles.trailing}>
              <Text
                style={[
                  styles.amount,
                  { color: isIncome ? '#10B981' : '#EF4444' },
                ]}
              >
                {signed}
              </Text>
              <Text style={[styles.time, { color: colors.textDim }]}>
                {formatTime(tx.timestamp)}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    // Floating card: 20px side margin matches the sheet's own content
    // padding, so card edges stay aligned with the section headers.
    marginHorizontal: 20,
    marginBottom: 2,
  },
  slot: {
    position: 'relative',
  },
  deleteBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_W,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  rowShell: {
    borderRadius: 20,
    borderWidth: 1,
  },
  row: {
    height: 68,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowPressed: {
    opacity: 0.88,
  },
  leadingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  category: {
    fontSize: 14.5,
    fontFamily: Fonts.displaySemi,
  },
  desc: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    fontSize: 16,
    fontFamily: Fonts.display,
  },
  time: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
});

export default TransactionRow;
