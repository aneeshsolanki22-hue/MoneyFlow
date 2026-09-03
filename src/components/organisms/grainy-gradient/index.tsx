import React, { memo, useEffect, useMemo } from "react";
import { Platform, useWindowDimensions, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  type FrameInfo,
} from "react-native-reanimated";
import { hexToRgba } from "./helper";
import type { IGrainyGradient } from "./types";

export const GrainyGradient: React.FC<IGrainyGradient> = memo(
  ({
    width: paramsWidth,
    height: paramsHeight,
    colors = ["#02476B", "#011E30", "#0B0B12"],
    speed = 1.5,
    animated = true,
    intensity = 0.08,
    size = 1.5,
    enabled = true,
    amplitude = 0.1,
    brightness = 0,
    style,
  }) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const width = paramsWidth ?? screenWidth;
    const height = paramsHeight ?? screenHeight;

    // Web animated fallback
    const webShift = useSharedValue(0);

    useEffect(() => {
      if (Platform.OS === "web" && animated) {
        webShift.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 4000 / speed, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 4000 / speed, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        );
      }
    }, [animated, speed, webShift]);

    const webAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: 1 + webShift.value * 0.06 },
        { translateY: -webShift.value * 8 },
      ],
      opacity: 0.92 + webShift.value * 0.08,
    }));

    if (Platform.OS === "web") {
      const startCol = colors[0] || "#02476B";
      const endCol = colors[1] || "#011E30";
      return (
        <View style={[{ width, height, overflow: "hidden" }, style]}>
          <Animated.View style={[StyleSheet.absoluteFill, webAnimatedStyle]}>
            <LinearGradient
              colors={[startCol, endCol]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.3, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      );
    }

    // Native Skia execution (continuous GPU shader frame loop)
    const { Canvas, Skia, Fill, Shader } = require("@shopify/react-native-skia");
    const { GRAINY_GRADIENT_SHADER } = require("./conf");

    const shader = useMemo(
      () => Skia.RuntimeEffect.Make(GRAINY_GRADIENT_SHADER),
      [],
    );
    const progress = useSharedValue<number>(0);

    useFrameCallback((info: FrameInfo) => {
      if (animated && info.timeSincePreviousFrame) {
        progress.value += (info.timeSincePreviousFrame / 1000) * speed;
      }
    }, animated);

    const parsedColors = useMemo(() => {
      const result: [number, number, number, number][] = [];
      for (let i = 0; i < 5; i++) {
        result.push(i < colors.length ? hexToRgba(colors[i]!) : [0, 0, 0, 1]);
      }
      return result;
    }, [colors]);

    const uniforms = useDerivedValue(() => ({
      iResolution: [width, height],
      iTime: progress.value,
      uColor0: parsedColors[0],
      uColor1: parsedColors[1],
      uColor2: parsedColors[2],
      uColor3: parsedColors[3],
      uColor4: parsedColors[4],
      uColorCount: Math.min(colors?.length, 5),
      uAmplitude: amplitude,
      uGrainIntensity: intensity,
      uGrainSize: size,
      uGrainEnabled: enabled ? 1 : 0,
      uBrightness: brightness,
    }));

    if (!shader) return null;

    return (
      <Canvas style={[{ width, height }, style]}>
        <Fill>
          <Shader source={shader} uniforms={uniforms} />
        </Fill>
      </Canvas>
    );
  },
);

export default memo(GrainyGradient);
