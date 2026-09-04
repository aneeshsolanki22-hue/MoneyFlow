import React from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { BarChart2, Home, Plus, Settings } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '../theme';

export type TabType = 'home' | 'analytics' | 'settings';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddPress: () => void;
}

/** Lightweight frosted pill — no BlurView, no GPU overdraw. */
function GlassPill({
  children,
  style,
  light = false,
}: {
  children: React.ReactNode;
  style?: object;
  light?: boolean;
}) {
  return (
    <View
      style={[
        styles.glassPillBase,
        light ? styles.glassPillLight : styles.glassPillDark,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default function H1Navbar({ activeTab, onTabChange, onAddPress }: Props) {
  const insets = useSafeAreaInsets();
  const fabScale = useSharedValue(1);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFab = () => {
    if (Platform.OS === 'android') Vibration.vibrate(15);
    onAddPress();
  };

  const handleTab = (tab: TabType) => {
    if (activeTab === tab) return;
    if (Platform.OS === 'android') Vibration.vibrate(10);
    onTabChange(tab);
  };

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.navRow}>
        {/* NAV PILL */}
        <GlassPill style={styles.navPill}>
          {/* HOME TAB */}
          {activeTab === 'home' ? (
            <GlassPill light style={styles.activePill}>
              <Home size={18} color="#1A1A1A" strokeWidth={2.4} />
              <Text style={styles.activeLabel}>Home</Text>
            </GlassPill>
          ) : (
            <Pressable
              onPress={() => handleTab('home')}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Home size={22} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' ? (
            <GlassPill light style={styles.activePill}>
              <BarChart2 size={18} color="#1A1A1A" strokeWidth={2.4} />
              <Text style={styles.activeLabel}>Analytic</Text>
            </GlassPill>
          ) : (
            <Pressable
              onPress={() => handleTab('analytics')}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <BarChart2 size={22} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' ? (
            <GlassPill light style={styles.activePill}>
              <Settings size={18} color="#1A1A1A" strokeWidth={2.4} />
              <Text style={styles.activeLabel}>Setting</Text>
            </GlassPill>
          ) : (
            <Pressable
              onPress={() => handleTab('settings')}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Settings size={22} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}
        </GlassPill>

        {/* FAB ADD BUTTON */}
        <Animated.View style={fabAnimatedStyle}>
          <Pressable
            onPressIn={() => {
              fabScale.value = withSpring(0.9, { damping: 15, stiffness: 350 });
            }}
            onPressOut={() => {
              fabScale.value = withSpring(1, { damping: 12, stiffness: 220 });
            }}
            onPress={handleFab}
          >
            <GlassPill light style={styles.fab}>
              <Plus size={24} color="#1A1A1A" strokeWidth={2.8} />
            </GlassPill>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navRow: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  glassPillBase: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassPillDark: {
    backgroundColor: 'rgba(20, 20, 30, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  glassPillLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  navPill: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  activeLabel: {
    color: '#1A1A1A',
    fontSize: 13.5,
    fontFamily: Fonts.displaySemi,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
});
