import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
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
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  colors?: ThemeColors;
  animateIn?: boolean;
}

const ROW_SHIFT = 24;
const CIRCLE = 40;

const TransactionRow = React.memo<Props>(function TransactionRow({
  tx,
  index,
  open = false,
  onToggle,
  onDelete,
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
  const circleReveal = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    rowReveal.value = withTiming(open ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    circleReveal.value = withDelay(
      open ? 60 : 0,
      withTiming(open ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) }),
    );
  }, [open, rowReveal, circleReveal]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rowReveal.value * ROW_SHIFT }],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleReveal.value,
    transform: [
      { translateX: (1 - circleReveal.value) * -CIRCLE * 1.6 },
      { scale: 0.5 + 0.5 * circleReveal.value },
    ],
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
      style={styles.outer}
    >
      <View style={styles.slot}>
        {/* Swipe Delete Action */}
        <Animated.View style={[styles.deleteCircle, circleStyle]}>
          <Pressable
            onPress={() => onDelete?.(tx.id)}
            style={({ pressed }) => [styles.deleteInner, pressed && styles.deletePressed]}
            hitSlop={6}
          >
            <Trash2 size={18} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </Animated.View>

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
    marginBottom: 2,
  },
  slot: {
    position: 'relative',
  },
  deleteCircle: {
    position: 'absolute',
    left: -(CIRCLE - ROW_SHIFT),
    top: (68 - CIRCLE) / 2,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 10,
  },
  deleteInner: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletePressed: {
    opacity: 0.85,
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
