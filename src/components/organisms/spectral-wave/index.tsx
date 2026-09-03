import React, { useMemo, memo, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Canvas,
  Fill,
  Skia,
  Shader,
  type Uniforms,
} from "@shopify/react-native-skia";
import { SHADER_SOURCE } from "./const";
import { DEFAULTS } from "./conf";
import { colorToRGBA } from "./utils";
import type { ISpectralWave, RGBA } from "./types";

let shader: any = null;
try {
  if (Skia && Skia.RuntimeEffect) {
    shader = Skia.RuntimeEffect.Make(SHADER_SOURCE);
  }
} catch {
  shader = null;
}

export const SpectralWave: React.FC<ISpectralWave> &
  React.FunctionComponent<ISpectralWave> = memo<
  Partial<ISpectralWave> & React.ComponentProps<typeof SpectralWave>
>(
  ({
    width = DEFAULTS.WIDTH,
    height = DEFAULTS.HEIGHT,
    borderRadius = DEFAULTS.BORDER_RADIUS,
    iterations = DEFAULTS.ITERATIONS,
    scale = DEFAULTS.SCALE,
    wavelengthOffset = DEFAULTS.WAVELENGTH_OFFSET,
    wavelengthRange = DEFAULTS.WAVELENGTH_RANGE,
    timeScale = DEFAULTS.TIME_SCALE,
    borderWidth = DEFAULTS.BORDER_WIDTH,
    borderColor = DEFAULTS.BORDER_COLOR,
    borderGlow = DEFAULTS.BORDER_GLOW,
    glowRadius = DEFAULTS.GLOW_RADIUS,
    brightness = DEFAULTS.BRIGHTNESS,
    colors = DEFAULTS.COLORS,
    asChild = false,
    children,
    style,
  }: Partial<ISpectralWave> & React.ComponentProps<typeof SpectralWave>):
    | (React.ReactNode & React.JSX.Element & React.ReactElement)
    | null => {
    const tick = useSharedValue<number>(0);
    useFrameCallback(() => {
      tick.value += 0.016;
    });

    const webWave = useSharedValue(0);
    useEffect(() => {
      if (Platform.OS === 'web') {
        webWave.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2400 / timeScale, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 2400 / timeScale, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        );
      }
    }, [timeScale, webWave]);

    const webAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: -10 + webWave.value * 20 },
        { scale: 1 + webWave.value * 0.08 },
      ],
      opacity: 0.75 + webWave.value * 0.25,
    }));

    const border = useMemo<RGBA>(() => colorToRGBA(borderColor), [borderColor]);

    const useCustom = colors != null ? 1.0 : 0.0;
    const c0 = useMemo<number[]>(
      () => (colors ? colorToRGBA(colors[0]).slice(0, 3) : [0, 0, 0]),
      [colors?.[0]],
    );
    const c1 = useMemo<number[]>(
      () => (colors ? colorToRGBA(colors[1]).slice(0, 3) : [0, 0, 0]),
      [colors?.[1]],
    );
    const c2 = useMemo<number[]>(
      () => (colors ? colorToRGBA(colors[2]).slice(0, 3) : [0, 0, 0]),
      [colors?.[2]],
    );

    const uniforms = useDerivedValue<Uniforms>(() => ({
      uDimensions: [width, height],
      uTick: tick.value,
      uIterations: iterations,
      uScale: scale,
      uWavelengthOffset: wavelengthOffset,
      uWavelengthRange: wavelengthRange,
      uTimeScale: timeScale,
      uBorderWidth: borderWidth,
      uBorderColor: border,
      uBorderGlow: borderGlow,
      uGlowRadius: glowRadius,
      uBrightness: brightness,
      uUseCustomColors: useCustom,
      uColor0: c0,
      uColor1: c1,
      uColor2: c2,
    }));

    const waveColors: [string, string, ...string[]] = colors && colors.length >= 2
      ? [colors[0], colors[1], colors[2] || colors[0]]
      : ['rgba(0, 212, 255, 0.4)', 'rgba(56, 189, 248, 0.25)', 'rgba(2, 132, 199, 0.4)'];

    const renderVisual = () => {
      if (Platform.OS === 'web' || !shader) {
        return (
          <Animated.View style={[StyleSheet.absoluteFill, webAnimatedStyle]}>
            <LinearGradient
              colors={waveColors}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
          </Animated.View>
        );
      }

      return (
        <Canvas style={[StyleSheet.absoluteFill, { borderRadius }]}>
          <Fill>
            <Shader source={shader} uniforms={uniforms} />
          </Fill>
        </Canvas>
      );
    };

    if (asChild) {
      return (
        <View style={[styles.wrapper, { width, height, borderRadius }, style]}>
          {renderVisual()}
          <View style={[styles.content, { borderRadius }]}>{children}</View>
        </View>
      );
    }

    return (
      <View style={[styles.wrapper, { width, height, borderRadius }, style]}>
        {renderVisual()}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  content: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});

export type { ISpectralWave, RGBA } from "./types";
export default SpectralWave;
