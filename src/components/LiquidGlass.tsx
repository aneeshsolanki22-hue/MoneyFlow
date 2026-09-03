import React from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface Props extends ViewProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  intensity?: number;
  tint?: 'dark' | 'light' | 'subtle';
}

export default function LiquidGlass({
  children,
  style,
  borderRadius = 28,
  intensity = 40,
  tint = 'dark',
  ...rest
}: Props) {
  const isDark = tint === 'dark';
  const isLight = tint === 'light';

  // Crystal clear liquid glass gradient overlays
  const gradientColors: readonly [string, string] = isLight
    ? ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.5)']
    : isDark
    ? ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.02)']
    : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)'];

  const borderColor = isLight
    ? 'rgba(255, 255, 255, 0.9)'
    : 'rgba(255, 255, 255, 0.32)';

  return (
    <View
      style={[
        styles.base,
        {
          borderRadius,
          borderColor,
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.55)' : 'rgba(20, 24, 38, 0.22)',
          // @ts-ignore
          backdropFilter: 'blur(25px) saturate(200%)',
          // @ts-ignore
          WebkitBackdropFilter: 'blur(25px) saturate(200%)',
        },
        style,
      ]}
      {...rest}
    >
      {/* NATIVE EXPO BLUR VIEW (iOS / Android) */}
      {Platform.OS !== 'web' && (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : isLight ? 'light' : 'prominent'}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* CRYSTAL GLASS TINT */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* SPECULAR TOP HIGHLIGHT RIM */}
      <View
        style={[
          styles.specularEdge,
          {
            borderRadius,
            borderColor: isLight
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(255, 255, 255, 0.65)',
          },
        ]}
        pointerEvents="none"
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  specularEdge: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 1.5,
    borderLeftWidth: 0.8,
    borderRightWidth: 0.8,
    borderBottomWidth: 0,
  },
});
